/**
 * ActiveWorkoutScreen Component
 * Real-time workout monitoring with live metrics
 * Migrated from Android Compose ActiveWorkoutScreen
 */

import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  BackHandler,
  Alert,
  Platform,
} from 'react-native';
import {useColors, useTypography, useSpacing} from '../theme';
import {useWorkoutSession} from '../hooks/useWorkoutSession';
import {useBleConnection} from '../hooks/useBleConnection';
import {WorkoutMetricsDisplay, WorkoutMetric} from '../components/WorkoutMetricsDisplay';
import {Button, TextButton} from '../components/Button';
import {Card} from '../components/Card';
import {CountdownTimer} from '../components/CountdownTimer';
import {RestTimer} from '../components/RestTimer';
import {ConnectingOverlay} from '../components/ConnectingOverlay';
import {ConnectionErrorDialog} from '../components/ConnectionErrorDialog';
import {Modal, AlertDialog} from '../components/Modal';
import {WeightUnit} from '../../domain/models/Models';

export interface ActiveWorkoutScreenProps {
  // Navigation props
  onNavigateBack?: () => void;

  // Optional workout configuration
  routineName?: string;
  currentExerciseIndex?: number;
  totalExercises?: number;
  exerciseName?: string;

  // Weight formatting
  weightUnit?: WeightUnit;
  formatWeight?: (weightKg: number) => string;

  testID?: string;
}

/**
 * Active Workout Screen
 * Displays real-time workout metrics and controls
 * Features:
 * - Real-time metrics display (load, position, velocity)
 * - Rep counter with warmup/working distinction
 * - Progress bars for sets
 * - Stop workout button
 * - Auto-save session to database
 * - PR celebration on achievement
 * - Prevents accidental back navigation
 */
export const ActiveWorkoutScreen: React.FC<ActiveWorkoutScreenProps> = ({
  onNavigateBack,
  routineName,
  currentExerciseIndex = 0,
  totalExercises = 1,
  exerciseName,
  weightUnit = WeightUnit.KG,
  formatWeight = (weight) => `${weight.toFixed(1)} kg`,
  testID,
}) => {
  const colors = useColors();
  const typography = useTypography();
  const spacing = useSpacing();

  // Hooks
  const {
    workoutState,
    workoutParameters,
    repCount,
    autoStopState,
    autoStartCountdown,
    stopWorkout,
    resetForNewWorkout,
  } = useWorkoutSession();

  const {
    connectionState,
    currentMetric,
    isAutoConnecting,
    connectionError,
    clearConnectionError,
  } = useBleConnection();

  // Local state
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [showPRCelebration, setShowPRCelebration] = useState(false);
  const [prDetails, setPrDetails] = useState<{
    exerciseName: string;
    weight: string;
    reps: number;
  } | null>(null);

  // Determine screen title
  const screenTitle = routineName ||
    (workoutParameters.isJustLift ? 'Just Lift' : exerciseName || 'Single Exercise');

  // Handle back press (Android hardware back button)
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        // Prevent back navigation if workout is active
        if (
          workoutState.type === 'active' ||
          workoutState.type === 'countdown' ||
          workoutState.type === 'resting'
        ) {
          setShowExitConfirmation(true);
          return true; // Prevent default back behavior
        }
        return false; // Allow default back behavior
      }
    );

    return () => backHandler.remove();
  }, [workoutState]);

  // Auto-navigate back on workout completion
  useEffect(() => {
    if (workoutState.type === 'completed') {
      const timer = setTimeout(() => {
        if (onNavigateBack) {
          onNavigateBack();
        }
      }, 2000);

      return () => clearTimeout(timer);
    }

    // For Just Lift mode, navigate back when returning to idle
    if (workoutState.type === 'idle' && workoutParameters.isJustLift) {
      const timer = setTimeout(() => {
        if (onNavigateBack) {
          onNavigateBack();
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [workoutState, workoutParameters.isJustLift, onNavigateBack]);

  // Handle exit confirmation
  const handleExitWorkout = useCallback(() => {
    stopWorkout();
    setShowExitConfirmation(false);
    if (onNavigateBack) {
      onNavigateBack();
    }
  }, [stopWorkout, onNavigateBack]);

  // Handle back button press
  const handleBackPress = useCallback(() => {
    if (
      workoutState.type === 'active' ||
      workoutState.type === 'countdown' ||
      workoutState.type === 'resting'
    ) {
      setShowExitConfirmation(true);
    } else {
      if (onNavigateBack) {
        onNavigateBack();
      }
    }
  }, [workoutState, onNavigateBack]);

  // Create live metrics for display
  const createLiveMetrics = (): WorkoutMetric[] => {
    if (!currentMetric) {
      return [
        {label: 'Load', value: '--', icon: '⚖️', iconColor: '#9333EA'},
        {label: 'Position', value: '--', icon: '📏', iconColor: '#3B82F6'},
        {label: 'Velocity', value: '--', icon: '⚡', iconColor: '#10B981'},
      ];
    }

    const totalLoad = currentMetric.loadA + currentMetric.loadB;
    const avgPosition = (currentMetric.positionA + currentMetric.positionB) / 2;
    const velocity = currentMetric.velocityA || 0;

    return [
      {
        label: 'Load',
        value: formatWeight(totalLoad),
        icon: '⚖️',
        iconColor: '#9333EA',
      },
      {
        label: 'Position',
        value: `${avgPosition.toFixed(0)}%`,
        icon: '📏',
        iconColor: '#3B82F6',
      },
      {
        label: 'Velocity',
        value: `${Math.abs(velocity).toFixed(1)} m/s`,
        icon: '⚡',
        iconColor: '#10B981',
      },
    ];
  };

  // Render countdown state
  if (workoutState.type === 'countdown') {
    return (
      <View style={{flex: 1, backgroundColor: colors.background}} testID={testID}>
        <CountdownTimer
          secondsRemaining={workoutState.secondsRemaining}
          testID={testID ? `${testID}-countdown` : undefined}
        />
      </View>
    );
  }

  // Render resting state
  if (workoutState.type === 'resting') {
    return (
      <View style={{flex: 1, backgroundColor: colors.background}} testID={testID}>
        <RestTimer
          restSecondsRemaining={workoutState.restSecondsRemaining}
          nextExerciseName={workoutState.nextExerciseName}
          isLastExercise={workoutState.isLastExercise}
          currentSet={workoutState.currentSet}
          totalSets={workoutState.totalSets}
          onSkipRest={() => {
            // Skip rest functionality would be implemented here
            console.log('Skip rest pressed');
          }}
          onEndWorkout={() => {
            stopWorkout();
          }}
          testID={testID ? `${testID}-rest` : undefined}
        />
      </View>
    );
  }

  return (
    <View style={{flex: 1, backgroundColor: colors.background}} testID={testID}>
      {/* Header */}
      <View
        style={{
          backgroundColor: colors.surface,
          paddingTop: Platform.OS === 'ios' ? 50 : 20,
          paddingHorizontal: spacing.medium,
          paddingBottom: spacing.medium,
          borderBottomWidth: 1,
          borderBottomColor: colors.surfaceVariant,
        }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
            <TextButton
              onPress={handleBackPress}
              size="small"
              style={{marginRight: spacing.small}}>
              ← Back
            </TextButton>
            <View style={{flex: 1}}>
              <Text
                style={[
                  typography.titleLarge,
                  {color: colors.onSurface, fontWeight: 'bold'},
                ]}
                numberOfLines={1}>
                {screenTitle}
              </Text>
              {totalExercises > 1 && (
                <Text
                  style={[
                    typography.bodySmall,
                    {color: colors.onSurfaceVariant},
                  ]}>
                  Exercise {currentExerciseIndex + 1} of {totalExercises}
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={{
          padding: spacing.large,
          gap: spacing.large,
        }}>
        {/* Connection Status */}
        {connectionState.type !== 'connected' && (
          <Card
            style={{
              backgroundColor: colors.errorContainer,
              borderWidth: 1,
              borderColor: colors.error,
            }}>
            <View style={{padding: spacing.medium, gap: spacing.small}}>
              <Text
                style={[
                  typography.titleMedium,
                  {color: colors.onErrorContainer},
                ]}>
                ⚠️ Not Connected
              </Text>
              <Text
                style={[
                  typography.bodySmall,
                  {color: colors.onErrorContainer},
                ]}>
                Please connect to your Vitruvian Trainer to start workout.
              </Text>
            </View>
          </Card>
        )}

        {/* Workout State */}
        <Card>
          <View style={{padding: spacing.large, gap: spacing.medium}}>
            <Text
              style={[
                typography.headlineSmall,
                {color: colors.onSurface, fontWeight: 'bold'},
              ]}>
              Workout Status
            </Text>

            {/* Current State */}
            <View
              style={{
                padding: spacing.medium,
                backgroundColor: colors.primaryContainer,
                borderRadius: 8,
              }}>
              <Text
                style={[
                  typography.titleMedium,
                  {color: colors.onPrimaryContainer, fontWeight: 'bold'},
                ]}>
                {workoutState.type === 'active' && '🏋️ Workout Active'}
                {workoutState.type === 'idle' && '⏸️ Ready to Start'}
                {workoutState.type === 'completed' && '✅ Workout Complete'}
                {workoutState.type === 'error' && '❌ Error'}
              </Text>
            </View>

            {/* Rep Counter */}
            <View style={{gap: spacing.small}}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                <Text
                  style={[
                    typography.bodyMedium,
                    {color: colors.onSurfaceVariant},
                  ]}>
                  Warmup Reps
                </Text>
                <Text
                  style={[
                    typography.titleLarge,
                    {color: colors.onSurface, fontWeight: 'bold'},
                  ]}>
                  {repCount.warmupReps || 0} / {workoutParameters.warmupReps || 0}
                </Text>
              </View>

              {/* Warmup Progress Bar */}
              <View
                style={{
                  height: 8,
                  backgroundColor: colors.surfaceVariant,
                  borderRadius: 4,
                  overflow: 'hidden',
                }}>
                <View
                  style={{
                    height: '100%',
                    width: `${Math.min(
                      ((repCount.warmupReps || 0) /
                        (workoutParameters.warmupReps || 1)) *
                        100,
                      100
                    )}%`,
                    backgroundColor: colors.tertiary,
                  }}
                />
              </View>

              {!workoutParameters.isJustLift && (
                <>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: spacing.small,
                    }}>
                    <Text
                      style={[
                        typography.bodyMedium,
                        {color: colors.onSurfaceVariant},
                      ]}>
                      Working Reps
                    </Text>
                    <Text
                      style={[
                        typography.titleLarge,
                        {color: colors.primary, fontWeight: 'bold'},
                      ]}>
                      {repCount.workingReps || 0} /{' '}
                      {workoutParameters.reps || 0}
                    </Text>
                  </View>

                  {/* Working Progress Bar */}
                  <View
                    style={{
                      height: 8,
                      backgroundColor: colors.surfaceVariant,
                      borderRadius: 4,
                      overflow: 'hidden',
                    }}>
                    <View
                      style={{
                        height: '100%',
                        width: `${Math.min(
                          ((repCount.workingReps || 0) /
                            (workoutParameters.reps || 1)) *
                            100,
                          100
                        )}%`,
                        backgroundColor: colors.primary,
                      }}
                    />
                  </View>
                </>
              )}
            </View>
          </View>
        </Card>

        {/* Live Metrics */}
        {workoutState.type === 'active' && (
          <Card>
            <View style={{padding: spacing.large, gap: spacing.medium}}>
              <Text
                style={[
                  typography.headlineSmall,
                  {color: colors.onSurface, fontWeight: 'bold'},
                ]}>
                Live Metrics
              </Text>
              <WorkoutMetricsDisplay
                metrics={createLiveMetrics()}
                columns={3}
                testID={testID ? `${testID}-metrics` : undefined}
              />
            </View>
          </Card>
        )}

        {/* Auto-stop indicator (Just Lift mode) */}
        {workoutParameters.isJustLift && autoStopState.isActive && (
          <Card
            style={{
              backgroundColor: colors.tertiaryContainer,
              borderWidth: 1,
              borderColor: colors.tertiary,
            }}>
            <View style={{padding: spacing.medium, gap: spacing.small}}>
              <Text
                style={[
                  typography.titleMedium,
                  {color: colors.onTertiaryContainer},
                ]}>
                ⏱️ Auto-stopping in {autoStopState.secondsRemaining}s
              </Text>
              <View
                style={{
                  height: 4,
                  backgroundColor: colors.surfaceVariant,
                  borderRadius: 2,
                  overflow: 'hidden',
                }}>
                <View
                  style={{
                    height: '100%',
                    width: `${autoStopState.progress * 100}%`,
                    backgroundColor: colors.tertiary,
                  }}
                />
              </View>
            </View>
          </Card>
        )}

        {/* Auto-start countdown (Just Lift mode) */}
        {autoStartCountdown !== null && (
          <Card
            style={{
              backgroundColor: colors.primaryContainer,
              borderWidth: 1,
              borderColor: colors.primary,
            }}>
            <View style={{padding: spacing.medium}}>
              <Text
                style={[
                  typography.titleMedium,
                  {color: colors.onPrimaryContainer, textAlign: 'center'},
                ]}>
                Starting in {autoStartCountdown}...
              </Text>
            </View>
          </Card>
        )}

        {/* Stop Workout Button */}
        {workoutState.type === 'active' && (
          <Button
            onPress={() => {
              Alert.alert(
                'Stop Workout?',
                'Are you sure you want to stop the workout? Your progress will be saved.',
                [
                  {text: 'Cancel', style: 'cancel'},
                  {
                    text: 'Stop',
                    style: 'destructive',
                    onPress: stopWorkout,
                  },
                ],
                {cancelable: true}
              );
            }}
            variant="outlined"
            fullWidth
            style={{borderColor: colors.error}}
            textStyle={{color: colors.error}}>
            🛑 Stop Workout
          </Button>
        )}

        {/* Completed State Actions */}
        {workoutState.type === 'completed' && !workoutParameters.isJustLift && (
          <View style={{gap: spacing.small}}>
            <Card
              style={{
                backgroundColor: colors.primaryContainer,
                padding: spacing.large,
              }}>
              <Text
                style={[
                  typography.headlineSmall,
                  {
                    color: colors.onPrimaryContainer,
                    textAlign: 'center',
                    fontWeight: 'bold',
                  },
                ]}>
                🎉 Workout Complete!
              </Text>
              <Text
                style={[
                  typography.bodyMedium,
                  {
                    color: colors.onPrimaryContainer,
                    textAlign: 'center',
                    marginTop: spacing.small,
                  },
                ]}>
                Great job! Your session has been saved.
              </Text>
            </Card>

            <Button onPress={resetForNewWorkout} fullWidth>
              Start New Workout
            </Button>
          </View>
        )}

        {/* Error State */}
        {workoutState.type === 'error' && (
          <Card
            style={{
              backgroundColor: colors.errorContainer,
              padding: spacing.large,
            }}>
            <Text
              style={[
                typography.titleMedium,
                {color: colors.onErrorContainer, fontWeight: 'bold'},
              ]}>
              ❌ Error
            </Text>
            <Text
              style={[
                typography.bodyMedium,
                {color: colors.onErrorContainer, marginTop: spacing.small},
              ]}>
              {workoutState.message}
            </Text>
          </Card>
        )}
      </ScrollView>

      {/* Exit Confirmation Dialog */}
      <AlertDialog
        visible={showExitConfirmation}
        onDismiss={() => setShowExitConfirmation(false)}
        title="Exit Workout?"
        message="The workout is currently active. Are you sure you want to exit? Your progress will be saved."
        confirmText="Exit"
        cancelText="Cancel"
        onConfirm={handleExitWorkout}
        onCancel={() => setShowExitConfirmation(false)}
        testID={testID ? `${testID}-exit-dialog` : undefined}
      />

      {/* Auto-connecting Overlay */}
      <ConnectingOverlay
        visible={isAutoConnecting}
        testID={testID ? `${testID}-connecting` : undefined}
      />

      {/* Connection Error Dialog */}
      {connectionError && (
        <ConnectionErrorDialog
          visible={true}
          message={connectionError}
          onDismiss={clearConnectionError}
          testID={testID ? `${testID}-error` : undefined}
        />
      )}

      {/* PR Celebration Dialog */}
      {showPRCelebration && prDetails && (
        <Modal
          visible={true}
          onDismiss={() => setShowPRCelebration(false)}
          title="🎉 New Personal Record!"
          variant="center"
          testID={testID ? `${testID}-pr` : undefined}
          footer={
            <Button
              onPress={() => setShowPRCelebration(false)}
              fullWidth>
              Awesome!
            </Button>
          }>
          <View style={{gap: spacing.medium, alignItems: 'center'}}>
            <Text style={{fontSize: 64, textAlign: 'center'}}>🏆</Text>
            <Text
              style={[
                typography.headlineSmall,
                {
                  color: colors.primary,
                  fontWeight: 'bold',
                  textAlign: 'center',
                },
              ]}>
              {prDetails.exerciseName}
            </Text>
            <Text
              style={[
                typography.titleLarge,
                {color: colors.onSurface, textAlign: 'center'},
              ]}>
              {prDetails.weight} × {prDetails.reps} reps
            </Text>
            <Text
              style={[
                typography.bodyMedium,
                {color: colors.onSurfaceVariant, textAlign: 'center'},
              ]}>
              You've just set a new personal record! Keep up the amazing work!
            </Text>
          </View>
        </Modal>
      )}
    </View>
  );
};
