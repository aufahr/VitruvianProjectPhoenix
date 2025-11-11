/**
 * Vitruvian BLE Manager - React Native BLE PLX Implementation
 * Migrated from Android Nordic BLE Library
 *
 * Handles BLE communication with Vitruvian device using react-native-ble-plx
 * Key features:
 * - Device scanning and connection management
 * - Characteristic read/write/notify operations
 * - Real-time monitor data polling (100ms)
 * - Keep-alive property polling (500ms)
 * - Handle state detection for Just Lift mode
 * - Rep notification handling
 * - Protocol frame sending/receiving
 */

import {
  BleManager as BleManagerPLX,
  Device,
  Characteristic,
  State,
  BleError,
  Subscription,
} from 'react-native-ble-plx';
import { Platform, PermissionsAndroid } from 'react-native';
import { EventEmitter } from 'events';
import {
  BLE_CONSTANTS,
  ConnectionStatus,
  ConnectionState,
  HandleState,
  WorkoutMetric,
  RepNotification,
  BleManagerCallbacks,
  BlePermissionsStatus,
  HANDLE_DETECTION,
  POLLING_INTERVALS,
  MTU_SIZE,
  POSITION_SPIKE_THRESHOLD,
} from './types';

/**
 * Main BLE Manager class for Vitruvian device communication
 */
export class VitruvianBleManager extends EventEmitter {
  private bleManager: BleManagerPLX;
  private device: Device | null = null;
  private isInitialized = false;

  // Device info
  private currentDeviceName: string | null = null;
  private currentDeviceAddress: string | null = null;

  // Characteristic references
  private nusRxCharacteristic: Characteristic | null = null;
  private monitorCharacteristic: Characteristic | null = null;
  private propertyCharacteristic: Characteristic | null = null;
  private repNotifyCharacteristic: Characteristic | null = null;
  private workoutCmdCharacteristics: Characteristic[] = [];

  // Subscriptions
  private subscriptions: Subscription[] = [];
  private stateSubscription: Subscription | null = null;

  // Polling timers
  private monitorPollingTimer: NodeJS.Timeout | null = null;
  private propertyPollingTimer: NodeJS.Timeout | null = null;

  // Last good positions for filtering spikes
  private lastGoodPosA = 0;
  private lastGoodPosB = 0;

  // Velocity calculation for handle detection
  private lastPositionA = 0;
  private lastTimestamp = 0;

  // State
  private connectionState: ConnectionState = { status: ConnectionStatus.Disconnected };
  private handleState: HandleState = HandleState.Released;

  // Position tracking for tuning
  private minPositionSeen = Number.MAX_VALUE;
  private maxPositionSeen = Number.MIN_VALUE;

  // Callbacks
  private callbacks: BleManagerCallbacks = {};

  // Logging
  private enableDebugLogs = true;

  constructor(callbacks?: BleManagerCallbacks) {
    super();
    this.bleManager = new BleManagerPLX();
    if (callbacks) {
      this.callbacks = callbacks;
    }
  }

  /**
   * Initialize the BLE manager
   * Must be called before any BLE operations
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.log('BLE Manager already initialized');
      return;
    }

    this.log('Initializing BLE Manager...');

    // Subscribe to state changes
    this.stateSubscription = this.bleManager.onStateChange((state) => {
      this.log(`Bluetooth state changed: ${state}`);
      if (state === State.PoweredOn) {
        this.log('Bluetooth is ready');
      } else if (state === State.PoweredOff) {
        this.log('Bluetooth is powered off');
        this.updateConnectionState({ status: ConnectionStatus.Error, message: 'Bluetooth is powered off' });
      }
    }, true);

    this.isInitialized = true;
    this.log('BLE Manager initialized');
  }

  /**
   * Check and request BLE permissions
   * iOS: Automatically handled by Info.plist
   * Android: Request location and Bluetooth permissions
   */
  async checkAndRequestPermissions(): Promise<BlePermissionsStatus> {
    if (Platform.OS === 'ios') {
      // iOS permissions are handled automatically via Info.plist
      const state = await this.bleManager.state();
      return {
        granted: state === State.PoweredOn,
        bluetoothEnabled: state === State.PoweredOn,
      };
    }

    // Android permissions
    if (Platform.OS === 'android') {
      try {
        // Android 12+ requires BLUETOOTH_SCAN, BLUETOOTH_CONNECT
        if (Platform.Version >= 31) {
          const scanPermission = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            {
              title: 'Bluetooth Scan Permission',
              message: 'This app needs Bluetooth scan permission to find your Vitruvian device.',
              buttonPositive: 'OK',
            }
          );

          const connectPermission = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            {
              title: 'Bluetooth Connect Permission',
              message: 'This app needs Bluetooth connect permission to connect to your Vitruvian device.',
              buttonPositive: 'OK',
            }
          );

          const locationPermission = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Location Permission',
              message: 'This app needs location permission for Bluetooth scanning.',
              buttonPositive: 'OK',
            }
          );

          const granted =
            scanPermission === PermissionsAndroid.RESULTS.GRANTED &&
            connectPermission === PermissionsAndroid.RESULTS.GRANTED &&
            locationPermission === PermissionsAndroid.RESULTS.GRANTED;

          const state = await this.bleManager.state();
          return {
            granted,
            bluetoothEnabled: state === State.PoweredOn,
            locationEnabled: granted,
          };
        } else {
          // Android < 12
          const locationPermission = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Location Permission',
              message: 'This app needs location permission for Bluetooth scanning.',
              buttonPositive: 'OK',
            }
          );

          const granted = locationPermission === PermissionsAndroid.RESULTS.GRANTED;
          const state = await this.bleManager.state();

          return {
            granted,
            bluetoothEnabled: state === State.PoweredOn,
            locationEnabled: granted,
          };
        }
      } catch (error) {
        this.logError('Failed to request permissions', error as Error);
        return { granted: false, bluetoothEnabled: false, locationEnabled: false };
      }
    }

    return { granted: false, bluetoothEnabled: false };
  }

  /**
   * Scan for Vitruvian devices
   * Returns a promise that resolves with the first found device
   */
  async scanForDevices(timeoutMs: number = BLE_CONSTANTS.SCAN_TIMEOUT_MS): Promise<Device> {
    this.log('Starting device scan...');
    this.updateConnectionState({ status: ConnectionStatus.Scanning });

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.bleManager.stopDeviceScan();
        reject(new Error('Scan timeout: No Vitruvian device found'));
      }, timeoutMs);

      this.bleManager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          clearTimeout(timeout);
          this.bleManager.stopDeviceScan();
          this.logError('Scan error', error);
          reject(error);
          return;
        }

        if (device && device.name && device.name.startsWith(BLE_CONSTANTS.DEVICE_NAME_PREFIX)) {
          this.log(`Found Vitruvian device: ${device.name} (${device.id})`);
          clearTimeout(timeout);
          this.bleManager.stopDeviceScan();
          resolve(device);
        }
      });
    });
  }

  /**
   * Connect to a device
   */
  async connect(device: Device): Promise<void> {
    try {
      this.log(`Connecting to device: ${device.name} (${device.id})`);
      this.updateConnectionState({
        status: ConnectionStatus.Connecting,
        deviceName: device.name || 'Unknown',
      });

      // Connect to device
      this.device = await device.connect({
        timeout: BLE_CONSTANTS.CONNECTION_TIMEOUT_MS,
      });

      this.currentDeviceName = device.name;
      this.currentDeviceAddress = device.id;

      this.log('Connected! Discovering services...');

      // Discover all services and characteristics
      await this.device.discoverAllServicesAndCharacteristics();

      this.log('Services discovered! Setting up characteristics...');

      // Setup characteristics
      await this.setupCharacteristics();

      // Request MTU for large frame transfers (96-byte program params)
      await this.requestMtu(MTU_SIZE);

      // Enable notifications on all required characteristics
      await this.enableNotifications();

      // Update connection state to Ready
      this.updateConnectionState({
        status: ConnectionStatus.Ready,
        deviceName: this.currentDeviceName || 'Unknown',
        deviceAddress: this.currentDeviceAddress || 'Unknown',
      });

      this.log('Device ready! Starting keep-alive property polling...');

      // Start property polling immediately (keep-alive mechanism)
      this.startPropertyPolling();
    } catch (error) {
      this.logError('Failed to connect', error as Error);
      throw error;
    }
  }

  /**
   * Disconnect from the device
   */
  async disconnect(): Promise<void> {
    try {
      this.log('Disconnecting from device...');

      // Stop all polling
      this.stopPolling();

      // Unsubscribe from all notifications
      this.subscriptions.forEach((subscription) => subscription.remove());
      this.subscriptions = [];

      // Disconnect device
      if (this.device) {
        await this.device.cancelConnection();
        this.device = null;
      }

      // Reset state
      this.currentDeviceName = null;
      this.currentDeviceAddress = null;
      this.nusRxCharacteristic = null;
      this.monitorCharacteristic = null;
      this.propertyCharacteristic = null;
      this.repNotifyCharacteristic = null;
      this.workoutCmdCharacteristics = [];

      this.updateConnectionState({ status: ConnectionStatus.Disconnected });
      this.log('Disconnected');
    } catch (error) {
      this.logError('Failed to disconnect', error as Error);
      throw error;
    }
  }

  /**
   * Setup characteristics after connection
   */
  private async setupCharacteristics(): Promise<void> {
    if (!this.device) {
      throw new Error('Device not connected');
    }

    // Get NUS service
    const nusService = await this.device.servicesForDevice();
    const nusServiceFound = nusService.find((s) => s.uuid.toLowerCase() === BLE_CONSTANTS.NUS_SERVICE_UUID.toLowerCase());

    if (!nusServiceFound) {
      throw new Error('NUS service not found');
    }

    this.log('NUS service found, getting characteristics...');

    // Get all characteristics for NUS service
    const characteristics = await this.device.characteristicsForDevice(BLE_CONSTANTS.NUS_SERVICE_UUID);

    // Log all discovered characteristics
    this.log('=== Discovered Characteristics ===');
    characteristics.forEach((char) => {
      this.log(`  - ${char.uuid} (props: isReadable=${char.isReadable}, isWritableWithResponse=${char.isWritableWithResponse}, isWritableWithoutResponse=${char.isWritableWithoutResponse}, isNotifiable=${char.isNotifiable})`);
    });
    this.log('=== End Characteristics ===');

    // Find required characteristics
    this.nusRxCharacteristic = characteristics.find(
      (c) => c.uuid.toLowerCase() === BLE_CONSTANTS.NUS_RX_CHAR_UUID.toLowerCase()
    ) || null;

    this.monitorCharacteristic = characteristics.find(
      (c) => c.uuid.toLowerCase() === BLE_CONSTANTS.MONITOR_CHAR_UUID.toLowerCase()
    ) || null;

    this.propertyCharacteristic = characteristics.find(
      (c) => c.uuid.toLowerCase() === BLE_CONSTANTS.PROPERTY_CHAR_UUID.toLowerCase()
    ) || null;

    this.repNotifyCharacteristic = characteristics.find(
      (c) => c.uuid.toLowerCase() === BLE_CONSTANTS.REP_NOTIFY_CHAR_UUID.toLowerCase()
    ) || null;

    // If rep notify not found in NUS service, search all services
    if (!this.repNotifyCharacteristic) {
      this.log('Rep notify characteristic not found in NUS service, searching all services...');
      const allServices = await this.device.servicesForDevice();
      for (const service of allServices) {
        const chars = await this.device.characteristicsForDevice(service.uuid);
        const found = chars.find(
          (c) => c.uuid.toLowerCase() === BLE_CONSTANTS.REP_NOTIFY_CHAR_UUID.toLowerCase()
        );
        if (found) {
          this.repNotifyCharacteristic = found;
          this.log(`Found rep notify characteristic in service: ${service.uuid}`);
          break;
        }
      }
    }

    // Validate required characteristics
    if (!this.nusRxCharacteristic) {
      throw new Error('NUS RX characteristic not found');
    }

    if (!this.monitorCharacteristic) {
      throw new Error('Monitor characteristic not found');
    }

    if (!this.repNotifyCharacteristic) {
      this.log('⚠️ Rep notify characteristic not found - rep counting may not work!');
    }

    // Collect workout command characteristics
    const allServices = await this.device.servicesForDevice();
    for (const service of allServices) {
      const chars = await this.device.characteristicsForDevice(service.uuid);
      for (const uuid of BLE_CONSTANTS.WORKOUT_CMD_CHAR_UUIDS) {
        const found = chars.find((c) => c.uuid.toLowerCase() === uuid.toLowerCase());
        if (found) {
          this.workoutCmdCharacteristics.push(found);
          this.log(`Found workout command characteristic: ${uuid}`);
        }
      }
    }

    this.log(`Characteristics setup complete. Found ${this.workoutCmdCharacteristics.length} workout command characteristics.`);
  }

  /**
   * Request MTU size for large frame transfers
   */
  private async requestMtu(mtu: number): Promise<void> {
    try {
      if (!this.device) {
        throw new Error('Device not connected');
      }

      const newMtu = await this.device.requestMTU(mtu);
      this.log(`MTU successfully changed to ${newMtu} bytes`);
    } catch (error) {
      // MTU request may fail on some devices, but we can continue
      this.log(`MTU request failed (continuing anyway): ${error}`);
    }
  }

  /**
   * Enable notifications on all required characteristics
   */
  private async enableNotifications(): Promise<void> {
    if (!this.device) {
      throw new Error('Device not connected');
    }

    this.log('Enabling notifications on all required characteristics...');

    // Get all characteristics from all services
    const allServices = await this.device.servicesForDevice();
    const notifyCharacteristics: Characteristic[] = [];

    for (const service of allServices) {
      const chars = await this.device.characteristicsForDevice(service.uuid);
      for (const uuid of BLE_CONSTANTS.NOTIFY_CHAR_UUIDS) {
        const found = chars.find((c) => c.uuid.toLowerCase() === uuid.toLowerCase());
        if (found && found.isNotifiable) {
          notifyCharacteristics.push(found);
        }
      }
    }

    this.log(`Found ${notifyCharacteristics.length} notifiable characteristics`);

    // Enable notifications on each characteristic
    for (const characteristic of notifyCharacteristics) {
      try {
        if (characteristic.uuid.toLowerCase() === BLE_CONSTANTS.REP_NOTIFY_CHAR_UUID.toLowerCase()) {
          // Special handler for rep notifications
          this.log(`Enabling rep notification on ${characteristic.uuid}...`);
          const subscription = characteristic.monitor((error, char) => {
            if (error) {
              this.logError('Rep notification error', error);
              return;
            }
            if (char && char.value) {
              this.log('🔥 REP NOTIFICATION RECEIVED!');
              this.handleRepNotification(char);
            }
          });
          this.subscriptions.push(subscription);
        } else {
          // Generic handler for other notifications
          this.log(`Enabling notification on ${characteristic.uuid}...`);
          const subscription = characteristic.monitor((error, char) => {
            if (error) {
              this.logError(`Notification error on ${characteristic.uuid}`, error);
              return;
            }
            if (char && char.value) {
              this.log(`[notify ${characteristic.uuid}] ${char.value.length} bytes`);
            }
          });
          this.subscriptions.push(subscription);
        }
        this.log(`  -> Notifications active on ${characteristic.uuid}`);
      } catch (error) {
        this.log(`  -> Failed to enable notifications on ${characteristic.uuid}: ${error}`);
      }
    }

    this.log('Core notifications enabled!');
  }

  /**
   * Start polling monitor characteristic every 100ms
   * Called when workout starts
   */
  startMonitorPolling(): void {
    // Reset position tracking for new workout
    this.minPositionSeen = Number.MAX_VALUE;
    this.maxPositionSeen = Number.MIN_VALUE;

    // Start with handles released; wait for actual grab detection from data
    this.updateHandleState(HandleState.Released);

    // Clear any existing timer
    if (this.monitorPollingTimer) {
      clearInterval(this.monitorPollingTimer);
    }

    this.log('Starting monitor polling (100ms interval)');

    this.monitorPollingTimer = setInterval(async () => {
      try {
        if (this.monitorCharacteristic && this.device) {
          const characteristic = await this.monitorCharacteristic.read();
          if (characteristic.value) {
            this.handleMonitorData(characteristic);
          }
        }
      } catch (error) {
        this.logError('Error in monitor polling', error as Error);
      }
    }, POLLING_INTERVALS.MONITOR);
  }

  /**
   * Start polling property characteristic every 500ms
   * This is a keep-alive mechanism
   */
  startPropertyPolling(): void {
    // Clear any existing timer
    if (this.propertyPollingTimer) {
      clearInterval(this.propertyPollingTimer);
    }

    this.log('Starting property polling (500ms interval)');

    this.propertyPollingTimer = setInterval(async () => {
      try {
        if (this.propertyCharacteristic && this.device) {
          const characteristic = await this.propertyCharacteristic.read();
          if (characteristic.value) {
            // Just log for debugging, we don't need to process this data
            // this.log(`Property data: ${characteristic.value}`);
          }
        }
      } catch (error) {
        // Property polling errors are not critical
        // this.log(`Error in property polling: ${error}`);
      }
    }, POLLING_INTERVALS.PROPERTY);
  }

  /**
   * Stop all polling
   */
  stopPolling(): void {
    const timestamp = Date.now();
    this.log(`[${timestamp}] stopPolling() called`);

    // Log position range seen during workout for threshold tuning
    if (this.minPositionSeen !== Number.MAX_VALUE && this.maxPositionSeen !== Number.MIN_VALUE) {
      this.log('========== POSITION RANGE ANALYSIS ==========');
      this.log(`Min position seen: ${this.minPositionSeen}`);
      this.log(`Max position seen: ${this.maxPositionSeen}`);
      this.log(`Handle grabbed threshold: ${HANDLE_DETECTION.GRABBED_THRESHOLD} (pos > 8.0 = grabbed)`);
      this.log(`Handle rest threshold: ${HANDLE_DETECTION.REST_THRESHOLD} (pos < 2.5 = at rest)`);
      this.log(`Velocity threshold: ${HANDLE_DETECTION.VELOCITY_THRESHOLD} (vel > 100 = moving)`);
      this.log('===========================================');
    }

    if (this.monitorPollingTimer) {
      clearInterval(this.monitorPollingTimer);
      this.monitorPollingTimer = null;
      this.log('Monitor polling stopped');
    }

    if (this.propertyPollingTimer) {
      clearInterval(this.propertyPollingTimer);
      this.propertyPollingTimer = null;
      this.log('Property polling stopped');
    }
  }

  /**
   * Enable Just Lift waiting mode
   * Call this after workout completion to start watching for handle grab
   */
  enableJustLiftWaitingMode(): void {
    this.log('Enabling Just Lift waiting mode - position hysteresis with velocity confirmation (vel>100)');
    this.updateHandleState(HandleState.Released);
  }

  /**
   * Send a command to the device
   * CRITICAL: Frames must be sent whole, not split!
   */
  async sendCommand(data: Uint8Array): Promise<void> {
    try {
      if (!this.nusRxCharacteristic) {
        throw new Error('NUS RX characteristic not available');
      }

      if (!this.device) {
        throw new Error('Device not connected');
      }

      const timestamp = Date.now();
      this.log(`[${timestamp}] === SENDING COMMAND ===`);
      this.log(`Command size: ${data.length} bytes`);
      this.log(`Hex: ${this.bufferToHex(data)}`);

      // Show first 64 bytes formatted for easy reading
      if (data.length > 0) {
        const preview = data.slice(0, 64);
        const formatted = this.formatHexDump(preview);
        this.log(`First ${preview.length} bytes:\n${formatted}`);
      }

      // Convert Uint8Array to base64 string for BLE PLX
      const base64Data = this.uint8ArrayToBase64(data);

      // Write to characteristic (without response for faster transmission)
      await this.nusRxCharacteristic.writeWithoutResponse(base64Data);

      const afterWrite = Date.now();
      this.log(`[${afterWrite}] Write completed (took ${afterWrite - timestamp}ms)`);
      this.log('=== COMMAND SENT ===');
    } catch (error) {
      this.logError('Failed to send command', error as Error);
      throw error;
    }
  }

  /**
   * Handle monitor data from characteristic
   */
  private handleMonitorData(characteristic: Characteristic): void {
    try {
      if (!characteristic.value) {
        this.log('Monitor data is null!');
        return;
      }

      // Convert base64 to Uint8Array
      const bytes = this.base64ToUint8Array(characteristic.value);

      if (bytes.length < 16) {
        this.log(`Monitor data too short: ${bytes.length} bytes`);
        return;
      }

      // Parse the monitor data packet (matching device.js parseMonitorData)
      // Format: u16[0-1]=ticks, u16[2]=posA, u16[4]=loadA*100, u16[5]=posB, u16[7]=loadB*100
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

      const f0 = view.getUint16(0, true); // little-endian
      const f1 = view.getUint16(2, true);
      const f2 = view.getUint16(4, true);
      const f4 = view.getUint16(8, true);
      const f5 = view.getUint16(10, true);
      const f7 = view.getUint16(14, true);

      // Reconstruct 32-bit tick counter
      const ticks = f0 + (f1 << 16);

      // Position values (filter spikes > 50000)
      let positionA = f2;
      let positionB = f5;

      if (positionA > POSITION_SPIKE_THRESHOLD) {
        positionA = this.lastGoodPosA;
      } else {
        this.lastGoodPosA = positionA;
      }

      if (positionB > POSITION_SPIKE_THRESHOLD) {
        positionB = this.lastGoodPosB;
      } else {
        this.lastGoodPosB = positionB;
      }

      // Load in kg (device sends kg * 100)
      const loadA = f4 / 100.0;
      const loadB = f7 / 100.0;

      // Calculate velocity for handle detection
      const currentTime = Date.now();
      let velocityA = 0;

      if (this.lastTimestamp > 0) {
        const deltaTime = (currentTime - this.lastTimestamp) / 1000.0; // Convert to seconds
        const deltaPos = positionA - this.lastPositionA;
        if (deltaTime > 0) {
          velocityA = Math.abs(deltaPos / deltaTime); // Absolute velocity
        }
      }

      this.lastPositionA = positionA;
      this.lastTimestamp = currentTime;

      // Enhanced logging for debugging (sample every 100 ticks to reduce spam)
      if (ticks < 1000 || ticks % 100 === 0) {
        this.log('=== MONITOR DATA DEBUG ===');
        this.log(`Parsed f4 (loadA*100): ${f4}`);
        this.log(`Parsed f7 (loadB*100): ${f7}`);
        this.log(`LoadA (kg): ${loadA.toFixed(2)}`);
        this.log(`LoadB (kg): ${loadB.toFixed(2)}`);
        this.log(`Total Load: ${(loadA + loadB).toFixed(2)} kg`);
        this.log(`PositionA: ${positionA}, PositionB: ${positionB}`);
        this.log(`VelocityA: ${velocityA.toFixed(2)}`);
        this.log(`Ticks: ${ticks}`);
        this.log('==========================');
      }

      const metric: WorkoutMetric = {
        timestamp: currentTime,
        loadA,
        loadB,
        positionA,
        positionB,
        ticks,
        velocityA,
        totalLoad: loadA + loadB,
      };

      // Emit monitor data
      this.emitMonitorData(metric);

      // Analyze and update handle state
      const newHandleState = this.analyzeHandleState(metric);
      if (newHandleState !== this.handleState) {
        this.updateHandleState(newHandleState);
      }
    } catch (error) {
      this.logError('Error parsing monitor data', error as Error);
    }
  }

  /**
   * Handle rep notification data
   * Based on reference web app: parses u16 array with top counter and complete counter
   * u16[0] = top counter (reached top of range)
   * u16[2] = complete counter (rep complete at bottom)
   */
  private handleRepNotification(characteristic: Characteristic): void {
    try {
      if (!characteristic.value) {
        return;
      }

      const bytes = this.base64ToUint8Array(characteristic.value);

      if (bytes.length < 6) {
        this.log(`Rep notification too short: ${bytes.length} bytes`);
        return;
      }

      // Parse as u16 little-endian array
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      const topCounter = view.getUint16(0, true);
      const completeCounter = view.getUint16(4, true);

      this.log(`Rep notification: top=${topCounter}, complete=${completeCounter}, hex=${this.bufferToHex(bytes)}`);

      const repData: RepNotification = {
        topCounter,
        completeCounter,
        rawData: bytes,
        timestamp: Date.now(),
      };

      this.emitRepNotification(repData);
    } catch (error) {
      this.logError('Error parsing rep notification', error as Error);
    }
  }

  /**
   * Analyze handle state using simple position-based hysteresis
   * with velocity confirmation for Just Lift mode
   */
  private analyzeHandleState(metric: WorkoutMetric): HandleState {
    const posA = metric.positionA;
    const velocity = Math.abs(metric.velocityA);

    // Track position range for post-workout tuning
    this.minPositionSeen = Math.min(this.minPositionSeen, posA);
    this.maxPositionSeen = Math.max(this.maxPositionSeen, posA);

    const currentState = this.handleState;

    // Simple hysteresis with velocity check
    if (currentState === HandleState.Released || currentState === HandleState.Moving) {
      if (posA > HANDLE_DETECTION.GRABBED_THRESHOLD) {
        // Position indicates grabbed - check velocity to confirm user is actively moving
        const hasMovement = velocity > HANDLE_DETECTION.VELOCITY_THRESHOLD;
        this.log(`GRAB CHECK: pos=${posA} > ${HANDLE_DETECTION.GRABBED_THRESHOLD}, vel=${velocity.toFixed(2)}, moving=${hasMovement}`);
        if (hasMovement) {
          this.log(`GRAB CONFIRMED: pos=${posA}, vel=${velocity.toFixed(2)}`);
          return HandleState.Grabbed;
        } else {
          // Position extended but no significant movement yet
          return HandleState.Moving;
        }
      } else {
        return HandleState.Released;
      }
    } else if (currentState === HandleState.Grabbed) {
      if (posA < HANDLE_DETECTION.REST_THRESHOLD) {
        this.log(`RELEASE DETECTED: pos=${posA} < ${HANDLE_DETECTION.REST_THRESHOLD}`);
        return HandleState.Released;
      } else {
        return HandleState.Grabbed;
      }
    }

    return currentState;
  }

  /**
   * Update connection state and notify callbacks
   */
  private updateConnectionState(state: ConnectionState): void {
    this.connectionState = state;
    this.emit('connectionStateChange', state);
    if (this.callbacks.onConnectionStateChange) {
      this.callbacks.onConnectionStateChange(state);
    }
  }

  /**
   * Update handle state and notify callbacks
   */
  private updateHandleState(state: HandleState): void {
    this.handleState = state;
    this.log(`Handle state changed: ${state}`);
    this.emit('handleStateChange', state);
    if (this.callbacks.onHandleStateChange) {
      this.callbacks.onHandleStateChange(state);
    }
  }

  /**
   * Emit monitor data and notify callbacks
   */
  private emitMonitorData(metric: WorkoutMetric): void {
    this.emit('monitorData', metric);
    if (this.callbacks.onMonitorData) {
      this.callbacks.onMonitorData(metric);
    }
  }

  /**
   * Emit rep notification and notify callbacks
   */
  private emitRepNotification(notification: RepNotification): void {
    this.emit('repNotification', notification);
    if (this.callbacks.onRepNotification) {
      this.callbacks.onRepNotification(notification);
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.log('Cleaning up BLE Manager resources');

    // Stop polling
    this.stopPolling();

    // Disconnect if connected
    if (this.device) {
      await this.disconnect();
    }

    // Remove state subscription
    if (this.stateSubscription) {
      this.stateSubscription.remove();
      this.stateSubscription = null;
    }

    // Destroy BLE manager
    await this.bleManager.destroy();
    this.isInitialized = false;

    this.log('BLE Manager cleanup complete');
  }

  // Utility methods

  /**
   * Convert Uint8Array to base64 string
   */
  private uint8ArrayToBase64(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert base64 string to Uint8Array
   */
  private base64ToUint8Array(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Convert buffer to hex string
   */
  private bufferToHex(buffer: Uint8Array): string {
    return Array.from(buffer)
      .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
      .join(' ');
  }

  /**
   * Format hex dump for logging
   */
  private formatHexDump(buffer: Uint8Array): string {
    const lines: string[] = [];
    for (let i = 0; i < buffer.length; i += 16) {
      const chunk = buffer.slice(i, i + 16);
      const hex = Array.from(chunk)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(' ');
      lines.push(`  ${hex}`);
    }
    return lines.join('\n');
  }

  /**
   * Log message
   */
  private log(message: string): void {
    if (this.enableDebugLogs) {
      console.log(`[VitruvianBLE] ${message}`);
    }
  }

  /**
   * Log error
   */
  private logError(message: string, error: Error): void {
    console.error(`[VitruvianBLE] ${message}:`, error);
    if (this.callbacks.onError) {
      this.callbacks.onError(error);
    }
  }

  // Getters

  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  getHandleState(): HandleState {
    return this.handleState;
  }

  getDevice(): Device | null {
    return this.device;
  }

  isConnected(): boolean {
    return this.connectionState.status === ConnectionStatus.Ready;
  }

  setDebugLogging(enabled: boolean): void {
    this.enableDebugLogs = enabled;
  }

  setCallbacks(callbacks: BleManagerCallbacks): void {
    this.callbacks = callbacks;
  }
}

// Export singleton instance
let bleManagerInstance: VitruvianBleManager | null = null;

export const getBleManager = (): VitruvianBleManager => {
  if (!bleManagerInstance) {
    bleManagerInstance = new VitruvianBleManager();
  }
  return bleManagerInstance;
};

export const resetBleManager = (): void => {
  if (bleManagerInstance) {
    bleManagerInstance.cleanup();
    bleManagerInstance = null;
  }
};
