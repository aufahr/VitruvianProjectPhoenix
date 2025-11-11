/**
 * BLE Repository - Manages Bluetooth communication with Vitruvian device
 * Migrated from Android Kotlin BleRepositoryImpl to React Native TypeScript
 */

import { EventEmitter } from 'events';
import { Device } from 'react-native-ble-plx';
import { VitruvianBleManager, getBleManager } from '../ble/BleManager';
import {
  ConnectionStatus,
  ConnectionState,
  HandleState,
  WorkoutMetric,
  RepNotification,
  BLE_CONSTANTS,
} from '../ble/types';
import { WorkoutParameters } from '../../domain/models/Models';
import { buildInitCommand, buildInitPreset, buildProgramParams, buildEchoControl, buildColorScheme } from '../../utils/protocolBuilder';
import { ColorScheme, COLOR_SCHEMES } from '../../utils/colorSchemes';

/**
 * BLE Repository interface
 * Provides high-level BLE operations for the Vitruvian device
 */
export interface IBleRepository {
  // State observables via EventEmitter
  on(event: 'connectionStateChange', listener: (state: ConnectionState) => void): this;
  on(event: 'monitorData', listener: (metric: WorkoutMetric) => void): this;
  on(event: 'repNotification', listener: (notification: RepNotification) => void): this;
  on(event: 'handleStateChange', listener: (state: HandleState) => void): this;
  off(event: string, listener: (...args: any[]) => void): this;

  // Connection state getters
  getConnectionState(): ConnectionState;
  getHandleState(): HandleState;

  // BLE operations
  startScanning(): Promise<void>;
  stopScanning(): Promise<void>;
  connectToDevice(deviceAddress: string): Promise<void>;
  disconnect(): Promise<void>;
  sendInitSequence(): Promise<void>;
  startWorkout(params: WorkoutParameters): Promise<void>;
  stopWorkout(): Promise<void>;
  setColorScheme(schemeIndex: number): Promise<void>;
  testOfficialAppProtocol(): Promise<void>;
  enableHandleDetection(): void;
  enableJustLiftWaitingMode(): void;
}

/**
 * BLE Repository implementation
 * Wraps VitruvianBleManager and provides repository-level logic
 */
class BleRepositoryImpl extends EventEmitter implements IBleRepository {
  private bleManager: VitruvianBleManager;
  private currentConnectionState: ConnectionState = { status: ConnectionStatus.Disconnected };
  private currentHandleState: HandleState = HandleState.Released;
  private scannedDevices: Map<string, Device> = new Map();
  private isScanning = false;

  constructor() {
    super();
    this.bleManager = getBleManager();
    this.setupBleManagerListeners();
  }

  /**
   * Setup listeners for BLE Manager events
   */
  private setupBleManagerListeners(): void {
    // Connection state changes
    this.bleManager.on('connectionStateChange', (state: ConnectionState) => {
      console.log('[BleRepository] Connection state changed:', state);
      this.currentConnectionState = state;
      this.emit('connectionStateChange', state);
    });

    // Monitor data
    this.bleManager.on('monitorData', (metric: WorkoutMetric) => {
      this.emit('monitorData', metric);
    });

    // Rep notifications
    this.bleManager.on('repNotification', (notification: RepNotification) => {
      console.log('[BleRepository] Rep notification forwarded:', notification);
      this.emit('repNotification', notification);
    });

    // Handle state changes
    this.bleManager.on('handleStateChange', (state: HandleState) => {
      console.log('[BleRepository] Handle state changed:', state);
      this.currentHandleState = state;
      this.emit('handleStateChange', state);
    });
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return this.currentConnectionState;
  }

  /**
   * Get current handle state
   */
  getHandleState(): HandleState {
    return this.currentHandleState;
  }

  /**
   * Start scanning for Vitruvian devices
   */
  async startScanning(): Promise<void> {
    try {
      console.log('[BleRepository] startScanning() called');

      if (this.isScanning) {
        console.log('[BleRepository] Already scanning');
        return;
      }

      // Initialize BLE manager if needed
      await this.bleManager.initialize();

      // Check permissions
      const permissions = await this.bleManager.checkAndRequestPermissions();
      if (!permissions.granted) {
        throw new Error('Bluetooth permissions not granted');
      }

      if (!permissions.bluetoothEnabled) {
        throw new Error('Bluetooth is not enabled');
      }

      this.isScanning = true;
      this.scannedDevices.clear();
      this.currentConnectionState = { status: ConnectionStatus.Scanning };
      this.emit('connectionStateChange', this.currentConnectionState);

      console.log('[BleRepository] Starting device scan...');

      // Start scanning (will timeout after BLE_CONSTANTS.SCAN_TIMEOUT_MS)
      // Note: We don't await here because scanForDevices resolves with first found device
      // Instead we just initiate the scan and let the BLE manager handle device discovery
      this.bleManager.scanForDevices(BLE_CONSTANTS.SCAN_TIMEOUT_MS)
        .then((device) => {
          console.log(`[BleRepository] Found device: ${device.name} (${device.id})`);
          this.scannedDevices.set(device.id, device);
          // Emit scanned device event (for UI to display)
          this.emit('deviceFound', device);
        })
        .catch((error) => {
          console.error('[BleRepository] Scan error:', error);
          this.isScanning = false;
          if (this.currentConnectionState.status === ConnectionStatus.Scanning) {
            this.currentConnectionState = { status: ConnectionStatus.Disconnected };
            this.emit('connectionStateChange', this.currentConnectionState);
          }
        });

      console.log('[BleRepository] Scan started');
    } catch (error) {
      console.error('[BleRepository] Failed to start scanning:', error);
      this.isScanning = false;
      const errorState: ConnectionState = {
        status: ConnectionStatus.Error,
        message: error instanceof Error ? error.message : 'Failed to start scanning',
        error: error instanceof Error ? error : new Error(String(error)),
      };
      this.currentConnectionState = errorState;
      this.emit('connectionStateChange', errorState);
      throw error;
    }
  }

  /**
   * Stop scanning for devices
   */
  async stopScanning(): Promise<void> {
    try {
      if (!this.isScanning) {
        return;
      }

      console.log('[BleRepository] Stopping scan...');
      // BLE PLX doesn't have a direct stopScan method on the manager
      // The scan automatically stops when a device is found or timeout occurs
      this.isScanning = false;

      if (this.currentConnectionState.status === ConnectionStatus.Scanning) {
        this.currentConnectionState = { status: ConnectionStatus.Disconnected };
        this.emit('connectionStateChange', this.currentConnectionState);
      }

      console.log('[BleRepository] Scan stopped');
    } catch (error) {
      console.error('[BleRepository] Error stopping scan:', error);
    }
  }

  /**
   * Connect to a device by address
   */
  async connectToDevice(deviceAddress: string): Promise<void> {
    try {
      console.log(`[BleRepository] connectToDevice() called for: ${deviceAddress}`);

      // Stop scanning first
      await this.stopScanning();

      // Get the device from scanned devices
      const device = this.scannedDevices.get(deviceAddress);
      if (!device) {
        throw new Error(`Device not found: ${deviceAddress}`);
      }

      console.log(`[BleRepository] Connecting to: ${device.name} (${device.id})`);
      this.currentConnectionState = {
        status: ConnectionStatus.Connecting,
        deviceName: device.name || 'Unknown',
      };
      this.emit('connectionStateChange', this.currentConnectionState);

      // Connect to device (BleManager will emit connectionStateChange events)
      await this.bleManager.connect(device);

      // After connection is ready, send INIT sequence
      console.log('[BleRepository] Device connected! Waiting 2 seconds before INIT...');
      await this.delay(2000);

      console.log('[BleRepository] Sending INIT sequence...');
      await this.sendInitSequence();

      console.log('[BleRepository] Device fully initialized and ready!');
    } catch (error) {
      console.error('[BleRepository] Failed to connect:', error);
      const errorState: ConnectionState = {
        status: ConnectionStatus.Error,
        message: error instanceof Error ? error.message : 'Connection failed',
        error: error instanceof Error ? error : new Error(String(error)),
      };
      this.currentConnectionState = errorState;
      this.emit('connectionStateChange', errorState);
      throw error;
    }
  }

  /**
   * Disconnect from the device
   */
  async disconnect(): Promise<void> {
    try {
      console.log('[BleRepository] Disconnecting from device...');
      await this.bleManager.disconnect();
      this.currentConnectionState = { status: ConnectionStatus.Disconnected };
      this.emit('connectionStateChange', this.currentConnectionState);
      console.log('[BleRepository] Disconnected');
    } catch (error) {
      console.error('[BleRepository] Error disconnecting:', error);
      throw error;
    }
  }

  /**
   * Send INIT sequence to device
   * Required after connection to initialize device LEDs and state
   */
  async sendInitSequence(): Promise<void> {
    try {
      const state = this.currentConnectionState;
      const deviceName = state.status === ConnectionStatus.Ready ? state.deviceName : 'Unknown';
      const deviceAddress = state.status === ConnectionStatus.Ready ? state.deviceAddress : '';

      console.log('[BleRepository] === Starting INIT sequence ===');
      console.log(`[BleRepository] Device: ${deviceName} (${deviceAddress})`);

      // Send initial command
      console.log('[BleRepository] Sending init command (4 bytes)...');
      const initCommand = buildInitCommand();
      await this.bleManager.sendCommand(initCommand);
      await this.delay(200);

      console.log('[BleRepository] Init command sent, waiting before preset...');

      // Send init preset
      console.log('[BleRepository] Sending init preset (34 bytes)...');
      const initPreset = buildInitPreset();
      await this.bleManager.sendCommand(initPreset);
      await this.delay(200);

      console.log('[BleRepository] === INIT sequence completed successfully ===');
    } catch (error) {
      console.error('[BleRepository] Failed to send init sequence:', error);
      throw error;
    }
  }

  /**
   * Start workout with given parameters
   */
  async startWorkout(params: WorkoutParameters): Promise<void> {
    try {
      const state = this.currentConnectionState;
      const deviceName = state.status === ConnectionStatus.Ready ? state.deviceName : 'Unknown';
      const deviceAddress = state.status === ConnectionStatus.Ready ? state.deviceAddress : '';

      console.log(`[BleRepository] Starting workout with type: ${params.workoutType.type}`);

      // MATCH WEB APP EXACTLY:
      // - Program modes (Old School, Pump, TUT): Send ONLY program params (96 bytes)
      // - Echo mode: Send ONLY echo control (40 bytes)
      if (params.workoutType.type === 'echo') {
        // Echo mode: Send ONLY echo control frame (web app: device.js line 328)
        console.log('[BleRepository] Echo mode: sending ONLY echo control frame (40 bytes)');
        const echoFrame = buildEchoControl(
          params.workoutType.level,
          params.warmupReps || 0,
          params.reps,
          params.isJustLift || false,
          params.workoutType.eccentricLoad
        );
        console.log(
          `[BleRepository] Echo params: Level=${params.workoutType.level}, ` +
          `Eccentric=${params.workoutType.eccentricLoad}%, Reps=${params.reps}, JustLift=${params.isJustLift}`
        );
        await this.bleManager.sendCommand(echoFrame);
        await this.delay(100);
      } else if (params.workoutType.type === 'program') {
        // Program mode: Send ONLY program params (web app: device.js line 283)
        console.log('[BleRepository] Program mode: sending ONLY program params (96 bytes)');
        const programFrame = buildProgramParams(params);
        console.log(
          `[BleRepository] Program params: Mode=${params.workoutType.mode}, ` +
          `Weight=${params.weightPerCableKg}kg, Reps=${params.reps}, ` +
          `JustLift=${params.isJustLift}, Progression=${params.progressionRegressionKg}kg`
        );
        await this.bleManager.sendCommand(programFrame);
        await this.delay(100);
      }

      console.log('[BleRepository] Workout command sent successfully!');

      // Start monitor polling for workout data (100ms interval)
      console.log('[BleRepository] Starting monitor polling for workout...');
      this.bleManager.startMonitorPolling();
    } catch (error) {
      console.error('[BleRepository] Failed to start workout:', error);
      throw error;
    }
  }

  /**
   * Stop workout and release tension
   */
  async stopWorkout(): Promise<void> {
    try {
      const timestamp = Date.now();
      console.log('[BleRepository] ============================================');
      console.log(`[BleRepository] stopWorkout() called at timestamp: ${timestamp}`);
      console.log('[BleRepository] ============================================');

      // CRITICAL SAFETY: Stop all polling BEFORE sending INIT command
      const beforePollingStop = Date.now();
      console.log(`[BleRepository] [${beforePollingStop}] Stopping polling jobs...`);
      this.bleManager.stopPolling();
      const afterPollingStop = Date.now();
      console.log(`[BleRepository] [${afterPollingStop}] Polling stopped (took ${afterPollingStop - beforePollingStop}ms)`);

      // Send INIT command to stop workout and release resistance
      const initCommand = buildInitCommand();
      const beforeInitSend = Date.now();
      console.log(`[BleRepository] [${beforeInitSend}] Sending INIT command to release tension...`);
      await this.bleManager.sendCommand(initCommand);
      const afterInitSend = Date.now();
      console.log(`[BleRepository] [${afterInitSend}] INIT command sent (took ${afterInitSend - beforeInitSend}ms)`);

      const finalTimestamp = Date.now();
      console.log(`[BleRepository] [${finalTimestamp}] Workout stopped - Total time: ${finalTimestamp - timestamp}ms`);
      console.log('[BleRepository] ============================================');
    } catch (error) {
      console.error('[BleRepository] FAILED to stop workout:', error);
      throw error;
    }
  }

  /**
   * Set LED color scheme
   */
  async setColorScheme(schemeIndex: number): Promise<void> {
    try {
      if (schemeIndex < 0 || schemeIndex >= COLOR_SCHEMES.length) {
        throw new Error(`Invalid color scheme index: ${schemeIndex}`);
      }

      const scheme = COLOR_SCHEMES[schemeIndex];
      console.log(`[BleRepository] Setting color scheme: ${scheme.name}`);

      const colorFrame = buildColorScheme(scheme.brightness, scheme.colors);
      await this.bleManager.sendCommand(colorFrame);

      console.log(`[BleRepository] Color scheme set to: ${scheme.name}`);
    } catch (error) {
      console.error('[BleRepository] Failed to set color scheme:', error);
      throw error;
    }
  }

  /**
   * Test official app protocol
   */
  async testOfficialAppProtocol(): Promise<void> {
    try {
      console.log('[BleRepository] Starting official app protocol test');
      // This would be implemented if needed for testing
      console.log('[BleRepository] Official app protocol test not implemented in TypeScript version');
    } catch (error) {
      console.error('[BleRepository] Failed to test official app protocol:', error);
      throw error;
    }
  }

  /**
   * Enable handle detection for auto-start
   */
  enableHandleDetection(): void {
    console.log('[BleRepository] Enabling handle detection - starting monitor polling for auto-start');
    this.bleManager.startMonitorPolling();
  }

  /**
   * Enable Just Lift waiting mode for position-based handle detection
   */
  enableJustLiftWaitingMode(): void {
    console.log('[BleRepository] Enabling Just Lift waiting mode - position-based handle detection');
    this.bleManager.enableJustLiftWaitingMode();
  }

  /**
   * Helper to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export singleton instance
let bleRepositoryInstance: BleRepositoryImpl | null = null;

export const getBleRepository = (): IBleRepository => {
  if (!bleRepositoryInstance) {
    bleRepositoryInstance = new BleRepositoryImpl();
  }
  return bleRepositoryInstance;
};

export const resetBleRepository = (): void => {
  bleRepositoryInstance = null;
};

// Export types
export type { IBleRepository };
export { BleRepositoryImpl };
