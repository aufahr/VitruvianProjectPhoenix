# React Native SQLite Database Layer

This directory contains the SQLite database layer for the React Native application, migrated from Android Room.

## Overview

The database layer has been migrated from Android's Room persistence library to React Native's `react-native-sqlite-storage`. All functionality has been preserved, including:

- Entity definitions (TypeScript interfaces)
- Database schema creation and migrations
- Data Access Objects (DAOs) with full CRUD operations
- Transaction support
- Proper indexing for performance

## Installation

Make sure you have `react-native-sqlite-storage` installed:

```bash
npm install react-native-sqlite-storage
# or
yarn add react-native-sqlite-storage
```

For iOS, run:
```bash
cd ios && pod install
```

## Directory Structure

```
src/data/local/
├── database.ts              # Database initialization and schema
├── entities.ts              # TypeScript entity interfaces
├── daos/
│   ├── workoutDao.ts        # Workout, routine, and program operations
│   ├── exerciseDao.ts       # Exercise library operations
│   ├── personalRecordDao.ts # Personal record operations
│   ├── connectionLogDao.ts  # Connection log operations
│   └── index.ts             # DAO exports
├── index.ts                 # Main exports
└── README.md                # This file
```

## Database Schema

### Tables

1. **workout_sessions** - Workout session data
2. **workout_metrics** - Time-series data for workouts
3. **routines** - Workout routines
4. **routine_exercises** - Exercises within routines
5. **exercises** - Exercise library
6. **exercise_videos** - Video demonstrations for exercises
7. **personal_records** - Personal record tracking
8. **weekly_programs** - Weekly workout programs
9. **program_days** - Program day assignments
10. **connection_logs** - Bluetooth connection debug logs

### Current Version: 15

Version history:
- v15: Added exerciseId to workout_sessions for PR tracking
- v14: Added ConnectionLogEntity for Bluetooth connection debugging
- v13: Added eccentricLoad and echoLevel to workout_sessions
- v12: Added setWeights, mode, eccentricLoad, echoLevel to routine_exercises
- v11: Added WeeklyProgramEntity and ProgramDayEntity
- v10: Added exerciseId to routine_exercises
- v9: Added personal_records table
- Earlier versions: Various schema improvements

## Usage Examples

### Initialize Database

```typescript
import { getDatabase } from './data/local';

// Get database instance (auto-initializes on first call)
const db = await getDatabase();
```

### Working with Workouts

```typescript
import { WorkoutDao } from './data/local';

// Insert a workout session
await WorkoutDao.insertSession({
  id: 'session-123',
  timestamp: Date.now(),
  mode: 'OldSchool',
  reps: 10,
  weightPerCableKg: 50,
  progressionKg: 0,
  duration: 300000,
  totalReps: 100,
  warmupReps: 10,
  workingReps: 90,
  isJustLift: false,
  stopAtTop: false,
  eccentricLoad: 100,
  echoLevel: 2,
  exerciseId: 'exercise-456',
});

// Get all sessions
const sessions = await WorkoutDao.getAllSessions();

// Get metrics for a session
const metrics = await WorkoutDao.getMetricsForSession('session-123');

// Delete a complete workout (session + metrics)
await WorkoutDao.deleteWorkout('session-123');
```

### Working with Routines

```typescript
import { WorkoutDao } from './data/local';

// Create a routine with exercises
const routine = {
  id: 'routine-123',
  name: 'Push Day',
  description: 'Chest, shoulders, and triceps',
  createdAt: Date.now(),
  lastUsed: null,
  useCount: 0,
};

const exercises = [
  {
    id: 'exercise-1',
    routineId: 'routine-123',
    exerciseName: 'Bench Press',
    exerciseMuscleGroup: 'Chest',
    exerciseEquipment: 'Barbell',
    exerciseDefaultCableConfig: 'DOUBLE',
    exerciseId: null,
    cableConfig: 'DOUBLE',
    orderIndex: 0,
    setReps: '10,10,10',
    weightPerCableKg: 40,
    setWeights: '',
    mode: 'OldSchool',
    eccentricLoad: 100,
    echoLevel: 2,
    progressionKg: 0,
    restSeconds: 90,
    notes: '',
    duration: null,
  },
  // ... more exercises
];

// Insert routine with exercises in a transaction
await WorkoutDao.insertRoutineWithExercises(routine, exercises);

// Get all routines
const routines = await WorkoutDao.getAllRoutines();

// Get exercises for a routine
const routineExercises = await WorkoutDao.getExercisesForRoutine('routine-123');

// Mark routine as used
await WorkoutDao.markRoutineUsed('routine-123');
```

### Working with Exercise Library

```typescript
import { ExerciseDao } from './data/local';

// Search exercises
const results = await ExerciseDao.searchExercises('bench press');

// Get exercises by muscle group
const chestExercises = await ExerciseDao.getExercisesByMuscleGroup('Chest');

// Toggle favorite
await ExerciseDao.updateFavorite('exercise-123', true);

// Get favorites
const favorites = await ExerciseDao.getFavorites();

// Increment performance count
await ExerciseDao.incrementPerformed('exercise-123');

// Get videos for an exercise
const videos = await ExerciseDao.getVideos('exercise-123');
```

### Working with Personal Records

```typescript
import { PersonalRecordDao } from './data/local';

// Update PR if better
const isNewPR = await PersonalRecordDao.updatePRIfBetter(
  'exercise-123',
  50.0, // weight per cable (kg)
  10,   // reps
  'OldSchool', // workout mode
  Date.now()
);

if (isNewPR) {
  console.log('New personal record!');
}

// Get all PRs for an exercise
const prs = await PersonalRecordDao.getPRsForExercise('exercise-123');

// Get best PR across all modes
const bestPR = await PersonalRecordDao.getBestPR('exercise-123');
```

### Working with Connection Logs

```typescript
import { ConnectionLogDao } from './data/local';

// Insert a log entry
await ConnectionLogDao.insert({
  timestamp: Date.now(),
  eventType: 'CONNECTION_STARTED',
  level: 'INFO',
  deviceAddress: '00:11:22:33:44:55',
  deviceName: 'Vitruvian Trainer',
  message: 'Connecting to device',
  details: 'Attempting Bluetooth connection',
  metadata: JSON.stringify({ attempt: 1 }),
});

// Get recent logs
const recentLogs = await ConnectionLogDao.getRecentLogs(50);

// Get logs by level
const errors = await ConnectionLogDao.getLogsByLevel('ERROR');

// Clean old logs (older than 7 days)
const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
await ConnectionLogDao.deleteOlderThan(sevenDaysAgo);
```

### Working with Weekly Programs

```typescript
import { WorkoutDao } from './data/local';

// Create a weekly program
const program = {
  id: 'program-123',
  title: 'My Training Program',
  notes: '4-day split',
  isActive: false,
  lastUsed: null,
  createdAt: Date.now(),
};

const days = [
  { programId: 'program-123', dayOfWeek: 1, routineId: 'routine-push' },  // Monday
  { programId: 'program-123', dayOfWeek: 3, routineId: 'routine-pull' },  // Wednesday
  { programId: 'program-123', dayOfWeek: 5, routineId: 'routine-legs' },  // Friday
];

await WorkoutDao.insertProgramWithDays(program, days);

// Activate a program
await WorkoutDao.activateProgram('program-123');

// Get active program with days
const activeProgram = await WorkoutDao.getActiveProgramWithDays();
```

## Transactions

Use transactions for operations that must succeed or fail together:

```typescript
import { executeTransaction } from './data/local';

await executeTransaction((tx) => {
  // All operations in this block are part of the same transaction
  tx.executeSql('UPDATE routines SET useCount = useCount + 1 WHERE id = ?', ['routine-123']);
  tx.executeSql('UPDATE routines SET lastUsed = ? WHERE id = ?', [Date.now(), 'routine-123']);
  // If any operation fails, all changes are rolled back
});
```

## Migration Notes

### Key Differences from Android Room

1. **No Flow/LiveData**: Room's Flow-based reactive queries are not available. Use state management (Redux/MobX) or polling for reactive behavior.

2. **Boolean Storage**: SQLite stores booleans as integers (0/1). Conversion is handled in the DAO mappers.

3. **Null Handling**: TypeScript's `null` maps to SQL's `NULL`. Use `| null` in entity definitions.

4. **Auto-increment IDs**: Auto-increment is available but requires `AUTOINCREMENT` in CREATE TABLE.

5. **Transactions**: Use `executeTransaction()` instead of Room's `@Transaction` annotation.

### Performance Considerations

1. **Indexing**: Indexes are created for foreign keys and frequently queried columns.

2. **Batch Operations**: Use `executeTransaction()` for bulk inserts/updates.

3. **Query Optimization**: Use appropriate WHERE clauses and LIMIT for large result sets.

## Testing

For testing, you can use an in-memory database or delete/recreate the database:

```typescript
import { deleteDatabase, getDatabase } from './data/local';

// Delete database for fresh start
await deleteDatabase();

// Reinitialize
const db = await getDatabase();
```

## Error Handling

All DAO functions are async and can throw errors. Always wrap database calls in try-catch:

```typescript
try {
  await WorkoutDao.insertSession(session);
} catch (error) {
  console.error('Failed to insert session:', error);
  // Handle error appropriately
}
```

## Future Enhancements

Potential improvements for the database layer:

1. Add reactive query support using event emitters
2. Implement connection pooling if needed
3. Add query result caching for frequently accessed data
4. Create migration utilities for easier version upgrades
5. Add database backup/restore functionality
6. Implement soft deletes for important entities

## Support

For issues or questions about the database layer, refer to:
- [react-native-sqlite-storage documentation](https://github.com/andpor/react-native-sqlite-storage)
- Original Android Room implementation in `/app/src/main/java/com/example/vitruvianredux/data/local/`
