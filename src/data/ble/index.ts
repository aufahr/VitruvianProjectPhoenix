/**
 * BLE Module Exports
 * Provides BLE manager and type definitions for Vitruvian device communication
 */

export {
  VitruvianBleManager,
  getBleManager,
  resetBleManager,
} from './BleManager';

export {
  BLE_CONSTANTS,
  ConnectionStatus,
  HandleState,
  HANDLE_DETECTION,
  POLLING_INTERVALS,
  MTU_SIZE,
  POSITION_SPIKE_THRESHOLD,
} from './types';

export type {
  ConnectionState,
  WorkoutMetric,
  RepNotification,
  BleScanResult,
  BleManagerCallbacks,
  BlePermissionsStatus,
} from './types';
