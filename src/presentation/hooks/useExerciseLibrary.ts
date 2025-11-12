/**
 * Custom hook for exercise library with search and filtering
 * Replaces ExerciseLibraryViewModel
 */

import { useState, useEffect, useCallback } from 'react';
import { create } from 'zustand';
import { ExerciseEntity } from '../../data/local/entities';
import {
  getAllExercises,
  getExerciseById,
  getFavorites,
  searchExercises,
  getExercisesByMuscleGroup,
  getExercisesByEquipment,
  updateFavorite,
  incrementPerformed,
} from '../../data/local/daos/exerciseDao';

interface ExerciseLibraryState {
  exercises: ExerciseEntity[];
  searchQuery: string;
  selectedMuscleGroups: Set<string>;
  selectedEquipment: Set<string>;
  showFavoritesOnly: boolean;
  isLoading: boolean;
  error: string | null;

  setExercises: (exercises: ExerciseEntity[]) => void;
  setSearchQuery: (query: string) => void;
  setSelectedMuscleGroups: (groups: Set<string>) => void;
  setSelectedEquipment: (equipment: Set<string>) => void;
  setShowFavoritesOnly: (show: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const useExerciseLibraryStore = create<ExerciseLibraryState>((set) => ({
  exercises: [],
  searchQuery: '',
  selectedMuscleGroups: new Set(),
  selectedEquipment: new Set(),
  showFavoritesOnly: false,
  isLoading: false,
  error: null,

  setExercises: (exercises) => set({ exercises }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedMuscleGroups: (groups) => set({ selectedMuscleGroups: groups }),
  setSelectedEquipment: (equipment) => set({ selectedEquipment: equipment }),
  setShowFavoritesOnly: (show) => set({ showFavoritesOnly: show }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));

/**
 * Muscle group filters
 */
export enum MuscleGroupFilter {
  CHEST = 'Chest',
  BACK = 'Back',
  LEGS = 'Legs',
  SHOULDERS = 'Shoulders',
  ARMS = 'Arms',
  CORE = 'Core',
  FULL_BODY = 'Full Body',
}

/**
 * Equipment filters
 */
export enum EquipmentFilter {
  BODYWEIGHT = 'Bodyweight',
  CABLE = 'Cable',
  BARBELL = 'Barbell',
  DUMBBELL = 'Dumbbell',
}

/**
 * Custom hook for exercise library management
 */
export const useExerciseLibrary = () => {
  const store = useExerciseLibraryStore();

  // Load exercises based on current filters
  const loadExercises = useCallback(async () => {
    try {
      store.setIsLoading(true);
      store.setError(null);

      let exercises: ExerciseEntity[] = [];

      // Show favorites only
      if (store.showFavoritesOnly) {
        exercises = await getFavorites();
      }
      // Search query takes precedence
      else if (store.searchQuery.trim().length > 0) {
        exercises = await searchExercises(store.searchQuery.trim());
      }
      // Filter by muscle group
      else if (store.selectedMuscleGroups.size > 0) {
        const results = await Promise.all(
          Array.from(store.selectedMuscleGroups).map((group) => getExercisesByMuscleGroup(group))
        );
        // Flatten and remove duplicates
        const allExercises = results.flat();
        const uniqueIds = new Set<string>();
        exercises = allExercises.filter((ex) => {
          if (uniqueIds.has(ex.id)) return false;
          uniqueIds.add(ex.id);
          return true;
        });
      }
      // Filter by equipment
      else if (store.selectedEquipment.size > 0) {
        const results = await Promise.all(
          Array.from(store.selectedEquipment).map((equipment) => getExercisesByEquipment(equipment))
        );
        // Flatten and remove duplicates
        const allExercises = results.flat();
        const uniqueIds = new Set<string>();
        exercises = allExercises.filter((ex) => {
          if (uniqueIds.has(ex.id)) return false;
          uniqueIds.add(ex.id);
          return true;
        });
      }
      // No filters, show all
      else {
        exercises = await getAllExercises();
      }

      // Apply additional filters if both muscle and equipment are selected
      if (store.selectedMuscleGroups.size > 0 && store.selectedEquipment.size > 0) {
        exercises = exercises.filter((exercise) => {
          const matchesMuscle = Array.from(store.selectedMuscleGroups).some((group) =>
            exercise.muscleGroups.includes(group)
          );
          const matchesEquipment = Array.from(store.selectedEquipment).some((equipment) =>
            exercise.equipment.includes(equipment)
          );
          return matchesMuscle && matchesEquipment;
        });
      }

      store.setExercises(exercises);
    } catch (err) {
      console.error('Failed to load exercises:', err);
      store.setError(err instanceof Error ? err.message : 'Failed to load exercises');
    } finally {
      store.setIsLoading(false);
    }
  }, [store]);

  // Update search query
  const updateSearchQuery = useCallback(
    (query: string) => {
      store.setSearchQuery(query);
      loadExercises();
    },
    [store, loadExercises]
  );

  // Toggle muscle group filter
  const toggleMuscleGroupFilter = useCallback(
    (muscleGroup: string) => {
      const newGroups = new Set(store.selectedMuscleGroups);
      if (newGroups.has(muscleGroup)) {
        newGroups.delete(muscleGroup);
      } else {
        newGroups.add(muscleGroup);
      }
      store.setSelectedMuscleGroups(newGroups);
      loadExercises();
    },
    [store, loadExercises]
  );

  // Toggle equipment filter
  const toggleEquipmentFilter = useCallback(
    (equipment: string) => {
      const newEquipment = new Set(store.selectedEquipment);
      if (newEquipment.has(equipment)) {
        newEquipment.delete(equipment);
      } else {
        newEquipment.add(equipment);
      }
      store.setSelectedEquipment(newEquipment);
      loadExercises();
    },
    [store, loadExercises]
  );

  // Toggle favorite
  const toggleFavorite = useCallback(
    async (exerciseId: string) => {
      try {
        const exercise = store.exercises.find((ex) => ex.id === exerciseId);
        if (exercise) {
          await updateFavorite(exerciseId, !exercise.isFavorite);
          await loadExercises();
        }
      } catch (err) {
        console.error('Failed to toggle favorite:', err);
        store.setError('Failed to update favorite');
      }
    },
    [store, loadExercises]
  );

  // Toggle show favorites only
  const toggleShowFavoritesOnly = useCallback(() => {
    store.setShowFavoritesOnly(!store.showFavoritesOnly);
    loadExercises();
  }, [store, loadExercises]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    store.setSearchQuery('');
    store.setSelectedMuscleGroups(new Set());
    store.setSelectedEquipment(new Set());
    store.setShowFavoritesOnly(false);
    loadExercises();
  }, [store, loadExercises]);

  // Get exercise by ID
  const getExercise = useCallback(async (exerciseId: string): Promise<ExerciseEntity | null> => {
    try {
      return await getExerciseById(exerciseId);
    } catch (err) {
      console.error('Failed to get exercise:', err);
      return null;
    }
  }, []);

  // Mark exercise as performed
  const markExercisePerformed = useCallback(async (exerciseId: string) => {
    try {
      await incrementPerformed(exerciseId);
    } catch (err) {
      console.error('Failed to mark exercise as performed:', err);
    }
  }, []);

  // Load exercises on mount and when filters change
  useEffect(() => {
    loadExercises();
  }, [
    store.searchQuery,
    store.selectedMuscleGroups,
    store.selectedEquipment,
    store.showFavoritesOnly,
  ]);

  return {
    // State
    exercises: store.exercises,
    searchQuery: store.searchQuery,
    selectedMuscleGroups: store.selectedMuscleGroups,
    selectedEquipment: store.selectedEquipment,
    showFavoritesOnly: store.showFavoritesOnly,
    isLoading: store.isLoading,
    error: store.error,

    // Actions
    updateSearchQuery,
    toggleMuscleGroupFilter,
    toggleEquipmentFilter,
    toggleFavorite,
    toggleShowFavoritesOnly,
    clearFilters,
    getExercise,
    markExercisePerformed,
    refresh: loadExercises,
  };
};
