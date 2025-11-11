/**
 * Personal Record Repository - Manages personal records (PRs)
 * Migrated from Android Kotlin PersonalRecordRepository to React Native TypeScript
 */

import * as PersonalRecordDao from '../local/daos/personalRecordDao';
import { PersonalRecordEntity } from '../local/entities';
import { PersonalRecord } from '../../domain/models/Models';

/**
 * Personal Record Repository interface
 */
export interface IPersonalRecordRepository {
  getLatestPR(exerciseId: string, workoutMode: string): Promise<PersonalRecord | null>;
  getPRsForExercise(exerciseId: string): Promise<PersonalRecord[]>;
  getBestPR(exerciseId: string): Promise<PersonalRecord | null>;
  getAllPRs(): Promise<PersonalRecord[]>;
  getAllPRsGrouped(): Promise<PersonalRecord[]>;
  updatePRIfBetter(
    exerciseId: string,
    weightPerCableKg: number,
    reps: number,
    workoutMode: string,
    timestamp: number
  ): Promise<boolean>;
}

/**
 * Personal Record Repository implementation
 */
class PersonalRecordRepositoryImpl implements IPersonalRecordRepository {
  constructor() {}

  /**
   * Get the latest PR for an exercise in a specific workout mode
   */
  async getLatestPR(exerciseId: string, workoutMode: string): Promise<PersonalRecord | null> {
    try {
      const entity = await PersonalRecordDao.getLatestPR(exerciseId, workoutMode);
      return entity ? this.entityToPersonalRecord(entity) : null;
    } catch (error) {
      console.error(`[PersonalRecordRepository] Failed to get PR for exercise ${exerciseId}:`, error);
      return null;
    }
  }

  /**
   * Get all PRs for an exercise across all workout modes
   */
  async getPRsForExercise(exerciseId: string): Promise<PersonalRecord[]> {
    try {
      const entities = await PersonalRecordDao.getPRsForExercise(exerciseId);
      return entities.map(this.entityToPersonalRecord);
    } catch (error) {
      console.error(`[PersonalRecordRepository] Failed to get PRs for exercise ${exerciseId}:`, error);
      return [];
    }
  }

  /**
   * Get the best PR for an exercise across all modes
   */
  async getBestPR(exerciseId: string): Promise<PersonalRecord | null> {
    try {
      const entity = await PersonalRecordDao.getBestPR(exerciseId);
      return entity ? this.entityToPersonalRecord(entity) : null;
    } catch (error) {
      console.error(`[PersonalRecordRepository] Failed to get best PR for exercise ${exerciseId}:`, error);
      return null;
    }
  }

  /**
   * Get all personal records
   */
  async getAllPRs(): Promise<PersonalRecord[]> {
    try {
      const entities = await PersonalRecordDao.getAllPRs();
      return entities.map(this.entityToPersonalRecord);
    } catch (error) {
      console.error('[PersonalRecordRepository] Failed to get all PRs:', error);
      return [];
    }
  }

  /**
   * Get all personal records grouped by exercise (for analytics)
   */
  async getAllPRsGrouped(): Promise<PersonalRecord[]> {
    try {
      const entities = await PersonalRecordDao.getAllPRsGrouped();
      return entities.map(this.entityToPersonalRecord);
    } catch (error) {
      console.error('[PersonalRecordRepository] Failed to get grouped PRs:', error);
      return [];
    }
  }

  /**
   * Update PR if the new performance is better
   * Returns true if a new PR was set, false otherwise
   */
  async updatePRIfBetter(
    exerciseId: string,
    weightPerCableKg: number,
    reps: number,
    workoutMode: string,
    timestamp: number
  ): Promise<boolean> {
    try {
      const isNewPR = await PersonalRecordDao.updatePRIfBetter(
        exerciseId,
        weightPerCableKg,
        reps,
        workoutMode,
        timestamp
      );

      if (isNewPR) {
        console.log(
          `[PersonalRecordRepository] New PR set for exercise ${exerciseId}: ${weightPerCableKg}kg x ${reps} reps (${workoutMode})`
        );
      }

      return isNewPR;
    } catch (error) {
      console.error(`[PersonalRecordRepository] Failed to update PR for exercise ${exerciseId}:`, error);
      return false;
    }
  }

  // ========== Helper Methods ==========

  /**
   * Convert PersonalRecordEntity to PersonalRecord
   */
  private entityToPersonalRecord(entity: PersonalRecordEntity): PersonalRecord {
    return {
      id: entity.id,
      exerciseId: entity.exerciseId,
      weightPerCableKg: entity.weightPerCableKg,
      reps: entity.reps,
      timestamp: entity.timestamp,
      workoutMode: entity.workoutMode,
    };
  }
}

// Export singleton instance
let personalRecordRepositoryInstance: PersonalRecordRepositoryImpl | null = null;

export const getPersonalRecordRepository = (): IPersonalRecordRepository => {
  if (!personalRecordRepositoryInstance) {
    personalRecordRepositoryInstance = new PersonalRecordRepositoryImpl();
  }
  return personalRecordRepositoryInstance;
};

export const resetPersonalRecordRepository = (): void => {
  personalRecordRepositoryInstance = null;
};

// Export types
export type { IPersonalRecordRepository };
export { PersonalRecordRepositoryImpl };
