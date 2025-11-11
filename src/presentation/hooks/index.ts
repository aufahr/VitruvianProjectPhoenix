/**
 * Custom React hooks for state management
 * Replaces Android ViewModels with React hooks using Zustand
 */

// BLE Connection Management
export { useBleConnection } from './useBleConnection';

// Workout Session Management
export { useWorkoutSession } from './useWorkoutSession';

// Workout History & Statistics
export { useWorkoutHistory } from './useWorkoutHistory';

// Exercise Library
export {
  useExerciseLibrary,
  MuscleGroupFilter,
  EquipmentFilter,
} from './useExerciseLibrary';

// Personal Records
export { usePersonalRecords } from './usePersonalRecords';

// Routines Management
export { useRoutines } from './useRoutines';

// Weekly Programs Management
export { useWeeklyPrograms } from './useWeeklyPrograms';

// Workout Timers
export {
  useWorkoutTimer,
  useRestTimer,
  useCountdownTimer,
  formatTime,
  formatDuration,
} from './useWorkoutTimer';

// Haptic Feedback
export {
  useHapticFeedback,
  useHapticEventListener,
  useHapticSequences,
} from './useHapticFeedback';

// User Preferences
export { usePreferences } from './usePreferences';
