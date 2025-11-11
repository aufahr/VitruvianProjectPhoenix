/**
 * Custom hook for personal record tracking
 * Replaces PR management from MainViewModel and PersonalRecordRepository
 */

import { useState, useEffect, useCallback } from 'react';
import { PersonalRecord } from '../../domain/models/Models';
import { PersonalRecordEntity } from '../../data/local/entities';
import {
  getAllPRs,
  getAllPRsGrouped,
  getPRsForExercise,
  getBestPR,
  getLatestPR,
  updatePRIfBetter,
} from '../../data/local/daos/personalRecordDao';

/**
 * Custom hook for personal records management
 */
export const usePersonalRecords = () => {
  const [allPRs, setAllPRs] = useState<PersonalRecordEntity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all personal records
  const loadAllPRs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const prs = await getAllPRs();
      setAllPRs(prs);
    } catch (err) {
      console.error('Failed to load personal records:', err);
      setError(err instanceof Error ? err.message : 'Failed to load PRs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load all PRs grouped by exercise (for analytics)
  const loadAllPRsGrouped = useCallback(async (): Promise<PersonalRecordEntity[]> => {
    try {
      return await getAllPRsGrouped();
    } catch (err) {
      console.error('Failed to load grouped PRs:', err);
      return [];
    }
  }, []);

  // Get PRs for a specific exercise
  const getPRsForExerciseId = useCallback(async (exerciseId: string): Promise<PersonalRecordEntity[]> => {
    try {
      return await getPRsForExercise(exerciseId);
    } catch (err) {
      console.error('Failed to get PRs for exercise:', err);
      return [];
    }
  }, []);

  // Get best PR for an exercise (highest weight, then highest reps)
  const getBestPRForExercise = useCallback(async (exerciseId: string): Promise<PersonalRecordEntity | null> => {
    try {
      return await getBestPR(exerciseId);
    } catch (err) {
      console.error('Failed to get best PR:', err);
      return null;
    }
  }, []);

  // Get latest PR for an exercise in a specific workout mode
  const getLatestPRForExercise = useCallback(
    async (exerciseId: string, workoutMode: string): Promise<PersonalRecordEntity | null> => {
      try {
        return await getLatestPR(exerciseId, workoutMode);
      } catch (err) {
        console.error('Failed to get latest PR:', err);
        return null;
      }
    },
    []
  );

  // Check if new performance is a PR and update if so
  const checkAndUpdatePR = useCallback(
    async (
      exerciseId: string,
      weightPerCableKg: number,
      reps: number,
      workoutMode: string
    ): Promise<boolean> => {
      try {
        const isNewPR = await updatePRIfBetter(exerciseId, weightPerCableKg, reps, workoutMode, Date.now());

        if (isNewPR) {
          console.log(`NEW PERSONAL RECORD! Exercise: ${exerciseId}, Weight: ${weightPerCableKg}kg, Reps: ${reps}`);
          await loadAllPRs(); // Refresh PR list
        }

        return isNewPR;
      } catch (err) {
        console.error('Failed to update PR:', err);
        return false;
      }
    },
    [loadAllPRs]
  );

  // Convert PersonalRecordEntity to domain PersonalRecord
  const mapToDomainPR = (entity: PersonalRecordEntity): PersonalRecord => ({
    id: entity.id ?? 0,
    exerciseId: entity.exerciseId,
    weightPerCableKg: entity.weightPerCableKg,
    reps: entity.reps,
    timestamp: entity.timestamp,
    workoutMode: entity.workoutMode,
  });

  // Get all PRs as domain objects
  const getAllPRsAsDomain = useCallback((): PersonalRecord[] => {
    return allPRs.map(mapToDomainPR);
  }, [allPRs]);

  // Load data on mount
  useEffect(() => {
    loadAllPRs();
  }, [loadAllPRs]);

  return {
    // State
    allPRs,
    isLoading,
    error,

    // Actions
    loadAllPRs,
    loadAllPRsGrouped,
    getPRsForExerciseId,
    getBestPRForExercise,
    getLatestPRForExercise,
    checkAndUpdatePR,
    getAllPRsAsDomain,
    refresh: loadAllPRs,
  };
};
