/**
 * Custom hook for routine management
 * Replaces routine management from MainViewModel
 */

import { useState, useEffect, useCallback } from 'react';
import { create } from 'zustand';
import { Routine, RoutineExercise } from '../../domain/models/Routine';
import {
  getAllRoutines,
  getRoutineById,
  insertRoutine,
  updateRoutineEntity,
  deleteRoutine as deleteRoutineDao,
  markRoutineUsed,
} from '../../data/local/daos/workoutDao';
import { generateUUID } from '../../domain/models/Models';

interface RoutinesState {
  routines: Routine[];
  loadedRoutine: Routine | null;
  currentExerciseIndex: number;
  currentSetIndex: number;
  isLoading: boolean;
  error: string | null;

  setRoutines: (routines: Routine[]) => void;
  setLoadedRoutine: (routine: Routine | null) => void;
  setCurrentExerciseIndex: (index: number) => void;
  setCurrentSetIndex: (index: number) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const useRoutinesStore = create<RoutinesState>((set) => ({
  routines: [],
  loadedRoutine: null,
  currentExerciseIndex: 0,
  currentSetIndex: 0,
  isLoading: false,
  error: null,

  setRoutines: (routines) => set({ routines }),
  setLoadedRoutine: (routine) => set({ loadedRoutine: routine }),
  setCurrentExerciseIndex: (index) => set({ currentExerciseIndex: index }),
  setCurrentSetIndex: (index) => set({ currentSetIndex: index }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      loadedRoutine: null,
      currentExerciseIndex: 0,
      currentSetIndex: 0,
    }),
}));

/**
 * Custom hook for routine management
 */
export const useRoutines = () => {
  const store = useRoutinesStore();

  // Load all routines
  const loadRoutines = useCallback(async () => {
    try {
      store.setIsLoading(true);
      store.setError(null);
      const routines = await getAllRoutines();
      store.setRoutines(routines);
    } catch (err) {
      console.error('Failed to load routines:', err);
      store.setError(err instanceof Error ? err.message : 'Failed to load routines');
    } finally {
      store.setIsLoading(false);
    }
  }, [store]);

  // Get routine by ID
  const getRoutine = useCallback(async (routineId: string): Promise<Routine | null> => {
    try {
      return await getRoutineById(routineId);
    } catch (err) {
      console.error('Failed to get routine:', err);
      return null;
    }
  }, []);

  // Save a new routine
  const saveRoutine = useCallback(
    async (routine: Routine) => {
      try {
        store.setError(null);
        const routineToSave = {
          ...routine,
          id: routine.id || generateUUID(),
          createdAt: routine.createdAt || Date.now(),
        };
        await insertRoutine(routineToSave);
        await loadRoutines();
        console.log(`Routine saved: ${routineToSave.name}`);
      } catch (err) {
        console.error('Failed to save routine:', err);
        store.setError(err instanceof Error ? err.message : 'Failed to save routine');
        throw err;
      }
    },
    [store, loadRoutines]
  );

  // Update an existing routine
  const updateRoutine = useCallback(
    async (routine: Routine) => {
      try {
        store.setError(null);
        await updateRoutineEntity(routine);
        await loadRoutines();
        console.log(`Routine updated: ${routine.name}`);
      } catch (err) {
        console.error('Failed to update routine:', err);
        store.setError(err instanceof Error ? err.message : 'Failed to update routine');
        throw err;
      }
    },
    [store, loadRoutines]
  );

  // Delete a routine
  const deleteRoutine = useCallback(
    async (routineId: string) => {
      try {
        store.setError(null);
        await deleteRoutineDao(routineId);
        await loadRoutines();
        console.log(`Routine deleted: ${routineId}`);
      } catch (err) {
        console.error('Failed to delete routine:', err);
        store.setError(err instanceof Error ? err.message : 'Failed to delete routine');
        throw err;
      }
    },
    [store, loadRoutines]
  );

  // Load a routine for workout execution
  const loadRoutine = useCallback(
    (routine: Routine) => {
      if (!routine.exercises || routine.exercises.length === 0) {
        console.warn('Cannot load routine with no exercises');
        return;
      }

      store.setLoadedRoutine(routine);
      store.setCurrentExerciseIndex(0);
      store.setCurrentSetIndex(0);

      // Mark routine as used
      markRoutineUsed(routine.id).catch((err) => {
        console.error('Failed to mark routine as used:', err);
      });

      console.log(`Routine loaded: ${routine.name}`);
      console.log(`  Total exercises: ${routine.exercises.length}`);
      console.log(`  First exercise: ${routine.exercises[0].exercise.name}`);
    },
    [store]
  );

  // Clear loaded routine
  const clearLoadedRoutine = useCallback(() => {
    store.reset();
    console.log('Cleared loaded routine');
  }, [store]);

  // Get current exercise from loaded routine
  const getCurrentExercise = useCallback((): RoutineExercise | null => {
    if (!store.loadedRoutine || !store.loadedRoutine.exercises) {
      return null;
    }
    return store.loadedRoutine.exercises[store.currentExerciseIndex] || null;
  }, [store.loadedRoutine, store.currentExerciseIndex]);

  // Move to next exercise
  const nextExercise = useCallback(() => {
    if (!store.loadedRoutine || !store.loadedRoutine.exercises) {
      return;
    }

    const currentIndex = store.currentExerciseIndex;
    const totalExercises = store.loadedRoutine.exercises.length;

    if (currentIndex < totalExercises - 1) {
      store.setCurrentExerciseIndex(currentIndex + 1);
      store.setCurrentSetIndex(0);
      console.log(`Moved to exercise ${currentIndex + 2}/${totalExercises}`);
    } else {
      console.log('Last exercise in routine completed');
      clearLoadedRoutine();
    }
  }, [store, clearLoadedRoutine]);

  // Move to previous exercise
  const previousExercise = useCallback(() => {
    if (!store.loadedRoutine || !store.loadedRoutine.exercises) {
      return;
    }

    const currentIndex = store.currentExerciseIndex;

    if (currentIndex > 0) {
      store.setCurrentExerciseIndex(currentIndex - 1);
      store.setCurrentSetIndex(0);
      console.log(`Moved to exercise ${currentIndex}/${store.loadedRoutine.exercises.length}`);
    }
  }, [store]);

  // Move to next set
  const nextSet = useCallback(() => {
    const currentExercise = getCurrentExercise();
    if (!currentExercise || !currentExercise.setReps) {
      return;
    }

    const totalSets = currentExercise.setReps.length;
    const currentSet = store.currentSetIndex;

    if (currentSet < totalSets - 1) {
      store.setCurrentSetIndex(currentSet + 1);
      console.log(`Moved to set ${currentSet + 2}/${totalSets}`);
    } else {
      // Last set of exercise, move to next exercise
      nextExercise();
    }
  }, [store, getCurrentExercise, nextExercise]);

  // Check if there are more sets in current exercise
  const hasMoreSets = useCallback((): boolean => {
    const currentExercise = getCurrentExercise();
    if (!currentExercise || !currentExercise.setReps) {
      return false;
    }
    return store.currentSetIndex < currentExercise.setReps.length - 1;
  }, [store.currentSetIndex, getCurrentExercise]);

  // Check if there are more exercises in routine
  const hasMoreExercises = useCallback((): boolean => {
    if (!store.loadedRoutine || !store.loadedRoutine.exercises) {
      return false;
    }
    return store.currentExerciseIndex < store.loadedRoutine.exercises.length - 1;
  }, [store.loadedRoutine, store.currentExerciseIndex]);

  // Load routines on mount
  useEffect(() => {
    loadRoutines();
  }, [loadRoutines]);

  return {
    // State
    routines: store.routines,
    loadedRoutine: store.loadedRoutine,
    currentExerciseIndex: store.currentExerciseIndex,
    currentSetIndex: store.currentSetIndex,
    isLoading: store.isLoading,
    error: store.error,

    // Actions
    loadRoutines,
    getRoutine,
    saveRoutine,
    updateRoutine,
    deleteRoutine,
    loadRoutine,
    clearLoadedRoutine,
    getCurrentExercise,
    nextExercise,
    previousExercise,
    nextSet,
    hasMoreSets,
    hasMoreExercises,
    refresh: loadRoutines,
  };
};
