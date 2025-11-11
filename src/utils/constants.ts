/**
 * BLE Constants - UUIDs and configuration values for Vitruvian device communication
 * Ported from Constants.kt in the Android Kotlin codebase
 */

// =============================================================================
// BLE Constants
// =============================================================================

/**
 * Service UUIDs for BLE communication
 */
export const GATT_SERVICE_UUID = '00001801-0000-1000-8000-00805f9b34fb';
export const NUS_SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';

/**
 * Characteristic UUIDs for BLE communication
 */
export const NUS_RX_CHAR_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
export const MONITOR_CHAR_UUID = '90e991a6-c548-44ed-969b-eb541014eae3';
export const PROPERTY_CHAR_UUID = '5fa538ec-d041-42f6-bbd6-c30d475387b7';
export const REP_NOTIFY_CHAR_UUID = '8308f2a6-0875-4a94-a86f-5c5c5e1b068a';

/**
 * Notification characteristic UUIDs
 */
export const NOTIFY_CHAR_UUIDS = [
  '383f7276-49af-4335-9072-f01b0f8acad6',
  '74e994ac-0e80-4c02-9cd0-76cb31d3959b',
  '67d0dae0-5bfc-4ea2-acc9-ac784dee7f29',
  REP_NOTIFY_CHAR_UUID,
  'c7b73007-b245-4503-a1ed-9e4e97eb9802',
  '36e6c2ee-21c7-404e-aa9b-f74ca4728ad4',
  'ef0e485a-8749-4314-b1be-01e57cd1712e',
] as const;

/**
 * Official app workout command characteristics (discovered from HCI logs)
 * These are writable characteristics (props: 4 = WRITE_NO_RESPONSE)
 */
export const WORKOUT_CMD_CHAR_UUIDS = [
  '6d094aa3-b60d-4916-8a55-8ed73fb9f6a5',
  '6d094aa3-b60d-4916-8a55-8ed73fb9f6a6',
  '6d094aa3-b60d-4916-8a55-8ed73fb9f6a7',
  '6d094aa3-b60d-4916-8a55-8ed73fb9f6a8',
  '6d094aa3-b60d-4916-8a55-8ed73fb9f6a9',
  '6d094aa3-b60d-4916-8a55-8ed73fb9f6aa',
  '6d094aa3-b60d-4916-8a55-8ed73fb9f6ab',
  '6d094aa3-b60d-4916-8a55-8ed73fb9f6ac',
] as const;

/**
 * Device name prefix for filtering - matches "Vee" devices
 */
export const DEVICE_NAME_PREFIX = 'Vee';

/**
 * Connection timeouts (in milliseconds)
 */
export const CONNECTION_TIMEOUT_MS = 15000;
export const GATT_OPERATION_TIMEOUT_MS = 5000;
export const SCAN_TIMEOUT_MS = 30000; // Increased from 10s to 30s for better device discovery

// =============================================================================
// Workout Constants
// =============================================================================

/**
 * Weight conversion constants
 */
export const LB_PER_KG = 2.2046226218488;
export const KG_PER_LB = 1 / LB_PER_KG;

/**
 * Weight limits (in kg)
 */
export const MIN_WEIGHT_KG = 0;
export const MAX_WEIGHT_KG = 100;
export const MAX_PROGRESSION_KG = 3;

/**
 * Workout defaults
 */
export const DEFAULT_WARMUP_REPS = 3;
export const MAX_HISTORY_POINTS = 72000; // 2 hours at 100ms

/**
 * Position ranges
 */
export const MAX_POSITION = 3000;
export const MIN_POSITION = 0;

// =============================================================================
// Protocol Constants
// =============================================================================

/**
 * Command types (as byte values)
 */
export const CMD_INIT = 0x0a;
export const CMD_INIT_PRESET = 0x11;
export const CMD_PROGRAM_PARAMS = 0x04;
export const CMD_ECHO_CONTROL = 0x13;
export const CMD_COLOR_SCHEME = 0x1d;

/**
 * Frame sizes (in bytes)
 */
export const INIT_CMD_SIZE = 4;
export const INIT_PRESET_SIZE = 34;
export const PROGRAM_PARAMS_SIZE = 96;
export const ECHO_CONTROL_SIZE = 40;
export const COLOR_SCHEME_SIZE = 44;

/**
 * Mode values
 */
export const MODE_OLD_SCHOOL = 0;
export const MODE_PUMP = 2;
export const MODE_TUT = 3;
export const MODE_TUT_BEAST = 4;
export const MODE_ECCENTRIC_ONLY = 6;
export const MODE_ECHO = 10;

// =============================================================================
// Type Exports for organized imports
// =============================================================================

/**
 * BLE Constants namespace for organized access
 */
export const BleConstants = {
  GATT_SERVICE_UUID,
  NUS_SERVICE_UUID,
  NUS_RX_CHAR_UUID,
  MONITOR_CHAR_UUID,
  PROPERTY_CHAR_UUID,
  REP_NOTIFY_CHAR_UUID,
  NOTIFY_CHAR_UUIDS,
  WORKOUT_CMD_CHAR_UUIDS,
  DEVICE_NAME_PREFIX,
  CONNECTION_TIMEOUT_MS,
  GATT_OPERATION_TIMEOUT_MS,
  SCAN_TIMEOUT_MS,
} as const;

/**
 * Workout Constants namespace for organized access
 */
export const WorkoutConstants = {
  LB_PER_KG,
  KG_PER_LB,
  MIN_WEIGHT_KG,
  MAX_WEIGHT_KG,
  MAX_PROGRESSION_KG,
  DEFAULT_WARMUP_REPS,
  MAX_HISTORY_POINTS,
  MAX_POSITION,
  MIN_POSITION,
} as const;

/**
 * Protocol Constants namespace for organized access
 */
export const ProtocolConstants = {
  CMD_INIT,
  CMD_INIT_PRESET,
  CMD_PROGRAM_PARAMS,
  CMD_ECHO_CONTROL,
  CMD_COLOR_SCHEME,
  INIT_CMD_SIZE,
  INIT_PRESET_SIZE,
  PROGRAM_PARAMS_SIZE,
  ECHO_CONTROL_SIZE,
  COLOR_SCHEME_SIZE,
  MODE_OLD_SCHOOL,
  MODE_PUMP,
  MODE_TUT,
  MODE_TUT_BEAST,
  MODE_ECCENTRIC_ONLY,
  MODE_ECHO,
} as const;
