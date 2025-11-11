/**
 * SingleExerciseScreen
 * Screen for selecting a single exercise and configuring workout parameters
 *
 * Flow:
 * 1. Exercise selection from library (with search/filters)
 * 2. Configure workout parameters (mode, reps, weight, etc.)
 * 3. Connect to device and start workout
 * 4. Navigate to ActiveWorkoutScreen
 *
 * Migrated from Android Compose SingleExerciseScreen.kt
 */

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {useColors, useTypography, useSpacing} from '../theme';
import {Modal} from '../components/Modal';
import {Button, TextButton} from '../components/Button';
import {Input} from '../components/Input';
import {Card} from '../components/Card';
import {ExerciseCard} from '../components/ExerciseCard';
import {EmptyState} from '../components/EmptyState';
import {ConnectingOverlay} from '../components/ConnectingOverlay';
import {ConnectionErrorDialog} from '../components/ConnectionErrorDialog';
import {useExerciseLibrary} from '../hooks/useExerciseLibrary';
import {useWorkoutSession} from '../hooks/useWorkoutSession';
import {useBleConnection} from '../hooks/useBleConnection';
import {ExerciseEntity} from '../../data/local/entities';
import {
  Exercise,
  CableConfiguration,
  resolveDefaultCableConfig,
} from '../../domain/models/Exercise';
import {
  RoutineExercise,
  createDefaultRoutineExercise,
} from '../../domain/models/Routine';
import {
  WorkoutType,
  ProgramMode,
  EccentricLoad,
  EchoLevel,
  generateUUID,
} from '../../domain/models/Models';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

export interface SingleExerciseScreenProps {
  navigation: any; // Navigation prop from React Navigation
}

/**
 * Main SingleExerciseScreen component
 */
export const SingleExerciseScreen: React.FC<SingleExerciseScreenProps> = ({
  navigation,
}) => {
  const colors = useColors();
  const typography = useTypography();
  const spacing = useSpacing();

  // Exercise library hook
  const {
    exercises,
    searchQuery,
    selectedMuscleGroups,
    selectedEquipment,
    showFavoritesOnly,
    isLoading: isLoadingExercises,
    error: exerciseError,
    updateSearchQuery,
    toggleMuscleGroupFilter,
    toggleEquipmentFilter,
    toggleFavorite,
    toggleShowFavoritesOnly,
    clearFilters,
  } = useExerciseLibrary();

  // Workout session hook
  const {workoutParameters, updateWorkoutParameters, startWorkout} =
    useWorkoutSession();

  // BLE connection hook
  const {connectionState, connectToDevice, autoConnect, disconnect} = useBleConnection();

  // Local state
  const [showExercisePicker, setShowExercisePicker] = useState(true);
  const [exerciseToConfig, setExerciseToConfig] =
    useState<RoutineExercise | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Handle back button
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      // Allow navigation if user is leaving
      return;
    });

    return unsubscribe;
  }, [navigation]);

  // Handle exercise selection from picker
  const handleExerciseSelected = (selectedExercise: ExerciseEntity) => {
    // Convert ExerciseEntity to Exercise domain model
    const exercise: Exercise = {
      name: selectedExercise.name,
      muscleGroup: selectedExercise.muscleGroups.split(',')[0]?.trim() || 'Full Body',
      equipment: selectedExercise.equipment.split(',')[0]?.trim() || '',
      defaultCableConfig: CableConfiguration.DOUBLE,
      id: selectedExercise.id,
    };

    // Create RoutineExercise with default configuration
    const newRoutineExercise = createDefaultRoutineExercise(exercise, {
      id: generateUUID(),
      cableConfig: resolveDefaultCableConfig(exercise),
      orderIndex: 0,
      setReps: [10, 10, 10],
      weightPerCableKg: 20,
      progressionKg: 0,
      restSeconds: 60,
      notes: '',
      workoutType: {type: 'program', mode: ProgramMode.OldSchool},
      eccentricLoad: EccentricLoad.LOAD_100,
      echoLevel: EchoLevel.HARDER,
    });

    setExerciseToConfig(newRoutineExercise);
    setShowExercisePicker(false);
  };

  // Handle workout start
  const handleStartWorkout = async (configuredExercise: RoutineExercise) => {
    try {
      setIsConnecting(true);
      setConnectionError(null);

      // Check if already connected
      if (connectionState.type !== 'connected') {
        // Attempt to connect with 30 second timeout
        const connected = await autoConnect(30000);
        if (!connected) {
          setConnectionError('Failed to connect to device');
          setIsConnecting(false);
          return;
        }
      }

      // Update workout parameters with exercise configuration
      const params = {
        workoutType: configuredExercise.workoutType || {
          type: 'program' as const,
          mode: ProgramMode.OldSchool,
        },
        reps: configuredExercise.setReps?.[0] || 10,
        weightPerCableKg: configuredExercise.weightPerCableKg,
        progressionRegressionKg: configuredExercise.progressionKg || 0,
        isJustLift: false,
        useAutoStart: false,
        stopAtTop: false,
        warmupReps: 3,
        selectedExerciseId: configuredExercise.exercise.id || null,
      };

      updateWorkoutParameters(params);

      // Start the workout
      await startWorkout(false, false);

      // Navigate to active workout screen
      navigation.navigate('ActiveWorkout');

      // Reset state
      setExerciseToConfig(null);
      setIsConnecting(false);
    } catch (error) {
      console.error('Failed to start workout:', error);
      setConnectionError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
      setIsConnecting(false);
    }
  };

  // Handle exercise configuration dismiss
  const handleConfigDismiss = () => {
    setExerciseToConfig(null);
    setShowExercisePicker(true);
  };

  // Handle clear connection error
  const handleClearConnectionError = () => {
    setConnectionError(null);
  };

  // Render exercise picker modal
  const renderExercisePicker = () => {
    return (
      <Modal
        visible={showExercisePicker}
        onDismiss={() => {
          setShowExercisePicker(false);
        }}
        variant="fullscreen"
        showCloseButton={false}
        dismissOnBackdropPress={false}>
        <View style={{flex: 1}}>
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: spacing.medium,
              borderBottomWidth: 1,
              borderBottomColor: colors.surfaceVariant,
            }}>
            <Text style={[typography.headlineSmall, {color: colors.onSurface}]}>
              Select Exercise
            </Text>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Close">
              <Text style={[typography.titleMedium, {color: colors.primary}]}>
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <View style={{padding: spacing.medium}}>
            <Input
              value={searchQuery}
              onChangeText={updateSearchQuery}
              placeholder="Search exercises..."
              variant="outlined"
            />
          </View>

          {/* Favorites toggle */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: spacing.medium,
              paddingBottom: spacing.small,
            }}>
            <Text style={[typography.labelMedium, {color: colors.onSurface}]}>
              Show Favorites Only
            </Text>
            <TouchableOpacity
              onPress={toggleShowFavoritesOnly}
              style={{
                width: 50,
                height: 30,
                borderRadius: 15,
                backgroundColor: showFavoritesOnly
                  ? colors.primary
                  : colors.surfaceVariant,
                justifyContent: 'center',
                padding: 3,
              }}
              accessibilityRole="switch"
              accessibilityState={{checked: showFavoritesOnly}}>
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: colors.surface,
                  alignSelf: showFavoritesOnly ? 'flex-end' : 'flex-start',
                }}
              />
            </TouchableOpacity>
          </View>

          {/* Muscle group filters */}
          <View style={{paddingHorizontal: spacing.medium}}>
            <Text
              style={[
                typography.labelMedium,
                {color: colors.onSurface, marginBottom: spacing.small},
              ]}>
              Muscle Groups
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{marginBottom: spacing.medium}}>
              {['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'].map(
                group => (
                  <TouchableOpacity
                    key={group}
                    onPress={() => toggleMuscleGroupFilter(group)}
                    style={{
                      paddingHorizontal: spacing.medium,
                      paddingVertical: spacing.small,
                      borderRadius: 8,
                      backgroundColor: selectedMuscleGroups.has(group)
                        ? colors.primaryContainer
                        : colors.surfaceVariant,
                      marginRight: spacing.small,
                    }}
                    accessibilityRole="button">
                    <Text
                      style={[
                        typography.labelMedium,
                        {
                          color: selectedMuscleGroups.has(group)
                            ? colors.onPrimaryContainer
                            : colors.onSurfaceVariant,
                        },
                      ]}>
                      {group}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </ScrollView>
          </View>

          {/* Equipment filters */}
          <View style={{paddingHorizontal: spacing.medium}}>
            <Text
              style={[
                typography.labelMedium,
                {color: colors.onSurface, marginBottom: spacing.small},
              ]}>
              Equipment
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{marginBottom: spacing.medium}}>
              {[
                'Long Bar',
                'Short Bar',
                'Handles',
                'Rope',
                'Belt',
                'Ankle Strap',
                'Bench',
                'Bodyweight',
              ].map(equipment => (
                <TouchableOpacity
                  key={equipment}
                  onPress={() => toggleEquipmentFilter(equipment)}
                  style={{
                    paddingHorizontal: spacing.medium,
                    paddingVertical: spacing.small,
                    borderRadius: 8,
                    backgroundColor: selectedEquipment.has(equipment)
                      ? colors.primaryContainer
                      : colors.surfaceVariant,
                    marginRight: spacing.small,
                  }}
                  accessibilityRole="button">
                  <Text
                    style={[
                      typography.labelMedium,
                      {
                        color: selectedEquipment.has(equipment)
                          ? colors.onPrimaryContainer
                          : colors.onSurfaceVariant,
                      },
                    ]}>
                    {equipment}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Exercise list */}
          <View style={{flex: 1, paddingHorizontal: spacing.medium}}>
            {isLoadingExercises ? (
              <View
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text
                  style={[
                    typography.bodyMedium,
                    {color: colors.onSurfaceVariant, marginTop: spacing.medium},
                  ]}>
                  Loading exercises...
                </Text>
              </View>
            ) : exercises.length === 0 ? (
              <EmptyState
                icon="🔍"
                title="No exercises found"
                message="Try adjusting your search or filters"
                actionText="Clear Filters"
                onAction={clearFilters}
              />
            ) : (
              <FlatList
                data={exercises}
                keyExtractor={item => item.id}
                renderItem={({item}) => (
                  <ExerciseCard
                    name={item.name}
                    muscleGroups={item.muscleGroups}
                    equipment={item.equipment}
                    isFavorite={item.isFavorite}
                    timesPerformed={item.timesPerformed}
                    showPerformanceCount={true}
                    onPress={() => handleExerciseSelected(item)}
                    onFavoritePress={() => toggleFavorite(item.id)}
                  />
                )}
                contentContainerStyle={{paddingBottom: spacing.large}}
              />
            )}
          </View>
        </View>
      </Modal>
    );
  };

  // Render exercise configuration modal
  const renderExerciseConfig = () => {
    if (!exerciseToConfig) return null;

    return (
      <Modal
        visible={true}
        onDismiss={handleConfigDismiss}
        variant="bottom"
        title="Configure Exercise"
        showCloseButton={true}>
        <ExerciseConfigForm
          exercise={exerciseToConfig}
          onSave={handleStartWorkout}
          onCancel={handleConfigDismiss}
        />
      </Modal>
    );
  };

  // Render empty state when no exercise selected
  const renderEmptyState = () => {
    if (showExercisePicker || exerciseToConfig) return null;

    return (
      <EmptyState
        icon="🏋️"
        title="Choose an exercise to begin"
        message="Select an exercise from the library to configure your workout"
        actionText="Select Exercise"
        onAction={() => setShowExercisePicker(true)}
      />
    );
  };

  return (
    <View style={{flex: 1, backgroundColor: colors.background}}>
      {/* Header */}
      <View
        style={{
          padding: spacing.medium,
          borderBottomWidth: 1,
          borderBottomColor: colors.surfaceVariant,
        }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{padding: spacing.small}}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <Text style={[typography.titleLarge, {color: colors.onSurface}]}>
              ←
            </Text>
          </TouchableOpacity>
          <Text style={[typography.titleLarge, {color: colors.onSurface}]}>
            Single Exercise
          </Text>
          <View style={{width: 40}} />
        </View>
      </View>

      {/* Content */}
      {renderEmptyState()}

      {/* Modals */}
      {renderExercisePicker()}
      {renderExerciseConfig()}

      {/* Connecting overlay */}
      <ConnectingOverlay visible={isConnecting} />

      {/* Connection error dialog */}
      <ConnectionErrorDialog
        visible={!!connectionError}
        message={connectionError || ''}
        onDismiss={handleClearConnectionError}
      />
    </View>
  );
};

/**
 * Exercise configuration form component
 * Handles all workout parameter configuration
 */
interface ExerciseConfigFormProps {
  exercise: RoutineExercise;
  onSave: (exercise: RoutineExercise) => void;
  onCancel: () => void;
}

const ExerciseConfigForm: React.FC<ExerciseConfigFormProps> = ({
  exercise: initialExercise,
  onSave,
  onCancel,
}) => {
  const colors = useColors();
  const typography = useTypography();
  const spacing = useSpacing();

  // Local state for configuration
  const [exercise, setExercise] = useState<RoutineExercise>(initialExercise);

  // Update exercise state helper
  const updateExercise = (updates: Partial<RoutineExercise>) => {
    setExercise(prev => ({...prev, ...updates}));
  };

  // Handle workout mode selection
  const handleModeChange = (mode: string) => {
    let workoutType: WorkoutType;

    switch (mode) {
      case 'OldSchool':
        workoutType = {type: 'program', mode: ProgramMode.OldSchool};
        break;
      case 'Pump':
        workoutType = {type: 'program', mode: ProgramMode.Pump};
        break;
      case 'TUT':
        workoutType = {type: 'program', mode: ProgramMode.TUT};
        break;
      case 'TUTBeast':
        workoutType = {type: 'program', mode: ProgramMode.TUTBeast};
        break;
      case 'EccentricOnly':
        workoutType = {type: 'program', mode: ProgramMode.EccentricOnly};
        break;
      case 'Echo':
        workoutType = {
          type: 'echo',
          level: exercise.echoLevel || EchoLevel.HARDER,
          eccentricLoad: exercise.eccentricLoad || EccentricLoad.LOAD_100,
        };
        break;
      default:
        workoutType = {type: 'program', mode: ProgramMode.OldSchool};
    }

    updateExercise({workoutType});
  };

  const currentMode =
    exercise.workoutType?.type === 'program'
      ? exercise.workoutType.mode.displayName
      : 'Echo';

  const isEchoMode = exercise.workoutType?.type === 'echo';

  return (
    <ScrollView style={{flex: 1}}>
      {/* Exercise name */}
      <View style={{marginBottom: spacing.large}}>
        <Text
          style={[
            typography.headlineSmall,
            {color: colors.primary, fontWeight: 'bold'},
          ]}>
          {exercise.exercise.name}
        </Text>
        <Text style={[typography.bodyMedium, {color: colors.onSurfaceVariant}]}>
          {exercise.exercise.muscleGroup}
        </Text>
      </View>

      {/* Mode selector */}
      <View style={{marginBottom: spacing.large}}>
        <Text
          style={[
            typography.labelLarge,
            {color: colors.onSurface, marginBottom: spacing.small},
          ]}>
          Workout Mode
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            'OldSchool',
            'Pump',
            'TUT',
            'TUTBeast',
            'EccentricOnly',
            'Echo',
          ].map(mode => (
            <TouchableOpacity
              key={mode}
              onPress={() => handleModeChange(mode)}
              style={{
                paddingHorizontal: spacing.medium,
                paddingVertical: spacing.small,
                borderRadius: 8,
                backgroundColor:
                  currentMode === mode || (mode === 'OldSchool' && currentMode === 'Old School')
                    ? colors.primaryContainer
                    : colors.surfaceVariant,
                marginRight: spacing.small,
              }}
              accessibilityRole="button">
              <Text
                style={[
                  typography.labelMedium,
                  {
                    color:
                      currentMode === mode || (mode === 'OldSchool' && currentMode === 'Old School')
                        ? colors.onPrimaryContainer
                        : colors.onSurfaceVariant,
                  },
                ]}>
                {mode === 'OldSchool' ? 'Old School' : mode === 'TUTBeast' ? 'TUT Beast' : mode === 'EccentricOnly' ? 'Eccentric Only' : mode}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Sets configuration */}
      <View style={{marginBottom: spacing.large}}>
        <Text
          style={[
            typography.labelLarge,
            {color: colors.onSurface, marginBottom: spacing.small},
          ]}>
          Sets & Reps
        </Text>
        <Card>
          <View style={{padding: spacing.medium}}>
            <Text style={[typography.bodyMedium, {color: colors.onSurface}]}>
              Sets: {exercise.setReps?.length || 3}
            </Text>
            <Text
              style={[
                typography.bodyMedium,
                {color: colors.onSurface, marginTop: spacing.small},
              ]}>
              Reps per set: {exercise.setReps?.join(', ') || '10, 10, 10'}
            </Text>
          </View>
        </Card>
      </View>

      {/* Weight configuration */}
      {!isEchoMode && (
        <View style={{marginBottom: spacing.large}}>
          <Text
            style={[
              typography.labelLarge,
              {color: colors.onSurface, marginBottom: spacing.small},
            ]}>
            Weight (per cable)
          </Text>
          <Card>
            <View style={{padding: spacing.medium}}>
              <Text
                style={[typography.titleLarge, {color: colors.onSurface}]}>
                {exercise.weightPerCableKg} kg
              </Text>
            </View>
          </Card>
        </View>
      )}

      {/* Progression/Regression */}
      {!isEchoMode && (
        <View style={{marginBottom: spacing.large}}>
          <Text
            style={[
              typography.labelLarge,
              {color: colors.onSurface, marginBottom: spacing.small},
            ]}>
            Weight Change Per Rep
          </Text>
          <Card>
            <View style={{padding: spacing.medium}}>
              <Text
                style={[typography.bodyMedium, {color: colors.onSurface}]}>
                {exercise.progressionKg || 0} kg
              </Text>
              <Text
                style={[
                  typography.bodySmall,
                  {color: colors.onSurfaceVariant, marginTop: spacing.small},
                ]}>
                Negative = Regression, Positive = Progression
              </Text>
            </View>
          </Card>
        </View>
      )}

      {/* Rest time */}
      <View style={{marginBottom: spacing.large}}>
        <Text
          style={[
            typography.labelLarge,
            {color: colors.onSurface, marginBottom: spacing.small},
          ]}>
          Rest Time
        </Text>
        <Card>
          <View style={{padding: spacing.medium}}>
            <Text style={[typography.bodyMedium, {color: colors.onSurface}]}>
              {exercise.restSeconds || 60} seconds
            </Text>
          </View>
        </Card>
      </View>

      {/* Echo mode specific settings */}
      {isEchoMode && (
        <>
          <View style={{marginBottom: spacing.large}}>
            <Text
              style={[
                typography.labelLarge,
                {color: colors.onSurface, marginBottom: spacing.small},
              ]}>
              Echo Level
            </Text>
            <Card>
              <View style={{padding: spacing.medium}}>
                <Text
                  style={[typography.bodyMedium, {color: colors.onSurface}]}>
                  {exercise.echoLevel === EchoLevel.HARD
                    ? 'Hard'
                    : exercise.echoLevel === EchoLevel.HARDER
                    ? 'Harder'
                    : exercise.echoLevel === EchoLevel.HARDEST
                    ? 'Hardest'
                    : 'Epic'}
                </Text>
              </View>
            </Card>
          </View>

          <View style={{marginBottom: spacing.large}}>
            <Text
              style={[
                typography.labelLarge,
                {color: colors.onSurface, marginBottom: spacing.small},
              ]}>
              Eccentric Load
            </Text>
            <Card>
              <View style={{padding: spacing.medium}}>
                <Text
                  style={[typography.bodyMedium, {color: colors.onSurface}]}>
                  {exercise.eccentricLoad || 100}%
                </Text>
              </View>
            </Card>
          </View>
        </>
      )}

      {/* Notes */}
      {exercise.notes && (
        <View style={{marginBottom: spacing.large}}>
          <Text
            style={[
              typography.labelLarge,
              {color: colors.onSurface, marginBottom: spacing.small},
            ]}>
            Notes
          </Text>
          <Card>
            <View style={{padding: spacing.medium}}>
              <Text
                style={[typography.bodyMedium, {color: colors.onSurface}]}>
                {exercise.notes}
              </Text>
            </View>
          </Card>
        </View>
      )}

      {/* Action buttons */}
      <View
        style={{
          flexDirection: 'row',
          gap: spacing.small,
          marginTop: spacing.large,
          marginBottom: spacing.large,
        }}>
        <TextButton onPress={onCancel} style={{flex: 1}}>
          Cancel
        </TextButton>
        <Button onPress={() => onSave(exercise)} style={{flex: 1}}>
          Start Workout
        </Button>
      </View>
    </ScrollView>
  );
};
