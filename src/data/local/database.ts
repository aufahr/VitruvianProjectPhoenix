/**
 * SQLite Database initialization and setup for React Native
 * Migrated from Android Room WorkoutDatabase
 *
 * Version history:
 * - v15: Added exerciseId to workout_sessions for PR tracking
 * - v14: Added ConnectionLogEntity for Bluetooth connection debugging
 * - v13: Added eccentricLoad and echoLevel to workout_sessions for Echo mode persistence
 * - v12: Added setWeights, mode, eccentricLoad, echoLevel to routine_exercises
 * - v11: Added WeeklyProgramEntity and ProgramDayEntity for weekly program scheduling
 * - v10: Added exerciseId to routine_exercises for exercise library integration
 * - v9: Renamed progressionKg to progressionRegressionKg in workout_sessions, added personal_records
 * - v8: Schema cleanup for routine_exercises
 * - v7: Added exercise detail fields to RoutineExerciseEntity
 * - v6: Added ExerciseEntity and ExerciseVideoEntity for exercise library
 */

import SQLite from 'react-native-sqlite-storage';

// Enable promise-based API
SQLite.enablePromise(true);

const DATABASE_NAME = 'workout_database.db';
const DATABASE_VERSION = 15;

let databaseInstance: SQLite.SQLiteDatabase | null = null;

/**
 * Get or create database instance
 */
export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (databaseInstance) {
    return databaseInstance;
  }

  try {
    databaseInstance = await SQLite.openDatabase({
      name: DATABASE_NAME,
      location: 'default',
    });

    // Check database version and perform migrations if needed
    await initializeDatabase(databaseInstance);

    return databaseInstance;
  } catch (error) {
    console.error('Error opening database:', error);
    throw error;
  }
};

/**
 * Initialize database schema and handle migrations
 */
const initializeDatabase = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  try {
    // Get current database version
    const currentVersion = await getDatabaseVersion(db);

    if (currentVersion === 0) {
      // New database - create all tables
      await createTables(db);
      await setDatabaseVersion(db, DATABASE_VERSION);
    } else if (currentVersion < DATABASE_VERSION) {
      // Existing database - perform migrations
      await performMigrations(db, currentVersion, DATABASE_VERSION);
      await setDatabaseVersion(db, DATABASE_VERSION);
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

/**
 * Create all database tables
 */
const createTables = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  const tables = [
    // Workout sessions table
    `CREATE TABLE IF NOT EXISTS workout_sessions (
      id TEXT PRIMARY KEY,
      timestamp INTEGER NOT NULL,
      mode TEXT NOT NULL,
      reps INTEGER NOT NULL,
      weightPerCableKg REAL NOT NULL,
      progressionKg REAL NOT NULL,
      duration INTEGER NOT NULL,
      totalReps INTEGER NOT NULL,
      warmupReps INTEGER NOT NULL,
      workingReps INTEGER NOT NULL,
      isJustLift INTEGER NOT NULL,
      stopAtTop INTEGER NOT NULL,
      eccentricLoad INTEGER DEFAULT 100,
      echoLevel INTEGER DEFAULT 2,
      exerciseId TEXT
    )`,

    // Workout metrics table
    `CREATE TABLE IF NOT EXISTS workout_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sessionId TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      loadA REAL NOT NULL,
      loadB REAL NOT NULL,
      positionA INTEGER NOT NULL,
      positionB INTEGER NOT NULL,
      ticks INTEGER NOT NULL,
      FOREIGN KEY (sessionId) REFERENCES workout_sessions(id) ON DELETE CASCADE
    )`,

    // Routines table
    `CREATE TABLE IF NOT EXISTS routines (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      createdAt INTEGER NOT NULL,
      lastUsed INTEGER,
      useCount INTEGER DEFAULT 0
    )`,

    // Routine exercises table
    `CREATE TABLE IF NOT EXISTS routine_exercises (
      id TEXT PRIMARY KEY,
      routineId TEXT NOT NULL,
      exerciseName TEXT NOT NULL,
      exerciseMuscleGroup TEXT NOT NULL,
      exerciseEquipment TEXT DEFAULT '',
      exerciseDefaultCableConfig TEXT NOT NULL,
      exerciseId TEXT,
      cableConfig TEXT NOT NULL,
      orderIndex INTEGER NOT NULL,
      setReps TEXT NOT NULL,
      weightPerCableKg REAL NOT NULL,
      setWeights TEXT DEFAULT '',
      mode TEXT DEFAULT 'OldSchool',
      eccentricLoad INTEGER DEFAULT 100,
      echoLevel INTEGER DEFAULT 2,
      progressionKg REAL DEFAULT 0,
      restSeconds INTEGER DEFAULT 60,
      notes TEXT DEFAULT '',
      duration INTEGER,
      FOREIGN KEY (routineId) REFERENCES routines(id) ON DELETE CASCADE
    )`,

    // Exercises library table
    `CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      created TEXT NOT NULL,
      muscleGroups TEXT NOT NULL,
      muscles TEXT NOT NULL,
      equipment TEXT NOT NULL,
      movement TEXT,
      sidedness TEXT,
      grip TEXT,
      gripWidth TEXT,
      minRepRange REAL,
      popularity REAL NOT NULL,
      archived INTEGER NOT NULL,
      isFavorite INTEGER DEFAULT 0,
      timesPerformed INTEGER DEFAULT 0,
      lastPerformed INTEGER
    )`,

    // Exercise videos table
    `CREATE TABLE IF NOT EXISTS exercise_videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exerciseId TEXT NOT NULL,
      angle TEXT NOT NULL,
      videoUrl TEXT NOT NULL,
      thumbnailUrl TEXT NOT NULL,
      FOREIGN KEY (exerciseId) REFERENCES exercises(id) ON DELETE CASCADE
    )`,

    // Personal records table
    `CREATE TABLE IF NOT EXISTS personal_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exerciseId TEXT NOT NULL,
      weightPerCableKg REAL NOT NULL,
      reps INTEGER NOT NULL,
      timestamp INTEGER NOT NULL,
      workoutMode TEXT NOT NULL,
      UNIQUE(exerciseId, workoutMode)
    )`,

    // Weekly programs table
    `CREATE TABLE IF NOT EXISTS weekly_programs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      notes TEXT,
      isActive INTEGER DEFAULT 0,
      lastUsed INTEGER,
      createdAt INTEGER NOT NULL
    )`,

    // Program days table
    `CREATE TABLE IF NOT EXISTS program_days (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      programId TEXT NOT NULL,
      dayOfWeek INTEGER NOT NULL,
      routineId TEXT NOT NULL,
      FOREIGN KEY (programId) REFERENCES weekly_programs(id) ON DELETE CASCADE,
      FOREIGN KEY (routineId) REFERENCES routines(id) ON DELETE CASCADE
    )`,

    // Connection logs table
    `CREATE TABLE IF NOT EXISTS connection_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER NOT NULL,
      eventType TEXT NOT NULL,
      level TEXT NOT NULL,
      deviceAddress TEXT,
      deviceName TEXT,
      message TEXT NOT NULL,
      details TEXT,
      metadata TEXT
    )`,
  ];

  // Create all tables
  for (const tableSQL of tables) {
    await db.executeSql(tableSQL);
  }

  // Create indexes
  await createIndexes(db);
};

/**
 * Create database indexes for better query performance
 */
const createIndexes = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_workout_metrics_sessionId ON workout_metrics(sessionId)',
    'CREATE INDEX IF NOT EXISTS idx_routine_exercises_routineId ON routine_exercises(routineId)',
    'CREATE INDEX IF NOT EXISTS idx_exercise_videos_exerciseId ON exercise_videos(exerciseId)',
    'CREATE INDEX IF NOT EXISTS idx_program_days_programId ON program_days(programId)',
    'CREATE INDEX IF NOT EXISTS idx_program_days_routineId ON program_days(routineId)',
    'CREATE INDEX IF NOT EXISTS idx_connection_logs_timestamp ON connection_logs(timestamp)',
  ];

  for (const indexSQL of indexes) {
    await db.executeSql(indexSQL);
  }
};

/**
 * Get current database version
 */
const getDatabaseVersion = async (db: SQLite.SQLiteDatabase): Promise<number> => {
  try {
    const result = await db.executeSql('PRAGMA user_version');
    return result[0].rows.item(0).user_version;
  } catch (error) {
    console.error('Error getting database version:', error);
    return 0;
  }
};

/**
 * Set database version
 */
const setDatabaseVersion = async (
  db: SQLite.SQLiteDatabase,
  version: number
): Promise<void> => {
  await db.executeSql(`PRAGMA user_version = ${version}`);
};

/**
 * Perform database migrations from old version to new version
 */
const performMigrations = async (
  db: SQLite.SQLiteDatabase,
  fromVersion: number,
  toVersion: number
): Promise<void> => {
  console.log(`Migrating database from version ${fromVersion} to ${toVersion}`);

  // Migration from v14 to v15: Add exerciseId to workout_sessions
  if (fromVersion < 15) {
    try {
      await db.executeSql(`
        ALTER TABLE workout_sessions ADD COLUMN exerciseId TEXT
      `);
      console.log('Migration v14 -> v15: Added exerciseId to workout_sessions');
    } catch (error) {
      console.log('Column exerciseId might already exist, skipping...');
    }
  }

  // Migration from v13 to v14: Add connection_logs table
  if (fromVersion < 14) {
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS connection_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        eventType TEXT NOT NULL,
        level TEXT NOT NULL,
        deviceAddress TEXT,
        deviceName TEXT,
        message TEXT NOT NULL,
        details TEXT,
        metadata TEXT
      )
    `);
    await db.executeSql(
      'CREATE INDEX IF NOT EXISTS idx_connection_logs_timestamp ON connection_logs(timestamp)'
    );
    console.log('Migration v13 -> v14: Created connection_logs table');
  }

  // Migration from v12 to v13: Add eccentricLoad and echoLevel to workout_sessions
  if (fromVersion < 13) {
    try {
      await db.executeSql(`
        ALTER TABLE workout_sessions ADD COLUMN eccentricLoad INTEGER DEFAULT 100
      `);
      await db.executeSql(`
        ALTER TABLE workout_sessions ADD COLUMN echoLevel INTEGER DEFAULT 2
      `);
      console.log('Migration v12 -> v13: Added Echo mode fields to workout_sessions');
    } catch (error) {
      console.log('Echo mode columns might already exist, skipping...');
    }
  }

  // Add more migrations as needed for earlier versions
  // For now, if migrating from much older versions, recommend fresh install
  if (fromVersion < 12) {
    console.warn(
      'Migrating from version < 12 may require additional migration steps. ' +
        'Consider exporting data and performing a fresh install if issues occur.'
    );
  }
};

/**
 * Close database connection
 */
export const closeDatabase = async (): Promise<void> => {
  if (databaseInstance) {
    await databaseInstance.close();
    databaseInstance = null;
  }
};

/**
 * Delete database (for testing or reset purposes)
 */
export const deleteDatabase = async (): Promise<void> => {
  await closeDatabase();
  await SQLite.deleteDatabase({
    name: DATABASE_NAME,
    location: 'default',
  });
};

/**
 * Execute SQL query with parameters
 */
export const executeSql = async (
  sql: string,
  params: any[] = []
): Promise<SQLite.ResultSet[]> => {
  const db = await getDatabase();
  return db.executeSql(sql, params);
};

/**
 * Execute multiple SQL statements in a transaction
 */
export const executeTransaction = async (
  callback: (tx: SQLite.Transaction) => void
): Promise<void> => {
  const db = await getDatabase();
  return new Promise((resolve, reject) => {
    db.transaction(
      callback,
      (error) => reject(error),
      () => resolve()
    );
  });
};
