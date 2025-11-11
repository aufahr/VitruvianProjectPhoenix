/**
 * Exercise Repository - Manages exercise library
 * Migrated from Android Kotlin ExerciseRepository to React Native TypeScript
 */

import * as ExerciseDao from '../local/daos/exerciseDao';
import { ExerciseEntity, ExerciseVideoEntity } from '../local/entities';

/**
 * Exercise Repository interface
 */
export interface IExerciseRepository {
  getAllExercises(): Promise<ExerciseEntity[]>;
  searchExercises(query: string): Promise<ExerciseEntity[]>;
  filterByMuscleGroup(muscleGroup: string): Promise<ExerciseEntity[]>;
  filterByEquipment(equipment: string): Promise<ExerciseEntity[]>;
  getFavorites(): Promise<ExerciseEntity[]>;
  toggleFavorite(id: string): Promise<void>;
  getExerciseById(id: string): Promise<ExerciseEntity | null>;
  getVideos(exerciseId: string): Promise<ExerciseVideoEntity[]>;
  importExercises(): Promise<void>;
  isExerciseLibraryEmpty(): Promise<boolean>;
}

/**
 * Exercise Repository implementation
 */
class ExerciseRepositoryImpl implements IExerciseRepository {
  constructor() {}

  /**
   * Get all exercises sorted by name
   */
  async getAllExercises(): Promise<ExerciseEntity[]> {
    try {
      return await ExerciseDao.getAllExercises();
    } catch (error) {
      console.error('[ExerciseRepository] Failed to get all exercises:', error);
      throw error;
    }
  }

  /**
   * Search exercises by name, description, or muscles
   */
  async searchExercises(query: string): Promise<ExerciseEntity[]> {
    try {
      if (!query || query.trim().length === 0) {
        return await this.getAllExercises();
      }
      return await ExerciseDao.searchExercises(query.trim());
    } catch (error) {
      console.error('[ExerciseRepository] Failed to search exercises:', error);
      throw error;
    }
  }

  /**
   * Filter exercises by muscle group
   */
  async filterByMuscleGroup(muscleGroup: string): Promise<ExerciseEntity[]> {
    try {
      if (!muscleGroup || muscleGroup.trim().length === 0) {
        return await this.getAllExercises();
      }
      return await ExerciseDao.getExercisesByMuscleGroup(muscleGroup);
    } catch (error) {
      console.error('[ExerciseRepository] Failed to filter by muscle group:', error);
      throw error;
    }
  }

  /**
   * Filter exercises by equipment
   */
  async filterByEquipment(equipment: string): Promise<ExerciseEntity[]> {
    try {
      if (!equipment || equipment.trim().length === 0) {
        return await this.getAllExercises();
      }
      return await ExerciseDao.getExercisesByEquipment(equipment);
    } catch (error) {
      console.error('[ExerciseRepository] Failed to filter by equipment:', error);
      throw error;
    }
  }

  /**
   * Get favorite exercises
   */
  async getFavorites(): Promise<ExerciseEntity[]> {
    try {
      return await ExerciseDao.getFavorites();
    } catch (error) {
      console.error('[ExerciseRepository] Failed to get favorites:', error);
      throw error;
    }
  }

  /**
   * Toggle favorite status for an exercise
   */
  async toggleFavorite(id: string): Promise<void> {
    try {
      const exercise = await ExerciseDao.getExerciseById(id);
      if (exercise) {
        await ExerciseDao.updateFavorite(id, !exercise.isFavorite);
        console.log(`[ExerciseRepository] Toggled favorite for exercise: ${id}`);
      }
    } catch (error) {
      console.error('[ExerciseRepository] Failed to toggle favorite:', error);
      throw error;
    }
  }

  /**
   * Get exercise by ID
   */
  async getExerciseById(id: string): Promise<ExerciseEntity | null> {
    try {
      return await ExerciseDao.getExerciseById(id);
    } catch (error) {
      console.error('[ExerciseRepository] Failed to get exercise by ID:', error);
      return null;
    }
  }

  /**
   * Get videos for an exercise
   */
  async getVideos(exerciseId: string): Promise<ExerciseVideoEntity[]> {
    try {
      return await ExerciseDao.getVideos(exerciseId);
    } catch (error) {
      console.error('[ExerciseRepository] Failed to get videos:', error);
      return [];
    }
  }

  /**
   * Import exercises from assets (if not already imported)
   * In React Native, this would typically import from a JSON file bundled with the app
   */
  async importExercises(): Promise<void> {
    try {
      // Check if exercises are already imported
      const count = await this.isExerciseLibraryEmpty();
      if (!count) {
        console.log('[ExerciseRepository] Exercises already imported');
        return;
      }

      console.log('[ExerciseRepository] Importing exercises from assets...');

      // Import exercises from bundled JSON
      // Note: In React Native, you would typically require a JSON file here
      // Example: const exercises = require('../../assets/exercises.json');
      // For now, we'll assume the import functionality is handled by a separate service
      // that calls ExerciseDao.insertExercise for each exercise

      console.log('[ExerciseRepository] Exercise import would be handled here');
      console.log('[ExerciseRepository] In production, load from bundled JSON and insert into database');
    } catch (error) {
      console.error('[ExerciseRepository] Failed to import exercises:', error);
      throw error;
    }
  }

  /**
   * Check if exercise library is empty
   */
  async isExerciseLibraryEmpty(): Promise<boolean> {
    try {
      const exercises = await this.getAllExercises();
      return exercises.length === 0;
    } catch (error) {
      console.error('[ExerciseRepository] Failed to check if library is empty:', error);
      return true;
    }
  }
}

// Export singleton instance
let exerciseRepositoryInstance: ExerciseRepositoryImpl | null = null;

export const getExerciseRepository = (): IExerciseRepository => {
  if (!exerciseRepositoryInstance) {
    exerciseRepositoryInstance = new ExerciseRepositoryImpl();
  }
  return exerciseRepositoryInstance;
};

export const resetExerciseRepository = (): void => {
  exerciseRepositoryInstance = null;
};

// Export types
export type { IExerciseRepository };
export { ExerciseRepositoryImpl };
