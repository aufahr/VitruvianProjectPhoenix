/**
 * Custom hook for workout countdown and rest timers
 * Replaces timer logic from MainViewModel
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface TimerState {
  isRunning: boolean;
  secondsRemaining: number;
  totalSeconds: number;
}

/**
 * Custom hook for countdown timers (workout start, rest periods)
 */
export const useWorkoutTimer = (initialSeconds: number = 0) => {
  const [state, setState] = useState<TimerState>({
    isRunning: false,
    secondsRemaining: initialSeconds,
    totalSeconds: initialSeconds,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const onCompleteRef = useRef<(() => void) | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Start timer
  const start = useCallback((seconds: number, onComplete?: () => void) => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setState({
      isRunning: true,
      secondsRemaining: seconds,
      totalSeconds: seconds,
    });

    onCompleteRef.current = onComplete || null;

    timerRef.current = setInterval(() => {
      setState((prev) => {
        const newSeconds = prev.secondsRemaining - 1;

        if (newSeconds <= 0) {
          // Timer complete
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }

          // Call completion callback
          if (onCompleteRef.current) {
            onCompleteRef.current();
          }

          return {
            isRunning: false,
            secondsRemaining: 0,
            totalSeconds: prev.totalSeconds,
          };
        }

        return {
          ...prev,
          secondsRemaining: newSeconds,
        };
      });
    }, 1000);
  }, []);

  // Stop timer
  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      isRunning: false,
    }));
  }, []);

  // Reset timer
  const reset = useCallback((seconds?: number) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const newSeconds = seconds ?? state.totalSeconds;

    setState({
      isRunning: false,
      secondsRemaining: newSeconds,
      totalSeconds: newSeconds,
    });
  }, [state.totalSeconds]);

  // Pause timer
  const pause = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      isRunning: false,
    }));
  }, []);

  // Resume timer
  const resume = useCallback(() => {
    if (state.secondsRemaining <= 0 || state.isRunning) {
      return;
    }

    setState((prev) => ({
      ...prev,
      isRunning: true,
    }));

    timerRef.current = setInterval(() => {
      setState((prev) => {
        const newSeconds = prev.secondsRemaining - 1;

        if (newSeconds <= 0) {
          // Timer complete
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }

          // Call completion callback
          if (onCompleteRef.current) {
            onCompleteRef.current();
          }

          return {
            isRunning: false,
            secondsRemaining: 0,
            totalSeconds: prev.totalSeconds,
          };
        }

        return {
          ...prev,
          secondsRemaining: newSeconds,
        };
      });
    }, 1000);
  }, [state.secondsRemaining, state.isRunning]);

  // Add time to timer
  const addTime = useCallback((seconds: number) => {
    setState((prev) => ({
      ...prev,
      secondsRemaining: prev.secondsRemaining + seconds,
      totalSeconds: prev.totalSeconds + seconds,
    }));
  }, []);

  // Calculate progress (0-1)
  const progress =
    state.totalSeconds > 0 ? 1 - state.secondsRemaining / state.totalSeconds : 0;

  return {
    // State
    isRunning: state.isRunning,
    secondsRemaining: state.secondsRemaining,
    totalSeconds: state.totalSeconds,
    progress,

    // Actions
    start,
    stop,
    reset,
    pause,
    resume,
    addTime,
  };
};

/**
 * Custom hook for rest timer with auto-advance capability
 */
export const useRestTimer = () => {
  const timer = useWorkoutTimer();
  const [nextExerciseName, setNextExerciseName] = useState<string>('');
  const [isLastExercise, setIsLastExercise] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);

  // Start rest timer with next exercise info
  const startRest = useCallback(
    (
      durationSeconds: number,
      nextName: string,
      isLast: boolean,
      shouldAutoAdvance: boolean,
      onComplete?: () => void
    ) => {
      setNextExerciseName(nextName);
      setIsLastExercise(isLast);
      setAutoAdvance(shouldAutoAdvance);
      timer.start(durationSeconds, onComplete);
    },
    [timer]
  );

  // Skip rest and immediately advance
  const skipRest = useCallback(
    (onSkip?: () => void) => {
      timer.stop();
      if (onSkip) {
        onSkip();
      }
    },
    [timer]
  );

  return {
    // State
    isRunning: timer.isRunning,
    secondsRemaining: timer.secondsRemaining,
    totalSeconds: timer.totalSeconds,
    progress: timer.progress,
    nextExerciseName,
    isLastExercise,
    autoAdvance,

    // Actions
    startRest,
    skipRest,
    pause: timer.pause,
    resume: timer.resume,
    addTime: timer.addTime,
  };
};

/**
 * Custom hook for countdown timer (workout start)
 */
export const useCountdownTimer = () => {
  const timer = useWorkoutTimer();

  // Start countdown from specified seconds
  const startCountdown = useCallback(
    (fromSeconds: number, onComplete?: () => void) => {
      timer.start(fromSeconds, onComplete);
    },
    [timer]
  );

  // Cancel countdown
  const cancelCountdown = useCallback(() => {
    timer.stop();
  }, [timer]);

  return {
    // State
    isCountingDown: timer.isRunning,
    secondsRemaining: timer.secondsRemaining,
    progress: timer.progress,

    // Actions
    startCountdown,
    cancelCountdown,
  };
};

/**
 * Format seconds as MM:SS
 */
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Format seconds as human-readable duration
 */
export const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  if (secs === 0) {
    return `${mins}m`;
  }

  return `${mins}m ${secs}s`;
};
