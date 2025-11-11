/**
 * Repository Layer - Centralized export for all repositories
 * Migrated from Android Kotlin repository layer to React Native TypeScript
 */

// BLE Repository
export * from './BleRepository';
export { getBleRepository, resetBleRepository } from './BleRepository';
export type { IBleRepository } from './BleRepository';

// Workout Repository
export * from './WorkoutRepository';
export { getWorkoutRepository, resetWorkoutRepository } from './WorkoutRepository';
export type { IWorkoutRepository } from './WorkoutRepository';

// Exercise Repository
export * from './ExerciseRepository';
export { getExerciseRepository, resetExerciseRepository } from './ExerciseRepository';
export type { IExerciseRepository } from './ExerciseRepository';

// Personal Record Repository
export * from './PersonalRecordRepository';
export { getPersonalRecordRepository, resetPersonalRecordRepository } from './PersonalRecordRepository';
export type { IPersonalRecordRepository } from './PersonalRecordRepository';

// Re-export Preferences Manager
export * from '../preferences/PreferencesManager';
export { getPreferencesManager, resetPreferencesManager } from '../preferences/PreferencesManager';
export type { IPreferencesManager } from '../preferences/PreferencesManager';
