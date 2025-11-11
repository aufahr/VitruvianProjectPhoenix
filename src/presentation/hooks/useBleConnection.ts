/**
 * Custom hook for BLE connection state and operations
 * Replaces BLE-related state from MainViewModel
 */

import { useEffect, useState, useCallback } from 'react';
import { create } from 'zustand';
import { VitruvianBleManager } from '../../data/ble/BleManager';
import { ConnectionState, HandleState, WorkoutMetric, RepNotification } from '../../domain/models/Models';

interface ScannedDevice {
  name: string;
  address: string;
  rssi: number;
}

interface BleConnectionState {
  // State
  connectionState: ConnectionState;
  scannedDevices: ScannedDevice[];
  currentMetric: WorkoutMetric | null;
  handleState: HandleState;
  isScanning: boolean;
  isAutoConnecting: boolean;
  connectionError: string | null;
  connectionLostDuringWorkout: boolean;

  // Actions
  setConnectionState: (state: ConnectionState) => void;
  setScannedDevices: (devices: ScannedDevice[]) => void;
  addScannedDevice: (device: ScannedDevice) => void;
  setCurrentMetric: (metric: WorkoutMetric | null) => void;
  setHandleState: (state: HandleState) => void;
  setIsScanning: (scanning: boolean) => void;
  setIsAutoConnecting: (connecting: boolean) => void;
  setConnectionError: (error: string | null) => void;
  setConnectionLostDuringWorkout: (lost: boolean) => void;
  clearScannedDevices: () => void;
  reset: () => void;
}

const useBleConnectionStore = create<BleConnectionState>((set) => ({
  // Initial state
  connectionState: { type: 'disconnected' },
  scannedDevices: [],
  currentMetric: null,
  handleState: HandleState.Released,
  isScanning: false,
  isAutoConnecting: false,
  connectionError: null,
  connectionLostDuringWorkout: false,

  // Actions
  setConnectionState: (state) => set({ connectionState: state }),
  setScannedDevices: (devices) => set({ scannedDevices: devices }),
  addScannedDevice: (device) =>
    set((state) => {
      const exists = state.scannedDevices.some((d) => d.address === device.address);
      if (exists) return state;
      return { scannedDevices: [...state.scannedDevices, device] };
    }),
  setCurrentMetric: (metric) => set({ currentMetric: metric }),
  setHandleState: (state) => set({ handleState: state }),
  setIsScanning: (scanning) => set({ isScanning: scanning }),
  setIsAutoConnecting: (connecting) => set({ isAutoConnecting: connecting }),
  setConnectionError: (error) => set({ connectionError: error }),
  setConnectionLostDuringWorkout: (lost) => set({ connectionLostDuringWorkout: lost }),
  clearScannedDevices: () => set({ scannedDevices: [] }),
  reset: () =>
    set({
      connectionState: { type: 'disconnected' },
      scannedDevices: [],
      currentMetric: null,
      handleState: HandleState.Released,
      isScanning: false,
      isAutoConnecting: false,
      connectionError: null,
      connectionLostDuringWorkout: false,
    }),
}));

// Singleton BLE Manager instance
let bleManagerInstance: VitruvianBleManager | null = null;

const getBleManager = (): VitruvianBleManager => {
  if (!bleManagerInstance) {
    bleManagerInstance = new VitruvianBleManager();
  }
  return bleManagerInstance;
};

/**
 * Custom hook for BLE connection management
 */
export const useBleConnection = () => {
  const store = useBleConnectionStore();
  const [bleManager] = useState(() => getBleManager());
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize BLE manager and set up event listeners
  useEffect(() => {
    const initialize = async () => {
      if (isInitialized) return;

      try {
        await bleManager.initialize();

        // Set up event listeners
        bleManager.on('connectionStateChanged', (state: ConnectionState) => {
          store.setConnectionState(state);
        });

        bleManager.on('deviceScanned', (device: ScannedDevice) => {
          store.addScannedDevice(device);
        });

        bleManager.on('monitorData', (metric: WorkoutMetric) => {
          store.setCurrentMetric(metric);
        });

        bleManager.on('handleStateChanged', (state: HandleState) => {
          store.setHandleState(state);
        });

        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize BLE manager:', error);
        store.setConnectionError(error instanceof Error ? error.message : 'Initialization failed');
      }
    };

    initialize();

    // Cleanup
    return () => {
      bleManager.removeAllListeners();
    };
  }, [bleManager, isInitialized, store]);

  // Start scanning for devices
  const startScanning = useCallback(async () => {
    try {
      store.clearScannedDevices();
      store.setIsScanning(true);
      store.setConnectionError(null);
      await bleManager.startScanning();
    } catch (error) {
      console.error('Failed to start scanning:', error);
      store.setConnectionError(error instanceof Error ? error.message : 'Scan failed');
      store.setIsScanning(false);
    }
  }, [bleManager, store]);

  // Stop scanning
  const stopScanning = useCallback(async () => {
    try {
      await bleManager.stopScanning();
      store.setIsScanning(false);
    } catch (error) {
      console.error('Failed to stop scanning:', error);
    }
  }, [bleManager, store]);

  // Connect to a specific device
  const connectToDevice = useCallback(
    async (deviceAddress: string) => {
      try {
        store.setConnectionError(null);
        await bleManager.connect(deviceAddress);
      } catch (error) {
        console.error('Failed to connect to device:', error);
        store.setConnectionError(error instanceof Error ? error.message : 'Connection failed');
        throw error;
      }
    },
    [bleManager, store]
  );

  // Disconnect from current device
  const disconnect = useCallback(async () => {
    try {
      await bleManager.disconnect();
      store.reset();
    } catch (error) {
      console.error('Failed to disconnect:', error);
      store.setConnectionError(error instanceof Error ? error.message : 'Disconnect failed');
    }
  }, [bleManager, store]);

  // Auto-connect to first available device
  const autoConnect = useCallback(
    async (timeoutMs: number = 30000): Promise<boolean> => {
      try {
        store.setIsAutoConnecting(true);
        store.setConnectionError(null);

        await startScanning();

        // Wait for first device with timeout
        return await new Promise((resolve) => {
          const timeout = setTimeout(() => {
            stopScanning();
            store.setIsAutoConnecting(false);
            store.setConnectionError('No device found');
            resolve(false);
          }, timeoutMs);

          const unsubscribe = useBleConnectionStore.subscribe(
            (state) => state.scannedDevices,
            async (devices) => {
              if (devices.length > 0) {
                clearTimeout(timeout);
                await stopScanning();

                try {
                  await connectToDevice(devices[0].address);
                  store.setIsAutoConnecting(false);
                  resolve(true);
                } catch (error) {
                  store.setIsAutoConnecting(false);
                  resolve(false);
                }

                unsubscribe();
              }
            }
          );
        });
      } catch (error) {
        console.error('Auto-connect failed:', error);
        store.setIsAutoConnecting(false);
        store.setConnectionError(error instanceof Error ? error.message : 'Auto-connect failed');
        return false;
      }
    },
    [startScanning, stopScanning, connectToDevice, store]
  );

  // Enable handle detection for auto-start
  const enableHandleDetection = useCallback(() => {
    bleManager.enableHandleDetection();
  }, [bleManager]);

  // Clear connection error
  const clearConnectionError = useCallback(() => {
    store.setConnectionError(null);
  }, [store]);

  // Dismiss connection lost alert
  const dismissConnectionLostAlert = useCallback(() => {
    store.setConnectionLostDuringWorkout(false);
  }, [store]);

  return {
    // State
    connectionState: store.connectionState,
    scannedDevices: store.scannedDevices,
    currentMetric: store.currentMetric,
    handleState: store.handleState,
    isScanning: store.isScanning,
    isAutoConnecting: store.isAutoConnecting,
    connectionError: store.connectionError,
    connectionLostDuringWorkout: store.connectionLostDuringWorkout,
    isInitialized,

    // Actions
    startScanning,
    stopScanning,
    connectToDevice,
    disconnect,
    autoConnect,
    enableHandleDetection,
    clearConnectionError,
    dismissConnectionLostAlert,

    // BLE Manager instance (for advanced usage)
    bleManager,
  };
};
