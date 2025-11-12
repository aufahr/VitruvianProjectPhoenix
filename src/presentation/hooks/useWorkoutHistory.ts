/**
 * Custom hook for workout history queries
 * Replaces workout history management from MainViewModel
 */

import { useState, useEffect, useCallback } from 'react';
import { WorkoutSession } from '../../domain/models/Models';
import {
  getAllSessions,
  getRecentSessions,
  getSession,
  deleteSession,
  deleteAllSessions,
} from '../../data/local/daos/workoutDao';

interface WorkoutStats {
  completedWorkouts: number | null;
  workoutStreak: number | null;
  progressPercentage: number | null;
}

/**
 * Custom hook for workout history and statistics
 */
export const useWorkoutHistory = () => {
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutSession[]>([]);
  const [allSessions, setAllSessions] = useState<WorkoutSession[]>([]);
  const [workoutStats, setWorkoutStats] = useState<WorkoutStats>({
    completedWorkouts: null,
    workoutStreak: null,
    progressPercentage: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load recent workout history
  const loadRecentHistory = useCallback(async (limit: number = 20) => {
    try {
      setIsLoading(true);
      setError(null);
      const sessions = await getRecentSessions(limit);
      setWorkoutHistory(sessions);
    } catch (err) {
      console.error('Failed to load workout history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load all sessions for stats calculation
  const loadAllSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const sessions = await getAllSessions();
      setAllSessions(sessions);
      calculateStats(sessions);
    } catch (err) {
      console.error('Failed to load all sessions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Calculate workout statistics
  const calculateStats = useCallback((sessions: WorkoutSession[]) => {
    if (sessions.length === 0) {
      setWorkoutStats({
        completedWorkouts: null,
        workoutStreak: null,
        progressPercentage: null,
      });
      return;
    }

    // Total completed workouts
    const completedWorkouts = sessions.length;

    // Calculate workout streak (consecutive days)
    const workoutDates = sessions
      .map((s) => {
        const date = new Date(s.timestamp ?? 0);
        return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      })
      .filter((v, i, a) => a.indexOf(v) === i) // distinct
      .sort((a, b) => b - a); // descending

    let workoutStreak: number | null = null;
    if (workoutDates.length > 0) {
      const today = new Date();
      const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
      const yesterdayDate = todayDate - 24 * 60 * 60 * 1000;
      const lastWorkoutDate = workoutDates[0];

      // Check if streak is current (workout today or yesterday)
      if (lastWorkoutDate === todayDate || lastWorkoutDate === yesterdayDate) {
        let streak = 1;
        for (let i = 1; i < workoutDates.length; i++) {
          const expectedDate = workoutDates[i - 1] - 24 * 60 * 60 * 1000;
          if (workoutDates[i] === expectedDate) {
            streak++;
          } else {
            break;
          }
        }
        workoutStreak = streak;
      }
    }

    // Calculate progress percentage (volume change between last two workouts)
    let progressPercentage: number | null = null;
    if (sessions.length >= 2) {
      const latestSession = sessions[0];
      const previousSession = sessions[1];

      // Volume = (Total Weight) * (Total Reps). Weight is per cable, so multiply by 2.
      const latestVolume = ((latestSession.weightPerCableKg ?? 0) * 2) * (latestSession.totalReps ?? 0);
      const previousVolume = ((previousSession.weightPerCableKg ?? 0) * 2) * (previousSession.totalReps ?? 0);

      if (previousVolume > 0) {
        const percentageChange = ((latestVolume - previousVolume) / previousVolume) * 100;
        progressPercentage = Math.round(percentageChange);
      }
    }

    setWorkoutStats({
      completedWorkouts,
      workoutStreak,
      progressPercentage,
    });
  }, []);

  // Get a specific session by ID
  const getSessionById = useCallback(async (sessionId: string): Promise<WorkoutSession | null> => {
    try {
      return await getSession(sessionId);
    } catch (err) {
      console.error('Failed to get session:', err);
      return null;
    }
  }, []);

  // Delete a workout
  const deleteWorkout = useCallback(
    async (sessionId: string) => {
      try {
        await deleteSession(sessionId);
        // Refresh history
        await loadRecentHistory();
        await loadAllSessions();
      } catch (err) {
        console.error('Failed to delete workout:', err);
        setError(err instanceof Error ? err.message : 'Failed to delete workout');
      }
    },
    [loadRecentHistory, loadAllSessions]
  );

  // Delete all workouts
  const deleteAllWorkouts = useCallback(async () => {
    try {
      await deleteAllSessions();
      setWorkoutHistory([]);
      setAllSessions([]);
      setWorkoutStats({
        completedWorkouts: null,
        workoutStreak: null,
        progressPercentage: null,
      });
    } catch (err) {
      console.error('Failed to delete all workouts:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete workouts');
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadRecentHistory();
    loadAllSessions();
  }, [loadRecentHistory, loadAllSessions]);

  return {
    // State
    workoutHistory,
    allSessions,
    workoutStats,
    isLoading,
    error,

    // Actions
    loadRecentHistory,
    loadAllSessions,
    getSessionById,
    deleteWorkout,
    deleteAllWorkouts,
    refresh: () => {
      loadRecentHistory();
      loadAllSessions();
    },
  };
};
