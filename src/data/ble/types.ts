/**
 * BLE-related type definitions for Vitruvian device communication
 * Migrated from Android Nordic BLE to React Native BLE PLX
 */

import { Device, Characteristic } from 'react-native-ble-plx';

/**
 * BLE Service and Characteristic UUIDs
 * Ported from BleConstants.kt
 */
export const BLE_CONSTANTS = {
  // Service UUIDs
  GATT_SERVICE_UUID: '00001801-0000-1000-8000-00805f9b34fb',
  NUS_SERVICE_UUID: '6e400001-b5a3-f393-e0a9-e50e24dcca9e',

  // Characteristic UUIDs
  NUS_RX_CHAR_UUID: '6e400002-b5a3-f393-e0a9-e50e24dcca9e',
  MONITOR_CHAR_UUID: '90e991a6-c548-44ed-969b-eb541014eae3',
  PROPERTY_CHAR_UUID: '5fa538ec-d041-42f6-bbd6-c30d475387b7',
  REP_NOTIFY_CHAR_UUID: '8308f2a6-0875-4a94-a86f-5c5c5e1b068a',

  NOTIFY_CHAR_UUIDS: [
    '383f7276-49af-4335-9072-f01b0f8acad6',
    '74e994ac-0e80-4c02-9cd0-76cb31d3959b',
    '67d0dae0-5bfc-4ea2-acc9-ac784dee7f29',
    '8308f2a6-0875-4a94-a86f-5c5c5e1b068a', // REP_NOTIFY
    'c7b73007-b245-4503-a1ed-9e4e97eb9802',
    '36e6c2ee-21c7-404e-aa9b-f74ca4728ad4',
    'ef0e485a-8749-4314-b1be-01e57cd1712e',
  ],

  // Official app workout command characteristics
  WORKOUT_CMD_CHAR_UUIDS: [
    '6d094aa3-b60d-4916-8a55-8ed73fb9f6a5',
    '6d094aa3-b60d-4916-8a55-8ed73fb9f6a6',
    '6d094aa3-b60d-4916-8a55-8ed73fb9f6a7',
    '6d094aa3-b60d-4916-8a55-8ed73fb9f6a8',
    '6d094aa3-b60d-4916-8a55-8ed73fb9f6a9',
    '6d094aa3-b60d-4916-8a55-8ed73fb9f6aa',
    '6d094aa3-b60d-4916-8a55-8ed73fb9f6ab',
    '6d094aa3-b60d-4916-8a55-8ed73fb9f6ac',
  ],

  // Device name prefix for filtering
  DEVICE_NAME_PREFIX: 'Vee',

  // Connection timeouts
  CONNECTION_TIMEOUT_MS: 15000,
  GATT_OPERATION_TIMEOUT_MS: 5000,
  SCAN_TIMEOUT_MS: 30000,
} as const;

/**
 * Connection status enum
 */
export enum ConnectionStatus {
  Disconnected = 'DISCONNECTED',
  Scanning = 'SCANNING',
  Connecting = 'CONNECTING',
  Ready = 'READY',
  Error = 'ERROR',
}

/**
 * Connection state type
 */
export type ConnectionState =
  | { status: ConnectionStatus.Disconnected }
  | { status: ConnectionStatus.Scanning }
  | { status: ConnectionStatus.Connecting; deviceName: string }
  | { status: ConnectionStatus.Ready; deviceName: string; deviceAddress: string }
  | { status: ConnectionStatus.Error; message: string; error?: Error };

/**
 * Handle state enum for Just Lift detection
 */
export enum HandleState {
  Released = 'RELEASED',
  Grabbed = 'GRABBED',
  Moving = 'MOVING',
}

/**
 * Real-time workout metric data from the device
 */
export interface WorkoutMetric {
  timestamp: number;
  loadA: number;
  loadB: number;
  positionA: number;
  positionB: number;
  ticks: number;
  velocityA: number;
  totalLoad: number;
}

/**
 * Rep notification data
 * Parsed from device notifications on characteristic 0x8308f2a6
 * Format: u16 array with [topCounter, ?, completeCounter, ...]
 */
export interface RepNotification {
  topCounter: number; // Counter increments when reaching top of range
  completeCounter: number; // Counter increments when rep completes (bottom)
  rawData: Uint8Array;
  timestamp: number;
}

/**
 * BLE scan result
 */
export interface BleScanResult {
  device: Device;
  rssi: number;
  name: string | null;
}

/**
 * BLE Manager callbacks
 */
export interface BleManagerCallbacks {
  onConnectionStateChange?: (state: ConnectionState) => void;
  onMonitorData?: (metric: WorkoutMetric) => void;
  onRepNotification?: (notification: RepNotification) => void;
  onHandleStateChange?: (state: HandleState) => void;
  onError?: (error: Error) => void;
}

/**
 * BLE permissions status for iOS/Android
 */
export interface BlePermissionsStatus {
  granted: boolean;
  bluetoothEnabled: boolean;
  locationEnabled?: boolean; // Android only
}

/**
 * Handle detection parameters
 */
export const HANDLE_DETECTION = {
  GRABBED_THRESHOLD: 8.0, // Position > 8.0 = handles grabbed
  REST_THRESHOLD: 2.5, // Position < 2.5 = handles at rest
  VELOCITY_THRESHOLD: 100.0, // Velocity > 100 units/s = significant movement
} as const;

/**
 * Polling intervals (in milliseconds)
 */
export const POLLING_INTERVALS = {
  MONITOR: 100, // Monitor polling every 100ms during workout
  PROPERTY: 500, // Property polling every 500ms (keep-alive)
} as const;

/**
 * MTU size for large frame transfers
 */
export const MTU_SIZE = 247;

/**
 * Position spike filter threshold
 */
export const POSITION_SPIKE_THRESHOLD = 50000;
