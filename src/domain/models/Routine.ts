import { CableConfiguration, Exercise } from './Exercise';
import { WorkoutType, EccentricLoad, EchoLevel, ProgramMode } from './Models';

/**
 * Domain model for a workout routine
 */
export interface Routine {
  id: string;
  name: string;
  description?: string;
  exercises?: RoutineExercise[];
  createdAt?: number;
  lastUsed?: number | null;
  useCount?: number;
}

/**
 * Domain model for an exercise within a routine
 *
 * @param cableConfig User's cable configuration choice (SINGLE or DOUBLE)
 *                    Should be set based on exercise's defaultCableConfig
 *                    If exercise allows EITHER, defaults to DOUBLE
 * @param weightPerCableKg Weight in kg per cable (machine tracks each cable independently)
 *                         For SINGLE: weight on the one active cable
 *                         For DOUBLE: weight per cable (total load = 2x this value)
 */
export interface RoutineExercise {
  id: string;
  exercise: Exercise;
  cableConfig: CableConfiguration;
  orderIndex: number;
  setReps?: number[];
  weightPerCableKg: number;
  // Optional per-set weights in kg per cable; when empty, fall back to weightPerCableKg
  setWeightsPerCableKg?: number[];
  // Selected workout type for this exercise in routines
  workoutType?: WorkoutType;
  // Echo-specific configuration
  eccentricLoad?: EccentricLoad;
  echoLevel?: EchoLevel;
  progressionKg?: number;
  restSeconds?: number;
  notes?: string;
  // Optional duration in seconds for duration-based sets
  duration?: number | null;
}

/**
 * Computed property for backwards compatibility - get number of sets
 */
export const getRoutineExerciseSets = (routineExercise: RoutineExercise): number => {
  return routineExercise.setReps?.length ?? 0;
};

/**
 * Computed property for backwards compatibility - get reps for first set
 */
export const getRoutineExerciseReps = (routineExercise: RoutineExercise): number => {
  return routineExercise.setReps?.[0] ?? 10;
};

/**
 * Helper function to determine the appropriate cable configuration for an exercise
 * If exercise allows EITHER, defaults to DOUBLE
 */
export const resolveDefaultCableConfig = (exercise: Exercise): CableConfiguration => {
  const defaultConfig = exercise.defaultCableConfig ?? CableConfiguration.DOUBLE;
  return defaultConfig === CableConfiguration.EITHER ? CableConfiguration.DOUBLE : defaultConfig;
};

/**
 * Create default routine
 */
export const createDefaultRoutine = (overrides?: Partial<Routine>): Routine => ({
  id: '',
  name: '',
  description: '',
  exercises: [],
  createdAt: Date.now(),
  lastUsed: null,
  useCount: 0,
  ...overrides,
});

/**
 * Create default routine exercise
 */
export const createDefaultRoutineExercise = (
  exercise: Exercise,
  overrides?: Partial<RoutineExercise>
): RoutineExercise => ({
  id: '',
  exercise,
  cableConfig: resolveDefaultCableConfig(exercise),
  orderIndex: 0,
  setReps: [10, 10, 10],
  weightPerCableKg: 0,
  setWeightsPerCableKg: [],
  workoutType: { type: 'program', mode: ProgramMode.OldSchool },
  eccentricLoad: EccentricLoad.LOAD_100,
  echoLevel: EchoLevel.HARDER,
  progressionKg: 0,
  restSeconds: 60,
  notes: '',
  duration: null,
  ...overrides,
});
