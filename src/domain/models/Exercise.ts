/**
 * Cable configuration for Vitruvian exercises
 * - SINGLE: One cable only (unilateral - e.g., one-arm row)
 * - DOUBLE: Both cables required (bilateral - e.g., bench press)
 * - EITHER: User can choose single or double (e.g., bicep curls)
 */
export enum CableConfiguration {
  SINGLE = 'SINGLE',
  DOUBLE = 'DOUBLE',
  EITHER = 'EITHER',
}

/**
 * Exercise model - represents any exercise that can be performed on the Vitruvian Trainer
 *
 * MIGRATION NOTE: This was converted from an enum to a data class to support the exercise library
 * with 100+ exercises instead of being limited to hardcoded values.
 *
 * NOTES:
 * - Vitruvian cables only pull UPWARD from floor platform
 * - Compatible: Rows, presses, curls, squats, deadlifts, raises
 * - NOT compatible: Pulldowns, pushdowns (require overhead anchor)
 * - Machine tracks each cable independently (loadA, loadB, posA, posB)
 * - Weight is always specified as "per cable" in the BLE protocol
 */
export interface Exercise {
  name: string;
  muscleGroup: string;
  equipment?: string;
  defaultCableConfig?: CableConfiguration;
  id?: string | null; // Optional exercise library ID for loading videos/thumbnails
}

/**
 * Get display name for UI (same as name for now)
 */
export const getExerciseDisplayName = (exercise: Exercise): string => {
  return exercise.name;
};

/**
 * Create default exercise
 */
export const createDefaultExercise = (overrides?: Partial<Exercise>): Exercise => ({
  name: '',
  muscleGroup: '',
  equipment: '',
  defaultCableConfig: CableConfiguration.DOUBLE,
  id: null,
  ...overrides,
});

/**
 * Exercise categories for organization
 * Used primarily for filtering and grouping in the UI
 */
export enum ExerciseCategory {
  CHEST = 'CHEST',
  BACK = 'BACK',
  SHOULDERS = 'SHOULDERS',
  BICEPS = 'BICEPS',
  TRICEPS = 'TRICEPS',
  LEGS = 'LEGS',
  GLUTES = 'GLUTES',
  CORE = 'CORE',
  FULL_BODY = 'FULL_BODY',
}

export const ExerciseCategoryDisplay: Record<ExerciseCategory, string> = {
  [ExerciseCategory.CHEST]: 'Chest',
  [ExerciseCategory.BACK]: 'Back',
  [ExerciseCategory.SHOULDERS]: 'Shoulders',
  [ExerciseCategory.BICEPS]: 'Biceps',
  [ExerciseCategory.TRICEPS]: 'Triceps',
  [ExerciseCategory.LEGS]: 'Legs',
  [ExerciseCategory.GLUTES]: 'Glutes',
  [ExerciseCategory.CORE]: 'Core',
  [ExerciseCategory.FULL_BODY]: 'Full Body',
};
