/**
 * DailyRoutinesScreen Component
 * View and manage pre-built workout routines
 * Migrated from Android Compose DailyRoutinesScreen.kt
 *
 * Features:
 * - Display list of saved routines
 * - Show routine cards with exercise preview
 * - Start workout from routine
 * - Edit/delete/duplicate routines with overflow menu
 * - Create new routine button
 * - Auto-connect to device before starting workout
 * - Navigate to ActiveWorkout when starting routine
 */

import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

import {RootStackParamList, SCREEN_NAMES} from '../navigation/types';
import {useColors, useTypography, useSpacing, useIsDark} from '../theme';
import {useRoutines} from '../hooks/useRoutines';
import {useBleConnection} from '../hooks/useBleConnection';
import {useWorkoutSession} from '../hooks/useWorkoutSession';
import {RoutineCard} from '../components/RoutineCard';
import {EmptyState} from '../components/EmptyState';
import {Button} from '../components/Button';
import {ConnectingOverlay} from '../components/ConnectingOverlay';
import {ConnectionErrorDialog} from '../components/ConnectionErrorDialog';
import {Routine, RoutineExercise} from '../../domain/models/Routine';
import {generateUUID} from '../../domain/models/Models';

type DailyRoutinesScreenNavigationProp = StackNavigationProp<RootStackParamList>;

/**
 * Helper function to format set/reps configuration
 * Groups consecutive identical reps (e.g., "3×10, 2×8")
 */
const formatSetReps = (setReps: number[]): string => {
  if (!setReps || setReps.length === 0) return '0 sets';

  // Group consecutive identical reps
  const groups: Array<{count: number; reps: number}> = [];
  let currentReps = setReps[0];
  let currentCount = 1;

  for (let i = 1; i < setReps.length; i++) {
    if (setReps[i] === currentReps) {
      currentCount++;
    } else {
      groups.push({count: currentCount, reps: currentReps});
      currentReps = setReps[i];
      currentCount = 1;
    }
  }
  groups.push({count: currentCount, reps: currentReps});

  // Format as "3×10, 2×8"
  return groups.map(g => `${g.count}×${g.reps}`).join(', ');
};

/**
 * Helper function to calculate estimated workout duration
 * Estimate: 3 seconds per rep + rest time between sets
 */
const formatEstimatedDuration = (routine: Routine): number => {
  if (!routine.exercises || routine.exercises.length === 0) return 0;

  const totalReps = routine.exercises.reduce(
    (sum, ex) => sum + (ex.setReps?.reduce((a, b) => a + b, 0) ?? 0),
    0
  );
  const totalRestSeconds = routine.exercises.reduce(
    (sum, ex) => sum + (ex.restSeconds ?? 60) * ((ex.setReps?.length ?? 1) - 1),
    0
  );

  const estimatedSeconds = totalReps * 3 + totalRestSeconds;
  return Math.round(estimatedSeconds / 60); // Return minutes
};

/**
 * Convert RoutineExercise to format expected by RoutineCard
 */
const convertRoutineExercises = (exercises: RoutineExercise[]) => {
  return exercises.map(ex => ({
    id: ex.id,
    name: ex.exercise.name,
    sets: ex.setReps?.length ?? 0,
    reps: ex.setReps?.[0] ?? 10,
  }));
};

/**
 * DailyRoutinesScreen Component
 */
export const DailyRoutinesScreen: React.FC = () => {
  const navigation = useNavigation<DailyRoutinesScreenNavigationProp>();
  const colors = useColors();
  const typography = useTypography();
  const spacing = useSpacing();
  const isDark = useIsDark();

  // Hooks
  const {
    routines,
    isLoading,
    loadRoutine: loadRoutineForWorkout,
    deleteRoutine,
    saveRoutine,
    updateRoutine,
    refresh,
  } = useRoutines();

  const {
    connectionState,
    isAutoConnecting,
    connectionError,
    autoConnect,
    clearConnectionError,
  } = useBleConnection();

  const {startWorkout, updateWorkoutParameters} = useWorkoutSession();

  // Local state
  const [isConnecting, setIsConnecting] = useState(false);
  const [pendingRoutine, setPendingRoutine] = useState<Routine | null>(null);

  /**
   * Background gradient colors based on theme
   * Dark: slate-900 -> indigo-950 -> blue-950
   * Light: indigo-200 -> pink-100 -> violet-200
   */
  const backgroundGradientColors = isDark
    ? ['#0F172A', '#1E1B4B', '#172554']
    : ['#E0E7FF', '#FCE7F3', '#DDD6FE'];

  /**
   * Handle routine start - connect to device first
   */
  const handleStartWorkout = useCallback(
    async (routine: Routine) => {
      console.log(`Starting workout from routine: ${routine.name}`);

      // Check if already connected
      if (connectionState.type === 'connected') {
        // Load routine and start workout
        loadRoutineForWorkout(routine);

        // Configure workout parameters from first exercise
        if (routine.exercises && routine.exercises.length > 0) {
          const firstExercise = routine.exercises[0];
          updateWorkoutParameters({
            workoutType: firstExercise.workoutType ?? {type: 'program', mode: {modeValue: 0, displayName: 'Old School'}},
            reps: firstExercise.setReps?.[0] ?? 10,
            weightPerCableKg: firstExercise.weightPerCableKg ?? 10,
            progressionRegressionKg: firstExercise.progressionKg ?? 0,
            isJustLift: false,
            useAutoStart: false,
            stopAtTop: false,
            warmupReps: 3,
            selectedExerciseId: firstExercise.exercise.id,
          });
        }

        // Start workout and navigate
        await startWorkout(false, false);
        navigation.navigate(SCREEN_NAMES.ACTIVE_WORKOUT);
      } else {
        // Need to connect first
        setPendingRoutine(routine);
        setIsConnecting(true);

        try {
          await autoConnect(30000); // 30 second timeout

          // Connection successful, load and start
          loadRoutineForWorkout(routine);

          if (routine.exercises && routine.exercises.length > 0) {
            const firstExercise = routine.exercises[0];
            updateWorkoutParameters({
              workoutType: firstExercise.workoutType ?? {type: 'program', mode: {modeValue: 0, displayName: 'Old School'}},
              reps: firstExercise.setReps?.[0] ?? 10,
              weightPerCableKg: firstExercise.weightPerCableKg ?? 10,
              progressionRegressionKg: firstExercise.progressionKg ?? 0,
              isJustLift: false,
              useAutoStart: false,
              stopAtTop: false,
              warmupReps: 3,
              selectedExerciseId: firstExercise.exercise.id,
            });
          }

          await startWorkout(false, false);
          navigation.navigate(SCREEN_NAMES.ACTIVE_WORKOUT);
        } catch (error) {
          console.error('Failed to connect:', error);
          // Error dialog will be shown via connectionError state
        } finally {
          setIsConnecting(false);
          setPendingRoutine(null);
        }
      }
    },
    [
      connectionState,
      loadRoutineForWorkout,
      updateWorkoutParameters,
      startWorkout,
      autoConnect,
      navigation,
    ]
  );

  /**
   * Handle routine edit
   * TODO: Implement RoutineBuilderDialog
   */
  const handleEditRoutine = useCallback((routine: Routine) => {
    console.log('Edit routine:', routine.name);
    // TODO: Navigate to RoutineBuilder or show RoutineBuilderDialog
    Alert.alert(
      'Edit Routine',
      'Routine builder not yet implemented.\n\nThis will allow you to edit exercises, sets, reps, and weights.',
      [{text: 'OK'}]
    );
  }, []);

  /**
   * Handle routine delete with confirmation
   */
  const handleDeleteRoutine = useCallback(
    (routine: Routine) => {
      Alert.alert(
        'Delete Routine',
        `Are you sure you want to delete "${routine.name}"? This action cannot be undone.`,
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteRoutine(routine.id);
                console.log(`Deleted routine: ${routine.name}`);
              } catch (error) {
                console.error('Failed to delete routine:', error);
                Alert.alert('Error', 'Failed to delete routine. Please try again.');
              }
            },
          },
        ]
      );
    },
    [deleteRoutine]
  );

  /**
   * Handle routine duplicate
   * Creates a copy with new IDs and "(Copy)" suffix
   */
  const handleDuplicateRoutine = useCallback(
    async (routine: Routine) => {
      try {
        // Generate new IDs explicitly and create deep copies
        const newRoutineId = generateUUID();
        const newExercises: RoutineExercise[] = routine.exercises
          ? routine.exercises.map(exercise => ({
              ...exercise,
              id: generateUUID(),
              exercise: {...exercise.exercise},
            }))
          : [];

        // Smart duplicate naming: extract base name and find next copy number
        const baseName = routine.name.replace(/ \(Copy( \d+)?\)$/, '');
        const copyPattern = new RegExp(`^${baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\(Copy( (\\d+))?\\)$`);

        const existingCopyNumbers = routines
          .map(r => {
            if (r.name === baseName) return 0; // Original has number 0
            if (r.name === `${baseName} (Copy)`) return 1; // First copy is 1
            const match = copyPattern.exec(r.name);
            return match ? parseInt(match[2] || '1', 10) : null;
          })
          .filter((n): n is number => n !== null);

        const nextCopyNumber = (existingCopyNumbers.length > 0 ? Math.max(...existingCopyNumbers) : 0) + 1;
        const newName = nextCopyNumber === 1 ? `${baseName} (Copy)` : `${baseName} (Copy ${nextCopyNumber})`;

        const duplicated: Routine = {
          ...routine,
          id: newRoutineId,
          name: newName,
          createdAt: Date.now(),
          useCount: 0,
          lastUsed: null,
          exercises: newExercises,
        };

        await saveRoutine(duplicated);
        console.log(`Duplicated routine: ${routine.name} -> ${newName}`);
      } catch (error) {
        console.error('Failed to duplicate routine:', error);
        Alert.alert('Error', 'Failed to duplicate routine. Please try again.');
      }
    },
    [routines, saveRoutine]
  );

  /**
   * Handle create new routine
   * TODO: Implement RoutineBuilderDialog
   */
  const handleCreateRoutine = useCallback(() => {
    console.log('Create new routine');
    // TODO: Navigate to RoutineBuilder or show RoutineBuilderDialog
    Alert.alert(
      'Create Routine',
      'Routine builder not yet implemented.\n\nThis will allow you to create custom workout routines with multiple exercises.',
      [{text: 'OK'}]
    );
  }, []);

  /**
   * Retry connection after error
   */
  const handleRetryConnection = useCallback(async () => {
    if (pendingRoutine) {
      await handleStartWorkout(pendingRoutine);
    }
  }, [pendingRoutine, handleStartWorkout]);

  /**
   * Pull-to-refresh routines
   */
  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <View style={[styles.container, {backgroundColor: backgroundGradientColors[0]}]}>
      {/* Gradient background effect using layered views */}
      <View style={[styles.gradientLayer, {backgroundColor: backgroundGradientColors[1]}]} />
      <View style={[styles.gradientLayer, {backgroundColor: backgroundGradientColors[2]}]} />

      {/* Header with back button */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.surfaceVariant,
          },
        ]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <Icon name="arrow-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={[typography.titleLarge, {color: colors.onSurface, fontWeight: 'bold'}]}>
          Daily Routines
        </Text>
        <View style={{width: 40}} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, {padding: spacing.large}]}
        showsVerticalScrollIndicator={false}>
        <Text
          style={[
            typography.headlineMedium,
            {
              color: colors.onSurface,
              fontWeight: 'bold',
              marginBottom: spacing.medium,
            },
          ]}>
          My Routines
        </Text>

        {/* Empty state or routine list */}
        {routines.length === 0 ? (
          <EmptyState
            icon="🏋️"
            title="No Routines Yet"
            message="Create your first workout routine to get started"
            actionText="Create Your First Routine"
            onAction={handleCreateRoutine}
            testID="daily-routines-empty-state"
          />
        ) : (
          <View style={{gap: spacing.small}}>
            {routines.map(routine => (
              <RoutineCard
                key={routine.id}
                id={routine.id}
                name={routine.name}
                description={routine.description}
                exercises={convertRoutineExercises(routine.exercises ?? [])}
                estimatedDuration={formatEstimatedDuration(routine)}
                onPress={() => handleStartWorkout(routine)}
                onEdit={() => handleEditRoutine(routine)}
                onDelete={() => handleDeleteRoutine(routine)}
                onDuplicate={() => handleDuplicateRoutine(routine)}
                testID={`routine-card-${routine.id}`}
              />
            ))}
          </View>
        )}

        {/* Bottom spacing for FAB */}
        <View style={{height: 100}} />
      </ScrollView>

      {/* Floating Action Button for creating new routine */}
      {routines.length > 0 && (
        <View style={[styles.fab, {padding: spacing.medium}]}>
          <Button
            onPress={handleCreateRoutine}
            variant="elevated"
            icon={<Icon name="add" size={24} color={colors.onPrimary} />}
            iconPosition="left"
            style={{
              paddingHorizontal: spacing.large,
              shadowColor: '#000',
              shadowOffset: {width: 0, height: 4},
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
            testID="create-routine-fab">
            New Routine
          </Button>
        </View>
      )}

      {/* Auto-connect overlay */}
      <ConnectingOverlay
        visible={isAutoConnecting || isConnecting}
        title="Connecting to device..."
        subtitle="Scanning for Vitruvian Trainer"
        testID="daily-routines-connecting-overlay"
      />

      {/* Connection error dialog */}
      <ConnectionErrorDialog
        visible={!!connectionError}
        message={connectionError || ''}
        onDismiss={() => {
          clearConnectionError();
          setPendingRoutine(null);
        }}
        onRetry={handleRetryConnection}
        testID="daily-routines-connection-error"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientLayer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: Platform.OS === 'android' ? 20 : 0,
  },
  fab: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    left: 0,
    alignItems: 'flex-end',
    backgroundColor: 'transparent',
  },
});

export default DailyRoutinesScreen;
