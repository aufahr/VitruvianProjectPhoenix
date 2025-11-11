/**
 * Personal record for an exercise
 */
export interface PersonalRecord {
  id: number;
  exerciseId: string;
  weightPerCableKg: number;
  reps: number;
  timestamp: number;
  workoutMode: string;
}

/**
 * Handle state - workout handle grab detection
 */
export enum HandleState {
  Released = 'released',
  Grabbed = 'grabbed',
  Moving = 'moving',
}

/**
 * Connection state - BLE connection states
 */
export type ConnectionState =
  | { type: 'disconnected' }
  | { type: 'scanning' }
  | { type: 'connecting' }
  | { type: 'connected'; deviceName: string; deviceAddress: string }
  | { type: 'error'; message: string; throwable?: Error };

/**
 * Workout state - workout execution states
 */
export type WorkoutState =
  | { type: 'idle' }
  | { type: 'initializing' }
  | { type: 'countdown'; secondsRemaining: number }
  | { type: 'active' }
  | { type: 'paused' }
  | { type: 'completed' }
  | { type: 'error'; message: string }
  | {
      type: 'resting';
      restSecondsRemaining: number;
      nextExerciseName: string;
      isLastExercise: boolean;
      currentSet: number;
      totalSets: number;
    };

/**
 * Program modes that use command 0x4F (96-byte frame)
 * Note: Official app uses 0x4F, NOT 0x04
 */
export interface ProgramModeData {
  modeValue: number;
  displayName: string;
}

export const ProgramMode = {
  OldSchool: { modeValue: 0, displayName: 'Old School' } as ProgramModeData,
  Pump: { modeValue: 2, displayName: 'Pump' } as ProgramModeData,
  TUT: { modeValue: 3, displayName: 'TUT' } as ProgramModeData,
  TUTBeast: { modeValue: 4, displayName: 'TUT Beast' } as ProgramModeData,
  EccentricOnly: { modeValue: 6, displayName: 'Eccentric Only' } as ProgramModeData,

  fromValue: (value: number): ProgramModeData => {
    switch (value) {
      case 0:
        return ProgramMode.OldSchool;
      case 2:
        return ProgramMode.Pump;
      case 3:
        return ProgramMode.TUT;
      case 4:
        return ProgramMode.TUTBeast;
      case 6:
        return ProgramMode.EccentricOnly;
      default:
        return ProgramMode.OldSchool;
    }
  },
} as const;

export type ProgramModeType = typeof ProgramMode[keyof Omit<typeof ProgramMode, 'fromValue'>];

/**
 * Echo mode difficulty levels
 */
export enum EchoLevel {
  HARD = 0,
  HARDER = 1,
  HARDEST = 2,
  EPIC = 3,
}

export const EchoLevelDisplay: Record<EchoLevel, string> = {
  [EchoLevel.HARD]: 'Hard',
  [EchoLevel.HARDER]: 'Harder',
  [EchoLevel.HARDEST]: 'Hardest',
  [EchoLevel.EPIC]: 'Epic',
};

/**
 * Eccentric load percentage for Echo mode
 * Machine hardware limit: 150% maximum
 */
export enum EccentricLoad {
  LOAD_0 = 0,
  LOAD_50 = 50,
  LOAD_75 = 75,
  LOAD_100 = 100,
  LOAD_125 = 125,
  LOAD_150 = 150,
}

export const EccentricLoadDisplay: Record<EccentricLoad, string> = {
  [EccentricLoad.LOAD_0]: '0%',
  [EccentricLoad.LOAD_50]: '50%',
  [EccentricLoad.LOAD_75]: '75%',
  [EccentricLoad.LOAD_100]: '100%',
  [EccentricLoad.LOAD_125]: '125%',
  [EccentricLoad.LOAD_150]: '150%',
};

/**
 * Workout type - either Program (0x04) or Echo (0x4E)
 */
export type WorkoutType =
  | { type: 'program'; mode: ProgramModeData }
  | { type: 'echo'; level: EchoLevel; eccentricLoad: EccentricLoad };

export const getWorkoutTypeDisplayName = (workoutType: WorkoutType): string => {
  if (workoutType.type === 'program') {
    return workoutType.mode.displayName;
  }
  return 'Echo';
};

export const getWorkoutTypeModeValue = (workoutType: WorkoutType): number => {
  if (workoutType.type === 'program') {
    return workoutType.mode.modeValue;
  }
  return 10;
};

/**
 * WorkoutMode - Legacy types for UI compatibility
 * Maps to WorkoutType for protocol usage
 */
export type WorkoutMode =
  | { type: 'oldSchool'; displayName: 'Old School' }
  | { type: 'pump'; displayName: 'Pump' }
  | { type: 'tut'; displayName: 'TUT' }
  | { type: 'tutBeast'; displayName: 'TUT Beast' }
  | { type: 'eccentricOnly'; displayName: 'Eccentric Only' }
  | { type: 'echo'; displayName: 'Echo'; level: EchoLevel };

export const WorkoutModeConstants = {
  OldSchool: { type: 'oldSchool' as const, displayName: 'Old School' as const },
  Pump: { type: 'pump' as const, displayName: 'Pump' as const },
  TUT: { type: 'tut' as const, displayName: 'TUT' as const },
  TUTBeast: { type: 'tutBeast' as const, displayName: 'TUT Beast' as const },
  EccentricOnly: { type: 'eccentricOnly' as const, displayName: 'Eccentric Only' as const },
  Echo: (level: EchoLevel): WorkoutMode => ({
    type: 'echo' as const,
    displayName: 'Echo' as const,
    level,
  }),
};

/**
 * Convert WorkoutMode to WorkoutType
 */
export const workoutModeToWorkoutType = (
  mode: WorkoutMode,
  eccentricLoad: EccentricLoad = EccentricLoad.LOAD_100
): WorkoutType => {
  switch (mode.type) {
    case 'oldSchool':
      return { type: 'program', mode: ProgramMode.OldSchool };
    case 'pump':
      return { type: 'program', mode: ProgramMode.Pump };
    case 'tut':
      return { type: 'program', mode: ProgramMode.TUT };
    case 'tutBeast':
      return { type: 'program', mode: ProgramMode.TUTBeast };
    case 'eccentricOnly':
      return { type: 'program', mode: ProgramMode.EccentricOnly };
    case 'echo':
      return { type: 'echo', level: mode.level, eccentricLoad };
  }
};

/**
 * Convert WorkoutType to WorkoutMode for UI compatibility
 */
export const workoutTypeToWorkoutMode = (workoutType: WorkoutType): WorkoutMode => {
  if (workoutType.type === 'program') {
    const mode = workoutType.mode;
    if (mode.modeValue === 0) return WorkoutModeConstants.OldSchool;
    if (mode.modeValue === 2) return WorkoutModeConstants.Pump;
    if (mode.modeValue === 3) return WorkoutModeConstants.TUT;
    if (mode.modeValue === 4) return WorkoutModeConstants.TUTBeast;
    if (mode.modeValue === 6) return WorkoutModeConstants.EccentricOnly;
    return WorkoutModeConstants.OldSchool;
  }
  return WorkoutModeConstants.Echo(workoutType.level);
};

/**
 * Weight unit preference
 */
export enum WeightUnit {
  KG = 'KG',
  LB = 'LB',
}

/**
 * Workout parameters
 */
export interface WorkoutParameters {
  workoutType: WorkoutType;
  reps: number;
  weightPerCableKg?: number; // Only used for Program modes
  progressionRegressionKg?: number; // Only used for Program modes (not TUT/TUTBeast)
  isJustLift?: boolean;
  useAutoStart?: boolean; // true for Just Lift, false for others
  stopAtTop?: boolean; // false = stop at bottom (extended), true = stop at top (contracted)
  warmupReps?: number;
  selectedExerciseId?: string | null;
}

/**
 * Real-time workout metric data from the device
 */
export interface WorkoutMetric {
  timestamp?: number;
  loadA: number;
  loadB: number;
  positionA: number;
  positionB: number;
  ticks?: number;
  velocityA?: number; // Velocity for handle detection (official app protocol)
}

export const getTotalLoad = (metric: WorkoutMetric): number => {
  return metric.loadA + metric.loadB;
};

/**
 * Rep count tracking
 */
export interface RepCount {
  warmupReps?: number;
  workingReps?: number;
  totalReps?: number; // Exclude warm-up reps from total count
  isWarmupComplete?: boolean;
}

/**
 * Rep event types
 */
export enum RepType {
  WARMUP_COMPLETED = 'WARMUP_COMPLETED',
  WORKING_COMPLETED = 'WORKING_COMPLETED',
  WARMUP_COMPLETE = 'WARMUP_COMPLETE',
  WORKOUT_COMPLETE = 'WORKOUT_COMPLETE',
}

/**
 * Rep event data
 */
export interface RepEvent {
  type: RepType;
  warmupCount: number;
  workingCount: number;
  timestamp?: number;
}

/**
 * Haptic feedback event types
 */
export enum HapticEvent {
  REP_COMPLETED = 'REP_COMPLETED',
  WARMUP_COMPLETE = 'WARMUP_COMPLETE',
  WORKOUT_COMPLETE = 'WORKOUT_COMPLETE',
  WORKOUT_START = 'WORKOUT_START',
  WORKOUT_END = 'WORKOUT_END',
  ERROR = 'ERROR',
}

/**
 * Workout session data (simplified for database storage)
 */
export interface WorkoutSession {
  id?: string;
  timestamp?: number;
  mode?: string;
  reps?: number;
  weightPerCableKg?: number;
  progressionKg?: number;
  duration?: number;
  totalReps?: number;
  warmupReps?: number;
  workingReps?: number;
  isJustLift?: boolean;
  stopAtTop?: boolean;
  // Echo mode configuration
  eccentricLoad?: number; // Percentage (0, 50, 75, 100, 125, 150)
  echoLevel?: number; // 1=Hard, 2=Harder, 3=Hardest, 4=Epic
  // Exercise tracking
  exerciseId?: string | null; // Exercise library ID for PR tracking
}

/**
 * Chart data point for visualization
 */
export interface ChartDataPoint {
  timestamp: number;
  totalLoad: number;
  loadA: number;
  loadB: number;
  positionA: number;
  positionB: number;
}

/**
 * Chart event markers
 */
export type ChartEvent =
  | { type: 'repStart'; timestamp: number; label: string; repNumber: number }
  | { type: 'repComplete'; timestamp: number; label: string; repNumber: number }
  | { type: 'warmupComplete'; timestamp: number; label: string };

export const createRepStartEvent = (timestamp: number, repNumber: number): ChartEvent => ({
  type: 'repStart',
  timestamp,
  label: `Rep ${repNumber}`,
  repNumber,
});

export const createRepCompleteEvent = (timestamp: number, repNumber: number): ChartEvent => ({
  type: 'repComplete',
  timestamp,
  label: `Rep ${repNumber} Complete`,
  repNumber,
});

export const createWarmupCompleteEvent = (timestamp: number): ChartEvent => ({
  type: 'warmupComplete',
  timestamp,
  label: 'Warmup Complete',
});

/**
 * PR Celebration Event - Triggered when user achieves a new Personal Record
 */
export interface PRCelebrationEvent {
  exerciseName: string;
  weightPerCableKg: number;
  reps: number;
  workoutMode: string;
}

/**
 * Helper function to generate UUID (simple implementation)
 */
export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Helper to create default WorkoutSession
 */
export const createDefaultWorkoutSession = (): WorkoutSession => ({
  id: generateUUID(),
  timestamp: Date.now(),
  mode: 'OldSchool',
  reps: 10,
  weightPerCableKg: 10,
  progressionKg: 0,
  duration: 0,
  totalReps: 0,
  warmupReps: 0,
  workingReps: 0,
  isJustLift: false,
  stopAtTop: false,
  eccentricLoad: 100,
  echoLevel: 2,
  exerciseId: null,
});
