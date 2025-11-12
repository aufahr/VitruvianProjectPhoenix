/**
 * Data Access Object for workout data
 * Migrated from Android Room WorkoutDao
 */

import { executeSql, executeTransaction } from '../database';
import {
  WorkoutSessionEntity,
  WorkoutMetricEntity,
  RoutineEntity,
  RoutineExerciseEntity,
  WeeklyProgramEntity,
  ProgramDayEntity,
  WeeklyProgramWithDays,
} from '../entities';

// ========== Session Operations ==========

/**
 * Insert a workout session
 */
export const insertSession = async (session: WorkoutSessionEntity): Promise<void> => {
  const sql = `
    INSERT OR REPLACE INTO workout_sessions
    (id, timestamp, mode, reps, weightPerCableKg, progressionKg, duration, totalReps,
     warmupReps, workingReps, isJustLift, stopAtTop, eccentricLoad, echoLevel, exerciseId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  await executeSql(sql, [
    session.id,
    session.timestamp,
    session.mode,
    session.reps,
    session.weightPerCableKg,
    session.progressionKg,
    session.duration,
    session.totalReps,
    session.warmupReps,
    session.workingReps,
    session.isJustLift ? 1 : 0,
    session.stopAtTop ? 1 : 0,
    session.eccentricLoad,
    session.echoLevel,
    session.exerciseId,
  ]);
};

/**
 * Get all workout sessions ordered by timestamp descending
 */
export const getAllSessions = async (): Promise<WorkoutSessionEntity[]> => {
  const results = await executeSql('SELECT * FROM workout_sessions ORDER BY timestamp DESC');
  return mapSessionResults(results);
};

/**
 * Get a specific session by ID
 */
export const getSession = async (sessionId: string): Promise<WorkoutSessionEntity | null> => {
  const results = await executeSql('SELECT * FROM workout_sessions WHERE id = ?', [sessionId]);
  const sessions = mapSessionResults(results);
  return sessions.length > 0 ? sessions[0] : null;
};

/**
 * Get recent sessions with limit
 */
export const getRecentSessions = async (limit: number = 10): Promise<WorkoutSessionEntity[]> => {
  const results = await executeSql(
    'SELECT * FROM workout_sessions ORDER BY timestamp DESC LIMIT ?',
    [limit]
  );
  return mapSessionResults(results);
};

/**
 * Delete a workout session
 */
export const deleteSession = async (sessionId: string): Promise<void> => {
  await executeSql('DELETE FROM workout_sessions WHERE id = ?', [sessionId]);
};

/**
 * Delete all workout sessions
 */
export const deleteAllSessions = async (): Promise<void> => {
  await executeSql('DELETE FROM workout_sessions');
};

// ========== Metric Operations ==========

/**
 * Insert a single workout metric
 */
export const insertMetric = async (metric: WorkoutMetricEntity): Promise<void> => {
  const sql = `
    INSERT OR REPLACE INTO workout_metrics
    (sessionId, timestamp, loadA, loadB, positionA, positionB, ticks)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  await executeSql(sql, [
    metric.sessionId,
    metric.timestamp,
    metric.loadA,
    metric.loadB,
    metric.positionA,
    metric.positionB,
    metric.ticks,
  ]);
};

/**
 * Insert multiple workout metrics
 */
export const insertMetrics = async (metrics: WorkoutMetricEntity[]): Promise<void> => {
  await executeTransaction((tx) => {
    const sql = `
      INSERT OR REPLACE INTO workout_metrics
      (sessionId, timestamp, loadA, loadB, positionA, positionB, ticks)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    metrics.forEach((metric) => {
      tx.executeSql(sql, [
        metric.sessionId,
        metric.timestamp,
        metric.loadA,
        metric.loadB,
        metric.positionA,
        metric.positionB,
        metric.ticks,
      ]);
    });
  });
};

/**
 * Get metrics for a specific session
 */
export const getMetricsForSession = async (sessionId: string): Promise<WorkoutMetricEntity[]> => {
  const results = await executeSql(
    'SELECT * FROM workout_metrics WHERE sessionId = ? ORDER BY timestamp ASC',
    [sessionId]
  );
  return mapMetricResults(results);
};

/**
 * Delete metrics for a session
 */
export const deleteMetricsForSession = async (sessionId: string): Promise<void> => {
  await executeSql('DELETE FROM workout_metrics WHERE sessionId = ?', [sessionId]);
};

/**
 * Delete all metrics
 */
export const deleteAllMetrics = async (): Promise<void> => {
  await executeSql('DELETE FROM workout_metrics');
};

// ========== Combined Operations ==========

/**
 * Delete a complete workout (session and its metrics)
 */
export const deleteWorkout = async (sessionId: string): Promise<void> => {
  await executeTransaction((tx) => {
    tx.executeSql('DELETE FROM workout_sessions WHERE id = ?', [sessionId]);
    tx.executeSql('DELETE FROM workout_metrics WHERE sessionId = ?', [sessionId]);
  });
};

/**
 * Delete all workouts (sessions and metrics)
 */
export const deleteAllWorkouts = async (): Promise<void> => {
  await executeTransaction((tx) => {
    tx.executeSql('DELETE FROM workout_sessions');
    tx.executeSql('DELETE FROM workout_metrics');
  });
};

// ========== Routine Operations ==========

/**
 * Insert a routine
 */
export const insertRoutine = async (routine: RoutineEntity): Promise<void> => {
  const sql = `
    INSERT OR REPLACE INTO routines
    (id, name, description, createdAt, lastUsed, useCount)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  await executeSql(sql, [
    routine.id,
    routine.name,
    routine.description,
    routine.createdAt,
    routine.lastUsed,
    routine.useCount,
  ]);
};

/**
 * Update a routine
 */
export const updateRoutine = async (routine: RoutineEntity): Promise<void> => {
  const sql = `
    UPDATE routines
    SET name = ?, description = ?, createdAt = ?, lastUsed = ?, useCount = ?
    WHERE id = ?
  `;

  await executeSql(sql, [
    routine.name,
    routine.description,
    routine.createdAt,
    routine.lastUsed,
    routine.useCount,
    routine.id,
  ]);
};

/**
 * Delete a routine by ID
 */
export const deleteRoutineById = async (routineId: string): Promise<void> => {
  await executeSql('DELETE FROM routines WHERE id = ?', [routineId]);
};

/**
 * Get all routines ordered by last used and created date
 */
export const getAllRoutines = async (): Promise<RoutineEntity[]> => {
  const results = await executeSql(
    'SELECT * FROM routines ORDER BY lastUsed DESC, createdAt DESC'
  );
  return mapRoutineResults(results);
};

/**
 * Get a routine by ID
 */
export const getRoutineById = async (routineId: string): Promise<RoutineEntity | null> => {
  const results = await executeSql('SELECT * FROM routines WHERE id = ?', [routineId]);
  const routines = mapRoutineResults(results);
  return routines.length > 0 ? routines[0] : null;
};

/**
 * Mark a routine as used (increment use count and update timestamp)
 */
export const markRoutineUsed = async (
  routineId: string,
  timestamp: number = Date.now()
): Promise<void> => {
  await executeSql(
    'UPDATE routines SET lastUsed = ?, useCount = useCount + 1 WHERE id = ?',
    [timestamp, routineId]
  );
};

// ========== Routine Exercise Operations ==========

/**
 * Insert a routine exercise
 */
export const insertExercise = async (exercise: RoutineExerciseEntity): Promise<void> => {
  const sql = `
    INSERT OR REPLACE INTO routine_exercises
    (id, routineId, exerciseName, exerciseMuscleGroup, exerciseEquipment,
     exerciseDefaultCableConfig, exerciseId, cableConfig, orderIndex, setReps,
     weightPerCableKg, setWeights, mode, eccentricLoad, echoLevel, progressionKg,
     restSeconds, notes, duration)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  await executeSql(sql, [
    exercise.id,
    exercise.routineId,
    exercise.exerciseName,
    exercise.exerciseMuscleGroup,
    exercise.exerciseEquipment,
    exercise.exerciseDefaultCableConfig,
    exercise.exerciseId,
    exercise.cableConfig,
    exercise.orderIndex,
    exercise.setReps,
    exercise.weightPerCableKg,
    exercise.setWeights,
    exercise.mode,
    exercise.eccentricLoad,
    exercise.echoLevel,
    exercise.progressionKg,
    exercise.restSeconds,
    exercise.notes,
    exercise.duration,
  ]);
};

/**
 * Insert multiple routine exercises
 */
export const insertExercises = async (exercises: RoutineExerciseEntity[]): Promise<void> => {
  await executeTransaction((tx) => {
    const sql = `
      INSERT OR REPLACE INTO routine_exercises
      (id, routineId, exerciseName, exerciseMuscleGroup, exerciseEquipment,
       exerciseDefaultCableConfig, exerciseId, cableConfig, orderIndex, setReps,
       weightPerCableKg, setWeights, mode, eccentricLoad, echoLevel, progressionKg,
       restSeconds, notes, duration)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    exercises.forEach((exercise) => {
      tx.executeSql(sql, [
        exercise.id,
        exercise.routineId,
        exercise.exerciseName,
        exercise.exerciseMuscleGroup,
        exercise.exerciseEquipment,
        exercise.exerciseDefaultCableConfig,
        exercise.exerciseId,
        exercise.cableConfig,
        exercise.orderIndex,
        exercise.setReps,
        exercise.weightPerCableKg,
        exercise.setWeights,
        exercise.mode,
        exercise.eccentricLoad,
        exercise.echoLevel,
        exercise.progressionKg,
        exercise.restSeconds,
        exercise.notes,
        exercise.duration,
      ]);
    });
  });
};

/**
 * Update a routine exercise
 */
export const updateExercise = async (exercise: RoutineExerciseEntity): Promise<void> => {
  const sql = `
    UPDATE routine_exercises
    SET routineId = ?, exerciseName = ?, exerciseMuscleGroup = ?, exerciseEquipment = ?,
        exerciseDefaultCableConfig = ?, exerciseId = ?, cableConfig = ?, orderIndex = ?,
        setReps = ?, weightPerCableKg = ?, setWeights = ?, mode = ?, eccentricLoad = ?,
        echoLevel = ?, progressionKg = ?, restSeconds = ?, notes = ?, duration = ?
    WHERE id = ?
  `;

  await executeSql(sql, [
    exercise.routineId,
    exercise.exerciseName,
    exercise.exerciseMuscleGroup,
    exercise.exerciseEquipment,
    exercise.exerciseDefaultCableConfig,
    exercise.exerciseId,
    exercise.cableConfig,
    exercise.orderIndex,
    exercise.setReps,
    exercise.weightPerCableKg,
    exercise.setWeights,
    exercise.mode,
    exercise.eccentricLoad,
    exercise.echoLevel,
    exercise.progressionKg,
    exercise.restSeconds,
    exercise.notes,
    exercise.duration,
    exercise.id,
  ]);
};

/**
 * Delete a routine exercise by ID
 */
export const deleteExerciseById = async (exerciseId: string): Promise<void> => {
  await executeSql('DELETE FROM routine_exercises WHERE id = ?', [exerciseId]);
};

/**
 * Delete all exercises for a routine
 */
export const deleteExercisesForRoutine = async (routineId: string): Promise<void> => {
  await executeSql('DELETE FROM routine_exercises WHERE routineId = ?', [routineId]);
};

/**
 * Get exercises for a routine ordered by orderIndex
 */
export const getExercisesForRoutine = async (
  routineId: string
): Promise<RoutineExerciseEntity[]> => {
  const results = await executeSql(
    'SELECT * FROM routine_exercises WHERE routineId = ? ORDER BY orderIndex ASC',
    [routineId]
  );
  return mapRoutineExerciseResults(results);
};

/**
 * Get a routine exercise by ID
 */
export const getExerciseById = async (
  exerciseId: string
): Promise<RoutineExerciseEntity | null> => {
  const results = await executeSql('SELECT * FROM routine_exercises WHERE id = ?', [exerciseId]);
  const exercises = mapRoutineExerciseResults(results);
  return exercises.length > 0 ? exercises[0] : null;
};

// ========== Transaction Operations ==========

/**
 * Insert a routine with its exercises
 */
export const insertRoutineWithExercises = async (
  routine: RoutineEntity,
  exercises: RoutineExerciseEntity[]
): Promise<void> => {
  await executeTransaction(async (tx) => {
    // Insert routine
    const routineSql = `
      INSERT OR REPLACE INTO routines
      (id, name, description, createdAt, lastUsed, useCount)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    tx.executeSql(routineSql, [
      routine.id,
      routine.name,
      routine.description,
      routine.createdAt,
      routine.lastUsed,
      routine.useCount,
    ]);

    // Insert exercises
    const exerciseSql = `
      INSERT OR REPLACE INTO routine_exercises
      (id, routineId, exerciseName, exerciseMuscleGroup, exerciseEquipment,
       exerciseDefaultCableConfig, exerciseId, cableConfig, orderIndex, setReps,
       weightPerCableKg, setWeights, mode, eccentricLoad, echoLevel, progressionKg,
       restSeconds, notes, duration)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    exercises.forEach((exercise) => {
      tx.executeSql(exerciseSql, [
        exercise.id,
        exercise.routineId,
        exercise.exerciseName,
        exercise.exerciseMuscleGroup,
        exercise.exerciseEquipment,
        exercise.exerciseDefaultCableConfig,
        exercise.exerciseId,
        exercise.cableConfig,
        exercise.orderIndex,
        exercise.setReps,
        exercise.weightPerCableKg,
        exercise.setWeights,
        exercise.mode,
        exercise.eccentricLoad,
        exercise.echoLevel,
        exercise.progressionKg,
        exercise.restSeconds,
        exercise.notes,
        exercise.duration,
      ]);
    });
  });
};

/**
 * Update a routine with its exercises (replaces all exercises)
 */
export const updateRoutineWithExercises = async (
  routine: RoutineEntity,
  exercises: RoutineExerciseEntity[]
): Promise<void> => {
  await executeTransaction(async (tx) => {
    // Update routine
    const routineSql = `
      UPDATE routines
      SET name = ?, description = ?, createdAt = ?, lastUsed = ?, useCount = ?
      WHERE id = ?
    `;
    tx.executeSql(routineSql, [
      routine.name,
      routine.description,
      routine.createdAt,
      routine.lastUsed,
      routine.useCount,
      routine.id,
    ]);

    // Delete old exercises
    tx.executeSql('DELETE FROM routine_exercises WHERE routineId = ?', [routine.id]);

    // Insert new exercises
    const exerciseSql = `
      INSERT OR REPLACE INTO routine_exercises
      (id, routineId, exerciseName, exerciseMuscleGroup, exerciseEquipment,
       exerciseDefaultCableConfig, exerciseId, cableConfig, orderIndex, setReps,
       weightPerCableKg, setWeights, mode, eccentricLoad, echoLevel, progressionKg,
       restSeconds, notes, duration)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    exercises.forEach((exercise) => {
      tx.executeSql(exerciseSql, [
        exercise.id,
        exercise.routineId,
        exercise.exerciseName,
        exercise.exerciseMuscleGroup,
        exercise.exerciseEquipment,
        exercise.exerciseDefaultCableConfig,
        exercise.exerciseId,
        exercise.cableConfig,
        exercise.orderIndex,
        exercise.setReps,
        exercise.weightPerCableKg,
        exercise.setWeights,
        exercise.mode,
        exercise.eccentricLoad,
        exercise.echoLevel,
        exercise.progressionKg,
        exercise.restSeconds,
        exercise.notes,
        exercise.duration,
      ]);
    });
  });
};

/**
 * Delete a routine and all its exercises
 */
export const deleteRoutineComplete = async (routineId: string): Promise<void> => {
  await executeTransaction((tx) => {
    tx.executeSql('DELETE FROM routine_exercises WHERE routineId = ?', [routineId]);
    tx.executeSql('DELETE FROM routines WHERE id = ?', [routineId]);
  });
};

// ========== Weekly Program Operations ==========

/**
 * Get all weekly programs
 */
export const getAllPrograms = async (): Promise<WeeklyProgramEntity[]> => {
  const results = await executeSql('SELECT * FROM weekly_programs ORDER BY lastUsed DESC');
  return mapProgramResults(results);
};

/**
 * Get all programs with their days
 */
export const getAllProgramsWithDays = async (): Promise<WeeklyProgramWithDays[]> => {
  const programs = await getAllPrograms();
  const programsWithDays: WeeklyProgramWithDays[] = [];

  for (const program of programs) {
    const days = await getProgramDays(program.id);
    programsWithDays.push({ program, days });
  }

  return programsWithDays;
};

/**
 * Get the active program
 */
export const getActiveProgram = async (): Promise<WeeklyProgramEntity | null> => {
  const results = await executeSql(
    'SELECT * FROM weekly_programs WHERE isActive = 1 LIMIT 1'
  );
  const programs = mapProgramResults(results);
  return programs.length > 0 ? programs[0] : null;
};

/**
 * Get the active program with its days
 */
export const getActiveProgramWithDays = async (): Promise<WeeklyProgramWithDays | null> => {
  const program = await getActiveProgram();
  if (!program) return null;

  const days = await getProgramDays(program.id);
  return { program, days };
};

/**
 * Get a program by ID
 */
export const getProgramById = async (programId: string): Promise<WeeklyProgramEntity | null> => {
  const results = await executeSql('SELECT * FROM weekly_programs WHERE id = ?', [programId]);
  const programs = mapProgramResults(results);
  return programs.length > 0 ? programs[0] : null;
};

/**
 * Get a program with its days by ID
 */
export const getProgramWithDaysById = async (
  programId: string
): Promise<WeeklyProgramWithDays | null> => {
  const program = await getProgramById(programId);
  if (!program) return null;

  const days = await getProgramDays(programId);
  return { program, days };
};

/**
 * Get program days for a program
 */
const getProgramDays = async (programId: string): Promise<ProgramDayEntity[]> => {
  const results = await executeSql('SELECT * FROM program_days WHERE programId = ?', [programId]);
  return mapProgramDayResults(results);
};

/**
 * Insert a program
 */
export const insertProgram = async (program: WeeklyProgramEntity): Promise<void> => {
  const sql = `
    INSERT OR REPLACE INTO weekly_programs
    (id, title, notes, isActive, lastUsed, createdAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  await executeSql(sql, [
    program.id,
    program.title,
    program.notes,
    program.isActive ? 1 : 0,
    program.lastUsed,
    program.createdAt,
  ]);
};

/**
 * Insert program days
 */
export const insertProgramDays = async (days: ProgramDayEntity[]): Promise<void> => {
  await executeTransaction((tx) => {
    const sql = `
      INSERT OR REPLACE INTO program_days
      (programId, dayOfWeek, routineId)
      VALUES (?, ?, ?)
    `;

    days.forEach((day) => {
      tx.executeSql(sql, [day.programId, day.dayOfWeek, day.routineId]);
    });
  });
};

/**
 * Delete program days for a program
 */
export const deleteProgramDays = async (programId: string): Promise<void> => {
  await executeSql('DELETE FROM program_days WHERE programId = ?', [programId]);
};

/**
 * Insert a program with its days
 */
export const insertProgramWithDays = async (
  program: WeeklyProgramEntity,
  days: ProgramDayEntity[]
): Promise<void> => {
  await executeTransaction(async (tx) => {
    // Insert program
    const programSql = `
      INSERT OR REPLACE INTO weekly_programs
      (id, title, notes, isActive, lastUsed, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    tx.executeSql(programSql, [
      program.id,
      program.title,
      program.notes,
      program.isActive ? 1 : 0,
      program.lastUsed,
      program.createdAt,
    ]);

    // Delete old days
    tx.executeSql('DELETE FROM program_days WHERE programId = ?', [program.id]);

    // Insert new days
    const daySql = `
      INSERT OR REPLACE INTO program_days
      (programId, dayOfWeek, routineId)
      VALUES (?, ?, ?)
    `;

    days.forEach((day) => {
      tx.executeSql(daySql, [day.programId, day.dayOfWeek, day.routineId]);
    });
  });
};

/**
 * Delete a program
 */
export const deleteProgram = async (programId: string): Promise<void> => {
  await executeSql('DELETE FROM weekly_programs WHERE id = ?', [programId]);
};

/**
 * Set all programs inactive
 */
export const setAllProgramsInactive = async (): Promise<void> => {
  await executeSql('UPDATE weekly_programs SET isActive = 0');
};

/**
 * Set a program as active
 */
export const setProgramActive = async (
  programId: string,
  timestamp: number = Date.now()
): Promise<void> => {
  await executeSql(
    'UPDATE weekly_programs SET isActive = 1, lastUsed = ? WHERE id = ?',
    [timestamp, programId]
  );
};

/**
 * Activate a program (set all others inactive and set this one active)
 */
export const activateProgram = async (programId: string): Promise<void> => {
  await executeTransaction((tx) => {
    tx.executeSql('UPDATE weekly_programs SET isActive = 0');
    tx.executeSql('UPDATE weekly_programs SET isActive = 1, lastUsed = ? WHERE id = ?', [
      Date.now(),
      programId,
    ]);
  });
};

// ========== Helper Functions for Mapping Results ==========

/**
 * Map SQL results to WorkoutSessionEntity array
 */
const mapSessionResults = (results: any[]): WorkoutSessionEntity[] => {
  const sessions: WorkoutSessionEntity[] = [];

  if (results && results.length > 0) {
    const resultSet = results[0];
    for (let i = 0; i < resultSet.rows.length; i++) {
      const row = resultSet.rows.item(i);
      sessions.push({
        id: row.id,
        timestamp: row.timestamp,
        mode: row.mode,
        reps: row.reps,
        weightPerCableKg: row.weightPerCableKg,
        progressionKg: row.progressionKg,
        duration: row.duration,
        totalReps: row.totalReps,
        warmupReps: row.warmupReps,
        workingReps: row.workingReps,
        isJustLift: row.isJustLift === 1,
        stopAtTop: row.stopAtTop === 1,
        eccentricLoad: row.eccentricLoad,
        echoLevel: row.echoLevel,
        exerciseId: row.exerciseId,
      });
    }
  }

  return sessions;
};

/**
 * Map SQL results to WorkoutMetricEntity array
 */
const mapMetricResults = (results: any[]): WorkoutMetricEntity[] => {
  const metrics: WorkoutMetricEntity[] = [];

  if (results && results.length > 0) {
    const resultSet = results[0];
    for (let i = 0; i < resultSet.rows.length; i++) {
      const row = resultSet.rows.item(i);
      metrics.push({
        id: row.id,
        sessionId: row.sessionId,
        timestamp: row.timestamp,
        loadA: row.loadA,
        loadB: row.loadB,
        positionA: row.positionA,
        positionB: row.positionB,
        ticks: row.ticks,
      });
    }
  }

  return metrics;
};

/**
 * Map SQL results to RoutineEntity array
 */
const mapRoutineResults = (results: any[]): RoutineEntity[] => {
  const routines: RoutineEntity[] = [];

  if (results && results.length > 0) {
    const resultSet = results[0];
    for (let i = 0; i < resultSet.rows.length; i++) {
      const row = resultSet.rows.item(i);
      routines.push({
        id: row.id,
        name: row.name,
        description: row.description,
        createdAt: row.createdAt,
        lastUsed: row.lastUsed,
        useCount: row.useCount,
      });
    }
  }

  return routines;
};

/**
 * Map SQL results to RoutineExerciseEntity array
 */
const mapRoutineExerciseResults = (results: any[]): RoutineExerciseEntity[] => {
  const exercises: RoutineExerciseEntity[] = [];

  if (results && results.length > 0) {
    const resultSet = results[0];
    for (let i = 0; i < resultSet.rows.length; i++) {
      const row = resultSet.rows.item(i);
      exercises.push({
        id: row.id,
        routineId: row.routineId,
        exerciseName: row.exerciseName,
        exerciseMuscleGroup: row.exerciseMuscleGroup,
        exerciseEquipment: row.exerciseEquipment,
        exerciseDefaultCableConfig: row.exerciseDefaultCableConfig,
        exerciseId: row.exerciseId,
        cableConfig: row.cableConfig,
        orderIndex: row.orderIndex,
        setReps: row.setReps,
        weightPerCableKg: row.weightPerCableKg,
        setWeights: row.setWeights,
        mode: row.mode,
        eccentricLoad: row.eccentricLoad,
        echoLevel: row.echoLevel,
        progressionKg: row.progressionKg,
        restSeconds: row.restSeconds,
        notes: row.notes,
        duration: row.duration,
      });
    }
  }

  return exercises;
};

/**
 * Map SQL results to WeeklyProgramEntity array
 */
const mapProgramResults = (results: any[]): WeeklyProgramEntity[] => {
  const programs: WeeklyProgramEntity[] = [];

  if (results && results.length > 0) {
    const resultSet = results[0];
    for (let i = 0; i < resultSet.rows.length; i++) {
      const row = resultSet.rows.item(i);
      programs.push({
        id: row.id,
        title: row.title,
        notes: row.notes,
        isActive: row.isActive === 1,
        lastUsed: row.lastUsed,
        createdAt: row.createdAt,
      });
    }
  }

  return programs;
};

/**
 * Map SQL results to ProgramDayEntity array
 */
const mapProgramDayResults = (results: any[]): ProgramDayEntity[] => {
  const days: ProgramDayEntity[] = [];

  if (results && results.length > 0) {
    const resultSet = results[0];
    for (let i = 0; i < resultSet.rows.length; i++) {
      const row = resultSet.rows.item(i);
      days.push({
        id: row.id,
        programId: row.programId,
        dayOfWeek: row.dayOfWeek,
        routineId: row.routineId,
      });
    }
  }

  return days;
};
