/**
 * Data Access Object for Personal Records
 * Migrated from Android Room PersonalRecordDao
 */

import { executeSql } from '../database';
import { PersonalRecordEntity } from '../entities';

/**
 * Get the latest personal record for an exercise in a specific workout mode
 */
export const getLatestPR = async (
  exerciseId: string,
  workoutMode: string
): Promise<PersonalRecordEntity | null> => {
  const sql = `
    SELECT * FROM personal_records
    WHERE exerciseId = ? AND workoutMode = ?
    LIMIT 1
  `;
  const results = await executeSql(sql, [exerciseId, workoutMode]);
  const prs = mapPRResults(results);
  return prs.length > 0 ? prs[0] : null;
};

/**
 * Get all personal records for an exercise across all workout modes
 */
export const getPRsForExercise = async (exerciseId: string): Promise<PersonalRecordEntity[]> => {
  const results = await executeSql(
    'SELECT * FROM personal_records WHERE exerciseId = ? ORDER BY timestamp DESC',
    [exerciseId]
  );
  return mapPRResults(results);
};

/**
 * Get the best PR for an exercise across all modes (highest weight, then highest reps)
 */
export const getBestPR = async (exerciseId: string): Promise<PersonalRecordEntity | null> => {
  const sql = `
    SELECT * FROM personal_records
    WHERE exerciseId = ?
    ORDER BY weightPerCableKg DESC, reps DESC
    LIMIT 1
  `;
  const results = await executeSql(sql, [exerciseId]);
  const prs = mapPRResults(results);
  return prs.length > 0 ? prs[0] : null;
};

/**
 * Get all personal records
 */
export const getAllPRs = async (): Promise<PersonalRecordEntity[]> => {
  const results = await executeSql('SELECT * FROM personal_records ORDER BY timestamp DESC');
  return mapPRResults(results);
};

/**
 * Get all personal records grouped by exercise (for analytics)
 */
export const getAllPRsGrouped = async (): Promise<PersonalRecordEntity[]> => {
  const results = await executeSql(
    'SELECT * FROM personal_records ORDER BY exerciseId, workoutMode, timestamp DESC'
  );
  return mapPRResults(results);
};

/**
 * Insert or update a personal record
 * Uses REPLACE strategy to update existing PR for the exercise+mode combination
 */
export const upsertPR = async (pr: PersonalRecordEntity): Promise<void> => {
  const sql = `
    INSERT OR REPLACE INTO personal_records
    (exerciseId, weightPerCableKg, reps, workoutMode, timestamp)
    VALUES (?, ?, ?, ?, ?)
  `;

  await executeSql(sql, [
    pr.exerciseId,
    pr.weightPerCableKg,
    pr.reps,
    pr.workoutMode,
    pr.timestamp,
  ]);
};

/**
 * Update PR only if new performance is better
 * Returns true if a new PR was set
 */
export const updatePRIfBetter = async (
  exerciseId: string,
  weightPerCableKg: number,
  reps: number,
  workoutMode: string,
  timestamp: number
): Promise<boolean> => {
  const existingPR = await getLatestPR(exerciseId, workoutMode);

  // If no existing PR, this is automatically a new PR
  if (!existingPR) {
    await upsertPR({
      exerciseId,
      weightPerCableKg,
      reps,
      workoutMode,
      timestamp,
    });
    return true;
  }

  // Compare performance: new PR if weight is higher OR (weight is same AND reps are higher)
  const isBetter =
    weightPerCableKg > existingPR.weightPerCableKg ||
    (weightPerCableKg === existingPR.weightPerCableKg && reps > existingPR.reps);

  if (isBetter) {
    await upsertPR({
      exerciseId,
      weightPerCableKg,
      reps,
      workoutMode,
      timestamp,
    });
    return true;
  }

  return false;
};

// ========== Helper Functions for Mapping Results ==========

/**
 * Map SQL results to PersonalRecordEntity array
 */
const mapPRResults = (results: any[]): PersonalRecordEntity[] => {
  const prs: PersonalRecordEntity[] = [];

  if (results && results.length > 0) {
    const resultSet = results[0];
    for (let i = 0; i < resultSet.rows.length; i++) {
      const row = resultSet.rows.item(i);
      prs.push({
        id: row.id,
        exerciseId: row.exerciseId,
        weightPerCableKg: row.weightPerCableKg,
        reps: row.reps,
        timestamp: row.timestamp,
        workoutMode: row.workoutMode,
      });
    }
  }

  return prs;
};
