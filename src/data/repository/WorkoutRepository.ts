/**
 * Workout Repository - Manages workout history, routines, and programs
 * Migrated from Android Kotlin WorkoutRepository to React Native TypeScript
 */

import { EventEmitter } from 'events';
import * as WorkoutDao from '../local/daos/workoutDao';
import * as PersonalRecordDao from '../local/daos/personalRecordDao';
import {
  WorkoutSessionEntity,
  WorkoutMetricEntity,
  RoutineEntity,
  RoutineExerciseEntity,
  WeeklyProgramWithDays,
  WeeklyProgramEntity,
  ProgramDayEntity,
} from '../local/entities';
import {
  WorkoutSession,
  WorkoutMetric,
  ProgramMode,
  EchoLevel,
  EccentricLoad,
  WorkoutType,
  WorkoutMode,
  WorkoutModeConstants,
} from '../../domain/models/Models';
import { Routine, RoutineExercise } from '../../domain/models/Routine';
import { Exercise, CableConfiguration } from '../../domain/models/Exercise';

/**
 * Workout Repository interface
 */
export interface IWorkoutRepository {
  // Session operations
  saveSession(session: WorkoutSession): Promise<void>;
  saveMetrics(sessionId: string, metrics: WorkoutMetric[]): Promise<void>;
  getAllSessions(): Promise<WorkoutSession[]>;
  getRecentSessions(limit?: number): Promise<WorkoutSession[]>;
  getSession(sessionId: string): Promise<WorkoutSession | null>;
  getMetricsForSession(sessionId: string): Promise<WorkoutMetric[]>;
  deleteWorkout(sessionId: string): Promise<void>;
  deleteAllWorkouts(): Promise<void>;

  // Routine operations
  saveRoutine(routine: Routine): Promise<void>;
  updateRoutine(routine: Routine): Promise<void>;
  getAllRoutines(): Promise<Routine[]>;
  getRoutine(routineId: string): Promise<Routine | null>;
  deleteRoutine(routineId: string): Promise<void>;
  markRoutineUsed(routineId: string): Promise<void>;

  // Weekly program operations
  getAllPrograms(): Promise<WeeklyProgramWithDays[]>;
  getActiveProgram(): Promise<WeeklyProgramWithDays | null>;
  getProgramById(programId: string): Promise<WeeklyProgramWithDays | null>;
  saveProgram(programWithDays: WeeklyProgramWithDays): Promise<void>;
  deleteProgram(programId: string): Promise<void>;
  activateProgram(programId: string): Promise<void>;

  // Personal record operations
  updatePersonalRecordIfNeeded(
    exerciseId: string,
    weightPerCableKg: number,
    reps: number,
    workoutMode: string
  ): Promise<boolean>;
}

/**
 * Workout Repository implementation
 */
class WorkoutRepositoryImpl extends EventEmitter implements IWorkoutRepository {
  constructor() {
    super();
  }

  // ========== Session Operations ==========

  /**
   * Save a workout session
   */
  async saveSession(session: WorkoutSession): Promise<void> {
    try {
      const entity: WorkoutSessionEntity = {
        id: session.id || this.generateUUID(),
        timestamp: session.timestamp || Date.now(),
        mode: session.mode || 'OldSchool',
        reps: session.reps || 10,
        weightPerCableKg: session.weightPerCableKg || 0,
        progressionKg: session.progressionKg || 0,
        duration: session.duration || 0,
        totalReps: session.totalReps || 0,
        warmupReps: session.warmupReps || 0,
        workingReps: session.workingReps || 0,
        isJustLift: session.isJustLift || false,
        stopAtTop: session.stopAtTop || false,
        eccentricLoad: session.eccentricLoad || 100,
        echoLevel: session.echoLevel || 1,
        exerciseId: session.exerciseId || null,
      };

      await WorkoutDao.insertSession(entity);
      console.log(`[WorkoutRepository] Saved workout session: ${entity.id}`);
    } catch (error) {
      console.error('[WorkoutRepository] Failed to save workout session:', error);
      throw error;
    }
  }

  /**
   * Save workout metrics (batch insert for performance)
   */
  async saveMetrics(sessionId: string, metrics: WorkoutMetric[]): Promise<void> {
    try {
      const entities: WorkoutMetricEntity[] = metrics.map((metric) => ({
        sessionId,
        timestamp: metric.timestamp || Date.now(),
        loadA: metric.loadA,
        loadB: metric.loadB,
        positionA: metric.positionA,
        positionB: metric.positionB,
        ticks: metric.ticks || 0,
      }));

      await WorkoutDao.insertMetrics(entities);
      console.log(`[WorkoutRepository] Saved ${entities.length} metrics for session ${sessionId}`);
    } catch (error) {
      console.error('[WorkoutRepository] Failed to save workout metrics:', error);
      throw error;
    }
  }

  /**
   * Get all workout sessions
   */
  async getAllSessions(): Promise<WorkoutSession[]> {
    try {
      const entities = await WorkoutDao.getAllSessions();
      return entities.map(this.entityToWorkoutSession);
    } catch (error) {
      console.error('[WorkoutRepository] Failed to get all sessions:', error);
      throw error;
    }
  }

  /**
   * Get recent workout sessions
   */
  async getRecentSessions(limit: number = 10): Promise<WorkoutSession[]> {
    try {
      const entities = await WorkoutDao.getRecentSessions(limit);
      return entities.map(this.entityToWorkoutSession);
    } catch (error) {
      console.error('[WorkoutRepository] Failed to get recent sessions:', error);
      throw error;
    }
  }

  /**
   * Get a specific workout session
   */
  async getSession(sessionId: string): Promise<WorkoutSession | null> {
    try {
      const entity = await WorkoutDao.getSession(sessionId);
      return entity ? this.entityToWorkoutSession(entity) : null;
    } catch (error) {
      console.error('[WorkoutRepository] Failed to get session:', error);
      throw error;
    }
  }

  /**
   * Get metrics for a workout session
   */
  async getMetricsForSession(sessionId: string): Promise<WorkoutMetric[]> {
    try {
      const entities = await WorkoutDao.getMetricsForSession(sessionId);
      return entities.map(this.entityToWorkoutMetric);
    } catch (error) {
      console.error('[WorkoutRepository] Failed to get metrics:', error);
      throw error;
    }
  }

  /**
   * Delete a workout
   */
  async deleteWorkout(sessionId: string): Promise<void> {
    try {
      await WorkoutDao.deleteWorkout(sessionId);
      console.log(`[WorkoutRepository] Deleted workout: ${sessionId}`);
    } catch (error) {
      console.error('[WorkoutRepository] Failed to delete workout:', error);
      throw error;
    }
  }

  /**
   * Delete all workouts
   */
  async deleteAllWorkouts(): Promise<void> {
    try {
      await WorkoutDao.deleteAllWorkouts();
      console.log('[WorkoutRepository] Deleted all workouts');
    } catch (error) {
      console.error('[WorkoutRepository] Failed to delete all workouts:', error);
      throw error;
    }
  }

  // ========== Routine Operations ==========

  /**
   * Save a routine with exercises
   */
  async saveRoutine(routine: Routine): Promise<void> {
    try {
      const entity = this.routineToEntity(routine);
      const exerciseEntities = routine.exercises.map((ex) => this.routineExerciseToEntity(ex, routine.id));

      await WorkoutDao.insertRoutineWithExercises(entity, exerciseEntities);
      console.log(`[WorkoutRepository] Saved routine: ${routine.name}`);
    } catch (error) {
      console.error('[WorkoutRepository] Failed to save routine:', error);
      throw error;
    }
  }

  /**
   * Update a routine
   */
  async updateRoutine(routine: Routine): Promise<void> {
    try {
      const entity = this.routineToEntity(routine);
      const exerciseEntities = routine.exercises.map((ex) => this.routineExerciseToEntity(ex, routine.id));

      await WorkoutDao.updateRoutineWithExercises(entity, exerciseEntities);
      console.log(`[WorkoutRepository] Updated routine: ${routine.name}`);
    } catch (error) {
      console.error('[WorkoutRepository] Failed to update routine:', error);
      throw error;
    }
  }

  /**
   * Get all routines
   */
  async getAllRoutines(): Promise<Routine[]> {
    try {
      const entities = await WorkoutDao.getAllRoutines();
      const routines: Routine[] = [];

      for (const entity of entities) {
        const exercises = await WorkoutDao.getExercisesForRoutine(entity.id);
        routines.push(this.entityToRoutine(entity, exercises));
      }

      return routines;
    } catch (error) {
      console.error('[WorkoutRepository] Failed to get all routines:', error);
      throw error;
    }
  }

  /**
   * Get a specific routine
   */
  async getRoutine(routineId: string): Promise<Routine | null> {
    try {
      const entity = await WorkoutDao.getRoutineById(routineId);
      if (!entity) {
        return null;
      }

      const exercises = await WorkoutDao.getExercisesForRoutine(routineId);
      return this.entityToRoutine(entity, exercises);
    } catch (error) {
      console.error('[WorkoutRepository] Failed to get routine:', error);
      return null;
    }
  }

  /**
   * Delete a routine
   */
  async deleteRoutine(routineId: string): Promise<void> {
    try {
      await WorkoutDao.deleteRoutineComplete(routineId);
      console.log(`[WorkoutRepository] Deleted routine: ${routineId}`);
    } catch (error) {
      console.error('[WorkoutRepository] Failed to delete routine:', error);
      throw error;
    }
  }

  /**
   * Mark routine as used (updates lastUsed and increments useCount)
   */
  async markRoutineUsed(routineId: string): Promise<void> {
    try {
      await WorkoutDao.markRoutineUsed(routineId);
      console.log(`[WorkoutRepository] Marked routine used: ${routineId}`);
    } catch (error) {
      console.error('[WorkoutRepository] Failed to mark routine used:', error);
      throw error;
    }
  }

  // ========== Weekly Program Operations ==========

  /**
   * Get all weekly programs with their assigned days
   */
  async getAllPrograms(): Promise<WeeklyProgramWithDays[]> {
    try {
      return await WorkoutDao.getAllProgramsWithDays();
    } catch (error) {
      console.error('[WorkoutRepository] Failed to get all programs:', error);
      throw error;
    }
  }

  /**
   * Get the currently active program with its days
   */
  async getActiveProgram(): Promise<WeeklyProgramWithDays | null> {
    try {
      return await WorkoutDao.getActiveProgramWithDays();
    } catch (error) {
      console.error('[WorkoutRepository] Failed to get active program:', error);
      throw error;
    }
  }

  /**
   * Get a specific program by ID with its days
   */
  async getProgramById(programId: string): Promise<WeeklyProgramWithDays | null> {
    try {
      return await WorkoutDao.getProgramWithDaysById(programId);
    } catch (error) {
      console.error('[WorkoutRepository] Failed to get program by ID:', error);
      throw error;
    }
  }

  /**
   * Save a new weekly program or update existing one
   */
  async saveProgram(programWithDays: WeeklyProgramWithDays): Promise<void> {
    try {
      await WorkoutDao.insertProgramWithDays(programWithDays.program, programWithDays.days);
      console.log(`[WorkoutRepository] Saved weekly program: ${programWithDays.program.title}`);
    } catch (error) {
      console.error('[WorkoutRepository] Failed to save weekly program:', error);
      throw error;
    }
  }

  /**
   * Delete a weekly program
   */
  async deleteProgram(programId: string): Promise<void> {
    try {
      await WorkoutDao.deleteProgram(programId);
      console.log(`[WorkoutRepository] Deleted weekly program: ${programId}`);
    } catch (error) {
      console.error('[WorkoutRepository] Failed to delete weekly program:', error);
      throw error;
    }
  }

  /**
   * Activate a weekly program (deactivates all others)
   */
  async activateProgram(programId: string): Promise<void> {
    try {
      await WorkoutDao.activateProgram(programId);
      console.log(`[WorkoutRepository] Activated weekly program: ${programId}`);
    } catch (error) {
      console.error('[WorkoutRepository] Failed to activate weekly program:', error);
      throw error;
    }
  }

  // ========== Personal Record Operations ==========

  /**
   * Update personal record if the new performance is better
   */
  async updatePersonalRecordIfNeeded(
    exerciseId: string,
    weightPerCableKg: number,
    reps: number,
    workoutMode: string
  ): Promise<boolean> {
    try {
      const isNewPR = await PersonalRecordDao.updatePRIfBetter(
        exerciseId,
        weightPerCableKg,
        reps,
        workoutMode,
        Date.now()
      );

      if (isNewPR) {
        console.log(
          `[WorkoutRepository] New PR set for exercise ${exerciseId}: ${weightPerCableKg}kg x ${reps} reps (${workoutMode})`
        );
      }

      return isNewPR;
    } catch (error) {
      console.error('[WorkoutRepository] Failed to update personal record:', error);
      return false;
    }
  }

  // ========== Helper Methods ==========

  /**
   * Convert entity to WorkoutSession
   */
  private entityToWorkoutSession(entity: WorkoutSessionEntity): WorkoutSession {
    return {
      id: entity.id,
      timestamp: entity.timestamp,
      mode: entity.mode,
      reps: entity.reps,
      weightPerCableKg: entity.weightPerCableKg,
      progressionKg: entity.progressionKg,
      duration: entity.duration,
      totalReps: entity.totalReps,
      warmupReps: entity.warmupReps,
      workingReps: entity.workingReps,
      isJustLift: entity.isJustLift,
      stopAtTop: entity.stopAtTop,
      eccentricLoad: entity.eccentricLoad,
      echoLevel: entity.echoLevel,
      exerciseId: entity.exerciseId,
    };
  }

  /**
   * Convert entity to WorkoutMetric
   */
  private entityToWorkoutMetric(entity: WorkoutMetricEntity): WorkoutMetric {
    return {
      timestamp: entity.timestamp,
      loadA: entity.loadA,
      loadB: entity.loadB,
      positionA: entity.positionA,
      positionB: entity.positionB,
      ticks: entity.ticks,
    };
  }

  /**
   * Convert Routine to RoutineEntity
   */
  private routineToEntity(routine: Routine): RoutineEntity {
    return {
      id: routine.id,
      name: routine.name,
      description: routine.description,
      createdAt: routine.createdAt,
      lastUsed: routine.lastUsed,
      useCount: routine.useCount,
    };
  }

  /**
   * Convert RoutineExercise to RoutineExerciseEntity
   */
  private routineExerciseToEntity(exercise: RoutineExercise, routineId: string): RoutineExerciseEntity {
    // Determine mode string from workoutType
    let mode = 'OldSchool';
    let eccentricLoad = 100;
    let echoLevel = 1;

    if (exercise.workoutType.type === 'echo') {
      mode = 'Echo';
      eccentricLoad = exercise.workoutType.eccentricLoad;
      echoLevel = exercise.workoutType.level;
    } else if (exercise.workoutType.type === 'program') {
      mode = exercise.workoutType.mode.displayName.replace(/\s+/g, '');
    }

    return {
      id: exercise.id,
      routineId,
      exerciseName: exercise.exercise.name,
      exerciseMuscleGroup: exercise.exercise.muscleGroup,
      exerciseEquipment: exercise.exercise.equipment,
      exerciseDefaultCableConfig: exercise.exercise.defaultCableConfig,
      exerciseId: exercise.exercise.id,
      cableConfig: exercise.cableConfig,
      orderIndex: exercise.orderIndex,
      setReps: exercise.setReps.join(','),
      weightPerCableKg: exercise.weightPerCableKg,
      setWeights: exercise.setWeightsPerCableKg.join(','),
      mode,
      eccentricLoad,
      echoLevel,
      progressionKg: exercise.progressionKg,
      restSeconds: exercise.restSeconds,
      notes: exercise.notes,
      duration: exercise.duration,
    };
  }

  /**
   * Convert RoutineEntity to Routine
   */
  private entityToRoutine(entity: RoutineEntity, exerciseEntities: RoutineExerciseEntity[]): Routine {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      exercises: exerciseEntities.map(this.entityToRoutineExercise),
      createdAt: entity.createdAt,
      lastUsed: entity.lastUsed,
      useCount: entity.useCount,
    };
  }

  /**
   * Convert RoutineExerciseEntity to RoutineExercise
   */
  private entityToRoutineExercise(entity: RoutineExerciseEntity): RoutineExercise {
    // Reconstruct Exercise
    const exercise: Exercise = {
      name: entity.exerciseName,
      muscleGroup: entity.exerciseMuscleGroup,
      equipment: entity.exerciseEquipment,
      defaultCableConfig: entity.exerciseDefaultCableConfig as CableConfiguration,
      id: entity.exerciseId,
    };

    // Parse setReps and setWeights
    const setReps = entity.setReps ? entity.setReps.split(',').map(Number) : [];
    const setWeights = entity.setWeights ? entity.setWeights.split(',').map(Number) : [];

    // Reconstruct WorkoutType
    let workoutType: WorkoutType;
    if (entity.mode === 'Echo') {
      workoutType = {
        type: 'echo',
        level: entity.echoLevel as EchoLevel,
        eccentricLoad: entity.eccentricLoad as EccentricLoad,
      };
    } else {
      // Map mode string to ProgramMode
      let programMode = ProgramMode.OldSchool;
      switch (entity.mode) {
        case 'Pump':
          programMode = ProgramMode.Pump;
          break;
        case 'TUT':
          programMode = ProgramMode.TUT;
          break;
        case 'TUTBeast':
          programMode = ProgramMode.TUTBeast;
          break;
        case 'EccentricOnly':
          programMode = ProgramMode.EccentricOnly;
          break;
        default:
          programMode = ProgramMode.OldSchool;
      }
      workoutType = { type: 'program', mode: programMode };
    }

    return {
      id: entity.id,
      exercise,
      cableConfig: entity.cableConfig as CableConfiguration,
      orderIndex: entity.orderIndex,
      setReps,
      weightPerCableKg: entity.weightPerCableKg,
      setWeightsPerCableKg: setWeights,
      workoutType,
      eccentricLoad: entity.eccentricLoad as EccentricLoad,
      echoLevel: entity.echoLevel as EchoLevel,
      progressionKg: entity.progressionKg,
      restSeconds: entity.restSeconds,
      notes: entity.notes,
      duration: entity.duration,
    };
  }

  /**
   * Generate UUID
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

// Export singleton instance
let workoutRepositoryInstance: WorkoutRepositoryImpl | null = null;

export const getWorkoutRepository = (): IWorkoutRepository => {
  if (!workoutRepositoryInstance) {
    workoutRepositoryInstance = new WorkoutRepositoryImpl();
  }
  return workoutRepositoryInstance;
};

export const resetWorkoutRepository = (): void => {
  workoutRepositoryInstance = null;
};

// Export types
export type { IWorkoutRepository };
export { WorkoutRepositoryImpl };
