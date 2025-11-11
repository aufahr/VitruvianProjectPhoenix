/**
 * Custom hook for weekly program management
 * Provides access to weekly programs and active program state
 */

import { useState, useEffect, useCallback } from 'react';
import { create } from 'zustand';
import { WeeklyProgramEntity, WeeklyProgramWithDays } from '../../data/local/entities';
import {
  getAllProgramsWithDays,
  getActiveProgramWithDays,
  activateProgram as activateProgramDao,
  deleteProgram as deleteProgramDao,
  insertProgramWithDays,
} from '../../data/local/daos/workoutDao';

interface WeeklyProgramsState {
  programs: WeeklyProgramWithDays[];
  activeProgram: WeeklyProgramWithDays | null;
  isLoading: boolean;
  error: string | null;

  setPrograms: (programs: WeeklyProgramWithDays[]) => void;
  setActiveProgram: (program: WeeklyProgramWithDays | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const useWeeklyProgramsStore = create<WeeklyProgramsState>((set) => ({
  programs: [],
  activeProgram: null,
  isLoading: false,
  error: null,

  setPrograms: (programs) => set({ programs }),
  setActiveProgram: (activeProgram) => set({ activeProgram }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));

/**
 * Custom hook for weekly program management
 */
export const useWeeklyPrograms = () => {
  const store = useWeeklyProgramsStore();

  // Load all programs
  const loadPrograms = useCallback(async () => {
    try {
      store.setIsLoading(true);
      store.setError(null);
      const programs = await getAllProgramsWithDays();
      store.setPrograms(programs);
    } catch (err) {
      console.error('Failed to load programs:', err);
      store.setError(err instanceof Error ? err.message : 'Failed to load programs');
    } finally {
      store.setIsLoading(false);
    }
  }, [store]);

  // Load active program
  const loadActiveProgram = useCallback(async () => {
    try {
      const activeProgram = await getActiveProgramWithDays();
      store.setActiveProgram(activeProgram);
    } catch (err) {
      console.error('Failed to load active program:', err);
    }
  }, [store]);

  // Activate a program
  const activateProgram = useCallback(
    async (programId: string) => {
      try {
        store.setError(null);
        await activateProgramDao(programId);
        await loadPrograms();
        await loadActiveProgram();
        console.log(`Program activated: ${programId}`);
      } catch (err) {
        console.error('Failed to activate program:', err);
        store.setError(err instanceof Error ? err.message : 'Failed to activate program');
        throw err;
      }
    },
    [store, loadPrograms, loadActiveProgram]
  );

  // Delete a program
  const deleteProgram = useCallback(
    async (programId: string) => {
      try {
        store.setError(null);
        await deleteProgramDao(programId);
        await loadPrograms();
        await loadActiveProgram();
        console.log(`Program deleted: ${programId}`);
      } catch (err) {
        console.error('Failed to delete program:', err);
        store.setError(err instanceof Error ? err.message : 'Failed to delete program');
        throw err;
      }
    },
    [store, loadPrograms, loadActiveProgram]
  );

  // Save a program with its days
  const saveProgram = useCallback(
    async (program: WeeklyProgramEntity, days: any[]) => {
      try {
        store.setError(null);
        await insertProgramWithDays(program, days);
        await loadPrograms();
        await loadActiveProgram();
        console.log(`Program saved: ${program.title}`);
      } catch (err) {
        console.error('Failed to save program:', err);
        store.setError(err instanceof Error ? err.message : 'Failed to save program');
        throw err;
      }
    },
    [store, loadPrograms, loadActiveProgram]
  );

  // Load programs and active program on mount
  useEffect(() => {
    loadPrograms();
    loadActiveProgram();
  }, [loadPrograms, loadActiveProgram]);

  return {
    // State
    programs: store.programs,
    activeProgram: store.activeProgram,
    isLoading: store.isLoading,
    error: store.error,

    // Actions
    loadPrograms,
    loadActiveProgram,
    activateProgram,
    deleteProgram,
    saveProgram,
    refresh: loadPrograms,
  };
};
