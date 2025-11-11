/**
 * Data Access Object for exercise library
 * Migrated from Android Room ExerciseDao
 */

import { executeSql, executeTransaction } from '../database';
import { ExerciseEntity, ExerciseVideoEntity } from '../entities';

// ========== Exercise Operations ==========

/**
 * Get all exercises ordered by name
 */
export const getAllExercises = async (): Promise<ExerciseEntity[]> => {
  const results = await executeSql('SELECT * FROM exercises ORDER BY name ASC');
  return mapExerciseResults(results);
};

/**
 * Get an exercise by ID
 */
export const getExerciseById = async (id: string): Promise<ExerciseEntity | null> => {
  const results = await executeSql('SELECT * FROM exercises WHERE id = ?', [id]);
  const exercises = mapExerciseResults(results);
  return exercises.length > 0 ? exercises[0] : null;
};

/**
 * Get favorite exercises
 */
export const getFavorites = async (): Promise<ExerciseEntity[]> => {
  const results = await executeSql(
    'SELECT * FROM exercises WHERE isFavorite = 1 ORDER BY name ASC'
  );
  return mapExerciseResults(results);
};

/**
 * Search exercises by query (searches name, description, and muscles)
 */
export const searchExercises = async (query: string): Promise<ExerciseEntity[]> => {
  const sql = `
    SELECT * FROM exercises
    WHERE name LIKE ? OR description LIKE ? OR muscles LIKE ?
    ORDER BY popularity DESC, name ASC
  `;
  const searchPattern = `%${query}%`;
  const results = await executeSql(sql, [searchPattern, searchPattern, searchPattern]);
  return mapExerciseResults(results);
};

/**
 * Get exercises by muscle group
 */
export const getExercisesByMuscleGroup = async (muscleGroup: string): Promise<ExerciseEntity[]> => {
  const sql = `
    SELECT * FROM exercises
    WHERE muscleGroups LIKE ?
    ORDER BY popularity DESC, name ASC
  `;
  const results = await executeSql(sql, [`%${muscleGroup}%`]);
  return mapExerciseResults(results);
};

/**
 * Get exercises by equipment
 */
export const getExercisesByEquipment = async (equipment: string): Promise<ExerciseEntity[]> => {
  const sql = `
    SELECT * FROM exercises
    WHERE equipment LIKE ?
    ORDER BY popularity DESC, name ASC
  `;
  const results = await executeSql(sql, [`%${equipment}%`]);
  return mapExerciseResults(results);
};

/**
 * Update favorite status for an exercise
 */
export const updateFavorite = async (id: string, isFavorite: boolean): Promise<void> => {
  await executeSql('UPDATE exercises SET isFavorite = ? WHERE id = ?', [isFavorite ? 1 : 0, id]);
};

/**
 * Increment times performed for an exercise
 */
export const incrementPerformed = async (
  id: string,
  timestamp: number = Date.now()
): Promise<void> => {
  await executeSql(
    'UPDATE exercises SET timesPerformed = timesPerformed + 1, lastPerformed = ? WHERE id = ?',
    [timestamp, id]
  );
};

/**
 * Insert multiple exercises
 */
export const insertAll = async (exercises: ExerciseEntity[]): Promise<void> => {
  await executeTransaction((tx) => {
    const sql = `
      INSERT OR REPLACE INTO exercises
      (id, name, description, created, muscleGroups, muscles, equipment, movement,
       sidedness, grip, gripWidth, minRepRange, popularity, archived, isFavorite,
       timesPerformed, lastPerformed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    exercises.forEach((exercise) => {
      tx.executeSql(sql, [
        exercise.id,
        exercise.name,
        exercise.description,
        exercise.created,
        exercise.muscleGroups,
        exercise.muscles,
        exercise.equipment,
        exercise.movement,
        exercise.sidedness,
        exercise.grip,
        exercise.gripWidth,
        exercise.minRepRange,
        exercise.popularity,
        exercise.archived ? 1 : 0,
        exercise.isFavorite ? 1 : 0,
        exercise.timesPerformed,
        exercise.lastPerformed,
      ]);
    });
  });
};

/**
 * Insert a single exercise
 */
export const insert = async (exercise: ExerciseEntity): Promise<void> => {
  const sql = `
    INSERT OR REPLACE INTO exercises
    (id, name, description, created, muscleGroups, muscles, equipment, movement,
     sidedness, grip, gripWidth, minRepRange, popularity, archived, isFavorite,
     timesPerformed, lastPerformed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  await executeSql(sql, [
    exercise.id,
    exercise.name,
    exercise.description,
    exercise.created,
    exercise.muscleGroups,
    exercise.muscles,
    exercise.equipment,
    exercise.movement,
    exercise.sidedness,
    exercise.grip,
    exercise.gripWidth,
    exercise.minRepRange,
    exercise.popularity,
    exercise.archived ? 1 : 0,
    exercise.isFavorite ? 1 : 0,
    exercise.timesPerformed,
    exercise.lastPerformed,
  ]);
};

/**
 * Delete all exercises
 */
export const deleteAll = async (): Promise<void> => {
  await executeSql('DELETE FROM exercises');
};

// ========== Video Operations ==========

/**
 * Get videos for an exercise ordered by angle
 */
export const getVideos = async (exerciseId: string): Promise<ExerciseVideoEntity[]> => {
  const results = await executeSql(
    'SELECT * FROM exercise_videos WHERE exerciseId = ? ORDER BY angle ASC',
    [exerciseId]
  );
  return mapVideoResults(results);
};

/**
 * Insert multiple videos
 */
export const insertVideos = async (videos: ExerciseVideoEntity[]): Promise<void> => {
  await executeTransaction((tx) => {
    const sql = `
      INSERT OR REPLACE INTO exercise_videos
      (exerciseId, angle, videoUrl, thumbnailUrl)
      VALUES (?, ?, ?, ?)
    `;

    videos.forEach((video) => {
      tx.executeSql(sql, [video.exerciseId, video.angle, video.videoUrl, video.thumbnailUrl]);
    });
  });
};

/**
 * Insert a single video
 */
export const insertVideo = async (video: ExerciseVideoEntity): Promise<void> => {
  const sql = `
    INSERT OR REPLACE INTO exercise_videos
    (exerciseId, angle, videoUrl, thumbnailUrl)
    VALUES (?, ?, ?, ?)
  `;

  await executeSql(sql, [video.exerciseId, video.angle, video.videoUrl, video.thumbnailUrl]);
};

/**
 * Delete all videos
 */
export const deleteAllVideos = async (): Promise<void> => {
  await executeSql('DELETE FROM exercise_videos');
};

// ========== Transaction Operations ==========

/**
 * Insert an exercise with its videos
 */
export const insertExerciseWithVideos = async (
  exercise: ExerciseEntity,
  videos: ExerciseVideoEntity[]
): Promise<void> => {
  await executeTransaction(async (tx) => {
    // Insert exercise
    const exerciseSql = `
      INSERT OR REPLACE INTO exercises
      (id, name, description, created, muscleGroups, muscles, equipment, movement,
       sidedness, grip, gripWidth, minRepRange, popularity, archived, isFavorite,
       timesPerformed, lastPerformed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    tx.executeSql(exerciseSql, [
      exercise.id,
      exercise.name,
      exercise.description,
      exercise.created,
      exercise.muscleGroups,
      exercise.muscles,
      exercise.equipment,
      exercise.movement,
      exercise.sidedness,
      exercise.grip,
      exercise.gripWidth,
      exercise.minRepRange,
      exercise.popularity,
      exercise.archived ? 1 : 0,
      exercise.isFavorite ? 1 : 0,
      exercise.timesPerformed,
      exercise.lastPerformed,
    ]);

    // Insert videos
    const videoSql = `
      INSERT OR REPLACE INTO exercise_videos
      (exerciseId, angle, videoUrl, thumbnailUrl)
      VALUES (?, ?, ?, ?)
    `;

    videos.forEach((video) => {
      tx.executeSql(videoSql, [video.exerciseId, video.angle, video.videoUrl, video.thumbnailUrl]);
    });
  });
};

// ========== Helper Functions for Mapping Results ==========

/**
 * Map SQL results to ExerciseEntity array
 */
const mapExerciseResults = (results: any[]): ExerciseEntity[] => {
  const exercises: ExerciseEntity[] = [];

  if (results && results.length > 0) {
    const resultSet = results[0];
    for (let i = 0; i < resultSet.rows.length; i++) {
      const row = resultSet.rows.item(i);
      exercises.push({
        id: row.id,
        name: row.name,
        description: row.description,
        created: row.created,
        muscleGroups: row.muscleGroups,
        muscles: row.muscles,
        equipment: row.equipment,
        movement: row.movement,
        sidedness: row.sidedness,
        grip: row.grip,
        gripWidth: row.gripWidth,
        minRepRange: row.minRepRange,
        popularity: row.popularity,
        archived: row.archived === 1,
        isFavorite: row.isFavorite === 1,
        timesPerformed: row.timesPerformed,
        lastPerformed: row.lastPerformed,
      });
    }
  }

  return exercises;
};

/**
 * Map SQL results to ExerciseVideoEntity array
 */
const mapVideoResults = (results: any[]): ExerciseVideoEntity[] => {
  const videos: ExerciseVideoEntity[] = [];

  if (results && results.length > 0) {
    const resultSet = results[0];
    for (let i = 0; i < resultSet.rows.length; i++) {
      const row = resultSet.rows.item(i);
      videos.push({
        id: row.id,
        exerciseId: row.exerciseId,
        angle: row.angle,
        videoUrl: row.videoUrl,
        thumbnailUrl: row.thumbnailUrl,
      });
    }
  }

  return videos;
};
