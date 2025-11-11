/**
 * Custom hook for active workout session state and control
 * Replaces workout execution logic from MainViewModel
 */

import { useEffect, useCallback, useRef } from 'react';
import { create } from 'zustand';
import {
  WorkoutState,
  WorkoutParameters,
  RepCount,
  WorkoutMetric,
  WorkoutSession,
  RepEvent,
  HapticEvent,
  ProgramMode,
  HandleState,
} from '../../domain/models/Models';
import { RepCounterFromMachine } from '../../domain/usecases/RepCounterFromMachine';
import { useBleConnection } from './useBleConnection';
import { insertSession, insertMetrics } from '../../data/local/daos/workoutDao';
import { updatePRIfBetter } from '../../data/local/daos/personalRecordDao';
import { WorkoutMetricEntity, WorkoutSessionEntity } from '../../data/local/entities';

interface AutoStopUiState {
  isActive: boolean;
  progress: number;
  secondsRemaining: number;
}

interface WorkoutSessionState {
  // State
  workoutState: WorkoutState;
  workoutParameters: WorkoutParameters;
  repCount: RepCount;
  autoStopState: AutoStopUiState;
  autoStartCountdown: number | null;

  // Session tracking
  currentSessionId: string | null;
  workoutStartTime: number;
  collectedMetrics: WorkoutMetric[];

  // Actions
  setWorkoutState: (state: WorkoutState) => void;
  setWorkoutParameters: (params: WorkoutParameters) => void;
  setRepCount: (count: RepCount) => void;
  setAutoStopState: (state: AutoStopUiState) => void;
  setAutoStartCountdown: (seconds: number | null) => void;
  setCurrentSessionId: (id: string | null) => void;
  setWorkoutStartTime: (time: number) => void;
  addMetric: (metric: WorkoutMetric) => void;
  clearMetrics: () => void;
  reset: () => void;
}

const useWorkoutSessionStore = create<WorkoutSessionState>((set) => ({
  // Initial state
  workoutState: { type: 'idle' },
  workoutParameters: {
    workoutType: { type: 'program', mode: ProgramMode.OldSchool },
    reps: 10,
    weightPerCableKg: 10,
    progressionRegressionKg: 0,
    isJustLift: false,
    useAutoStart: false,
    stopAtTop: false,
    warmupReps: 3,
    selectedExerciseId: null,
  },
  repCount: {
    warmupReps: 0,
    workingReps: 0,
    totalReps: 0,
    isWarmupComplete: false,
  },
  autoStopState: {
    isActive: false,
    progress: 0,
    secondsRemaining: 3,
  },
  autoStartCountdown: null,
  currentSessionId: null,
  workoutStartTime: 0,
  collectedMetrics: [],

  // Actions
  setWorkoutState: (state) => set({ workoutState: state }),
  setWorkoutParameters: (params) => set({ workoutParameters: params }),
  setRepCount: (count) => set({ repCount: count }),
  setAutoStopState: (state) => set({ autoStopState: state }),
  setAutoStartCountdown: (seconds) => set({ autoStartCountdown: seconds }),
  setCurrentSessionId: (id) => set({ currentSessionId: id }),
  setWorkoutStartTime: (time) => set({ workoutStartTime: time }),
  addMetric: (metric) =>
    set((state) => ({
      collectedMetrics: [...state.collectedMetrics, metric],
    })),
  clearMetrics: () => set({ collectedMetrics: [] }),
  reset: () =>
    set({
      workoutState: { type: 'idle' },
      repCount: {
        warmupReps: 0,
        workingReps: 0,
        totalReps: 0,
        isWarmupComplete: false,
      },
      autoStopState: {
        isActive: false,
        progress: 0,
        secondsRemaining: 3,
      },
      autoStartCountdown: null,
      currentSessionId: null,
      workoutStartTime: 0,
      collectedMetrics: [],
    }),
}));

const AUTO_STOP_DURATION_SECONDS = 3;
const AUTO_START_DELAY_MS = 1200;

/**
 * Custom hook for workout session management
 */
export const useWorkoutSession = () => {
  const store = useWorkoutSessionStore();
  const { bleManager, currentMetric, handleState } = useBleConnection();

  // Rep counter instance
  const repCounterRef = useRef<RepCounterFromMachine>(new RepCounterFromMachine());

  // Timers
  const autoStartTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoStopTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoStopStartTimeRef = useRef<number | null>(null);

  // Set up rep counter callback
  useEffect(() => {
    const repCounter = repCounterRef.current;

    repCounter.onRepEvent = (repEvent: RepEvent) => {
      // Update rep count
      const newRepCount = repCounter.getRepCount();
      store.setRepCount(newRepCount);

      console.log(
        `Rep counters updated: warmup=${newRepCount.warmupReps}/${store.workoutParameters.warmupReps}, ` +
          `working=${newRepCount.workingReps}/${store.workoutParameters.reps}`
      );

      // Check if workout should stop
      if (repCounter.shouldStopWorkout()) {
        console.log('Machine indicates workout should stop');
        handleSetCompletion();
      }
    };

    return () => {
      repCounter.onRepEvent = null;
    };
  }, [store]);

  // Monitor current metric for auto-stop and collection
  useEffect(() => {
    if (currentMetric && store.workoutState.type === 'active') {
      // Collect metric for history
      store.addMetric(currentMetric);

      // Check auto-stop for Just Lift mode
      if (store.workoutParameters.isJustLift) {
        checkAutoStop(currentMetric);
      } else {
        resetAutoStopTimer();
      }
    } else {
      resetAutoStopTimer();
    }
  }, [currentMetric, store.workoutState, store.workoutParameters]);

  // Auto-start timer based on handle state
  useEffect(() => {
    if (
      store.workoutParameters.useAutoStart &&
      store.workoutState.type === 'idle' &&
      handleState === HandleState.Grabbed
    ) {
      startAutoStartTimer();
    } else {
      cancelAutoStartTimer();
    }
  }, [handleState, store.workoutState, store.workoutParameters]);

  // Start auto-start countdown timer
  const startAutoStartTimer = useCallback(() => {
    if (autoStartTimerRef.current || store.workoutState.type !== 'idle') {
      return;
    }

    console.log('Auto-start timer STARTING! (1.2 seconds)');
    store.setAutoStartCountdown(1);

    autoStartTimerRef.current = setTimeout(() => {
      store.setAutoStartCountdown(null);
      console.log('Auto-start hold complete (1.2s)! Starting workout...');
      startWorkout(true, true); // skipCountdown=true, isJustLift=true
    }, AUTO_START_DELAY_MS);
  }, [store]);

  // Cancel auto-start timer
  const cancelAutoStartTimer = useCallback(() => {
    if (autoStartTimerRef.current) {
      clearTimeout(autoStartTimerRef.current);
      autoStartTimerRef.current = null;
      store.setAutoStartCountdown(null);
    }
  }, [store]);

  // Check auto-stop conditions for Just Lift mode
  const checkAutoStop = useCallback(
    (metric: WorkoutMetric) => {
      const repCounter = repCounterRef.current;

      if (!repCounter.hasMeaningfulRange()) {
        resetAutoStopTimer();
        return;
      }

      const inDangerZone = repCounter.isInDangerZone(metric.positionA, metric.positionB);

      if (inDangerZone) {
        const startTime = autoStopStartTimeRef.current ?? Date.now();
        autoStopStartTimeRef.current = startTime;

        const elapsed = (Date.now() - startTime) / 1000;
        const progress = Math.min(elapsed / AUTO_STOP_DURATION_SECONDS, 1);
        const remaining = Math.max(AUTO_STOP_DURATION_SECONDS - elapsed, 0);

        store.setAutoStopState({
          isActive: true,
          progress,
          secondsRemaining: Math.ceil(remaining),
        });

        if (elapsed >= AUTO_STOP_DURATION_SECONDS) {
          console.log('Auto-stop threshold reached in Just Lift - stopping workout');
          handleSetCompletion();
        }
      } else {
        resetAutoStopTimer();
      }
    },
    [store]
  );

  // Reset auto-stop timer
  const resetAutoStopTimer = useCallback(() => {
    autoStopStartTimeRef.current = null;
    if (!store.autoStopState.isActive) {
      store.setAutoStopState({
        isActive: false,
        progress: 0,
        secondsRemaining: 3,
      });
    }
  }, [store]);

  // Start workout
  const startWorkout = useCallback(
    async (skipCountdown: boolean = false, isJustLiftMode: boolean = false) => {
      console.log(`$$$ startWorkout() CALLED! skipCountdown=${skipCountdown}, isJustLiftMode=${isJustLiftMode} $$$`);

      try {
        const params = {
          ...store.workoutParameters,
          isJustLift: isJustLiftMode,
          useAutoStart: isJustLiftMode ? true : store.workoutParameters.useAutoStart,
        };
        store.setWorkoutParameters(params);

        // Configure rep counter
        const repCounter = repCounterRef.current;
        const workingTarget = params.isJustLift ? 0 : params.reps;
        repCounter.reset();
        repCounter.configure(
          params.warmupReps ?? 3,
          workingTarget,
          params.isJustLift ?? false,
          params.stopAtTop ?? false
        );

        store.setRepCount(repCounter.getRepCount());
        store.setAutoStopState({ isActive: false, progress: 0, secondsRemaining: 3 });

        // Initialize session
        const sessionId = `session-${Date.now()}`;
        store.setCurrentSessionId(sessionId);
        store.setWorkoutStartTime(Date.now());
        store.clearMetrics();

        // Countdown (skip for Just Lift or if requested)
        if (!skipCountdown && !params.isJustLift) {
          console.log('STARTING COUNTDOWN');
          for (let i = 5; i >= 1; i--) {
            store.setWorkoutState({ type: 'countdown', secondsRemaining: i });
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        } else {
          console.log('SKIPPING COUNTDOWN');
        }

        // Set to active before BLE command
        store.setWorkoutState({ type: 'active' });

        // Send workout command to device
        await bleManager.startWorkout(params);

        console.log('Workout command sent successfully! Tracking reps now.');
      } catch (error) {
        console.error('Failed to start workout:', error);
        store.setWorkoutState({
          type: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
    [bleManager, store]
  );

  // Stop workout
  const stopWorkout = useCallback(async () => {
    console.log('stopWorkout() called from UI');

    try {
      // Stop hardware
      await bleManager.stopWorkout();

      // Mark as completed
      store.setWorkoutState({ type: 'completed' });

      // Save session
      await saveWorkoutSession();

      // Reset state
      repCounterRef.current.reset();
      store.setAutoStopState({ isActive: false, progress: 0, secondsRemaining: 3 });
    } catch (error) {
      console.error('Failed to stop workout:', error);
    }
  }, [bleManager, store]);

  // Handle set completion (auto-stop)
  const handleSetCompletion = useCallback(async () => {
    console.log('HANDLE SET COMPLETION CALLED');

    try {
      // Stop hardware
      await bleManager.stopWorkout();

      // Save progress
      await saveWorkoutSession();

      // For Just Lift mode, auto-reset to Idle
      if (store.workoutParameters.isJustLift) {
        console.log('Just Lift mode: Auto-resetting to Idle');
        store.reset();
        store.setWorkoutState({ type: 'idle' });
        bleManager.enableHandleDetection();
        bleManager.enableJustLiftWaitingMode();
      } else {
        store.setWorkoutState({ type: 'completed' });
      }
    } catch (error) {
      console.error('Failed to handle set completion:', error);
    }
  }, [bleManager, store]);

  // Save workout session to database
  const saveWorkoutSession = useCallback(async () => {
    if (!store.currentSessionId) return;

    try {
      const params = store.workoutParameters;
      const warmup = store.repCount.warmupReps ?? 0;
      const working = store.repCount.workingReps ?? 0;
      const duration = Date.now() - store.workoutStartTime;

      // Calculate actual weight from metrics
      const actualPerCableWeightKg =
        store.collectedMetrics.length > 0
          ? Math.max(...store.collectedMetrics.map((m) => (m.loadA + m.loadB) / 2))
          : params.weightPerCableKg ?? 10;

      const sessionEntity: WorkoutSessionEntity = {
        id: store.currentSessionId!,
        timestamp: store.workoutStartTime,
        mode: params.workoutType.type === 'program' ? params.workoutType.mode.displayName : 'Echo',
        reps: params.reps,
        weightPerCableKg: actualPerCableWeightKg,
        progressionKg: params.progressionRegressionKg ?? 0,
        duration,
        totalReps: working,
        warmupReps: warmup,
        workingReps: working,
        isJustLift: params.isJustLift ?? false,
        stopAtTop: params.stopAtTop ?? false,
        eccentricLoad: params.workoutType.type === 'echo' ? params.workoutType.eccentricLoad : 100,
        echoLevel: params.workoutType.type === 'echo' ? params.workoutType.level : 2,
        exerciseId: params.selectedExerciseId ?? null,
      };

      await insertSession(sessionEntity);

      // Save metrics
      if (store.collectedMetrics.length > 0) {
        const metrics: WorkoutMetricEntity[] = store.collectedMetrics.map((m) => ({
          sessionId: store.currentSessionId!,
          timestamp: m.timestamp ?? Date.now(),
          loadA: m.loadA,
          loadB: m.loadB,
          positionA: m.positionA,
          positionB: m.positionB,
          ticks: m.ticks ?? 0,
        }));
        await insertMetrics(metrics);
      }

      // Track personal record if exercise is selected
      if (params.selectedExerciseId && working > 0 && !params.isJustLift && params.workoutType.type !== 'echo') {
        const isNewPR = await updatePRIfBetter(
          params.selectedExerciseId,
          actualPerCableWeightKg,
          working,
          sessionEntity.mode,
          Date.now()
        );

        if (isNewPR) {
          console.log(`NEW PERSONAL RECORD! Exercise: ${params.selectedExerciseId}, Weight: ${actualPerCableWeightKg}kg, Reps: ${working}`);
          // TODO: Emit PR celebration event
        }
      }

      console.log(`Saved workout session: ${store.currentSessionId} with ${store.collectedMetrics.length} metrics`);
    } catch (error) {
      console.error('Failed to save workout session:', error);
    }
  }, [store]);

  // Update workout parameters
  const updateWorkoutParameters = useCallback(
    (params: WorkoutParameters) => {
      store.setWorkoutParameters(params);
    },
    [store]
  );

  // Reset for new workout
  const resetForNewWorkout = useCallback(() => {
    store.reset();
    store.setWorkoutState({ type: 'idle' });
    console.log('Reset for new workout - state returned to Idle');
  }, [store]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoStartTimerRef.current) {
        clearTimeout(autoStartTimerRef.current);
      }
      if (autoStopTimerRef.current) {
        clearTimeout(autoStopTimerRef.current);
      }
    };
  }, []);

  return {
    // State
    workoutState: store.workoutState,
    workoutParameters: store.workoutParameters,
    repCount: store.repCount,
    autoStopState: store.autoStopState,
    autoStartCountdown: store.autoStartCountdown,

    // Actions
    startWorkout,
    stopWorkout,
    updateWorkoutParameters,
    resetForNewWorkout,
  };
};
