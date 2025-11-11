/**
 * TypeScript entity interfaces for SQLite database
 * Migrated from Android Room entities
 */

/**
 * Entity for workout sessions
 */
export interface WorkoutSessionEntity {
  id: string;
  timestamp: number;
  mode: string;
  reps: number;
  weightPerCableKg: number;
  progressionKg: number;
  duration: number;
  totalReps: number;
  warmupReps: number;
  workingReps: number;
  isJustLift: boolean;
  stopAtTop: boolean;
  eccentricLoad: number; // Percentage (0, 50, 75, 100, 125, 150)
  echoLevel: number; // 1=Hard, 2=Harder, 3=Hardest, 4=Epic
  exerciseId: string | null; // Exercise library ID for PR tracking
}

/**
 * Entity for workout metrics (time series data)
 */
export interface WorkoutMetricEntity {
  id?: number; // Auto-generated
  sessionId: string;
  timestamp: number;
  loadA: number;
  loadB: number;
  positionA: number;
  positionB: number;
  ticks: number;
}

/**
 * Entity for workout routines
 */
export interface RoutineEntity {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  lastUsed: number | null;
  useCount: number;
}

/**
 * Entity for exercises within a routine
 */
export interface RoutineExerciseEntity {
  id: string;
  routineId: string;
  // Exercise data
  exerciseName: string;
  exerciseMuscleGroup: string;
  exerciseEquipment: string;
  exerciseDefaultCableConfig: string; // "SINGLE", "DOUBLE", or "EITHER"
  exerciseId: string | null; // Exercise library ID for loading videos/thumbnails
  // Routine-specific configuration
  cableConfig: string; // "SINGLE" or "DOUBLE" (never "EITHER" in storage)
  orderIndex: number;
  setReps: string; // Comma-separated rep counts (e.g., "10,10,10" or "10,8,6,4")
  weightPerCableKg: number;
  setWeights: string; // Optional per-set weights as comma-separated floats (kg per cable)
  mode: string; // e.g., "OldSchool", "Pump", "EccentricOnly", "Echo"
  eccentricLoad: number;
  echoLevel: number;
  progressionKg: number;
  restSeconds: number;
  notes: string;
  duration: number | null; // Optional duration in seconds for duration-based sets
}

/**
 * Entity for exercises from the exercise library
 */
export interface ExerciseEntity {
  id: string;
  name: string;
  description: string;
  created: string;
  muscleGroups: string; // comma-separated
  muscles: string; // comma-separated
  equipment: string; // comma-separated
  movement: string | null;
  sidedness: string | null;
  grip: string | null;
  gripWidth: string | null;
  minRepRange: number | null;
  popularity: number;
  archived: boolean;
  isFavorite: boolean;
  timesPerformed: number;
  lastPerformed: number | null;
}

/**
 * Entity for exercise video demonstrations
 */
export interface ExerciseVideoEntity {
  id?: number; // Auto-generated
  exerciseId: string;
  angle: string; // FRONT, SIDE, or ISOMETRIC
  videoUrl: string;
  thumbnailUrl: string;
}

/**
 * Entity for personal records per exercise
 * Tracks the best performance (weight and reps) for each exercise and workout mode combination
 */
export interface PersonalRecordEntity {
  id?: number; // Auto-generated
  exerciseId: string;
  weightPerCableKg: number;
  reps: number;
  timestamp: number;
  workoutMode: string;
}

/**
 * Entity for weekly programs
 */
export interface WeeklyProgramEntity {
  id: string;
  title: string;
  notes: string | null;
  isActive: boolean;
  lastUsed: number | null;
  createdAt: number;
}

/**
 * Entity for program days - links programs to routines by day of week
 */
export interface ProgramDayEntity {
  id?: number; // Auto-generated
  programId: string;
  dayOfWeek: number; // 1=Monday, 7=Sunday (Calendar.MONDAY format)
  routineId: string;
}

/**
 * Entity for storing Bluetooth connection debug logs
 */
export interface ConnectionLogEntity {
  id?: number; // Auto-generated
  timestamp: number;
  eventType: string; // e.g., CONNECTION_STARTED, COMMAND_SENT, ERROR
  level: string; // DEBUG, INFO, WARNING, ERROR
  deviceAddress: string | null;
  deviceName: string | null;
  message: string;
  details: string | null;
  metadata: string | null; // JSON string if needed
}

/**
 * Composite type for weekly program with its days
 */
export interface WeeklyProgramWithDays {
  program: WeeklyProgramEntity;
  days: ProgramDayEntity[];
}
