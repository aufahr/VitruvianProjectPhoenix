/**
 * JustLiftScreen - Quick workout configuration for React Native
 * Migrated from Android Compose JustLiftScreen.kt
 *
 * Features:
 * - Minimal configuration for quick workouts
 * - Handle detection UI (grab handles to start)
 * - Auto-start when handles grabbed
 * - Auto-stop after 3 seconds in danger zone
 * - Display real-time metrics (load, position, reps)
 * - Uses workout session hook
 * - Uses BLE connection hook
 * - Shows countdown before starting
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ViewStyle,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useColors, useTypography, useSpacing, useIsDark } from '../theme';
import { useWorkoutSession } from '../hooks/useWorkoutSession';
import { useBleConnection } from '../hooks/useBleConnection';
import { Card } from '../components/Card';
import { Button, TextButton } from '../components/Button';
import { ConnectingOverlay } from '../components/ConnectingOverlay';
import { ConnectionErrorDialog } from '../components/ConnectionErrorDialog';
import { RootStackParamList } from '../navigation/types';

import {
  WorkoutMode,
  WorkoutModeConstants,
  WorkoutState,
  EccentricLoad,
  EchoLevel,
  EccentricLoadDisplay,
  EchoLevelDisplay,
  WeightUnit,
  WorkoutMetric,
  RepCount,
  HandleState,
  workoutModeToWorkoutType,
} from '../../domain/models/Models';

type NavigationProp = StackNavigationProp<RootStackParamList, 'JustLift'>;

/**
 * Main JustLiftScreen component
 */
export const JustLiftScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const colors = useColors();
  const typography = useTypography();
  const spacing = useSpacing();
  const isDark = useIsDark();

  // Hooks
  const {
    workoutState,
    workoutParameters,
    repCount,
    autoStopState,
    autoStartCountdown,
    updateWorkoutParameters,
    stopWorkout,
  } = useWorkoutSession();

  const {
    connectionState,
    currentMetric,
    handleState,
    isAutoConnecting,
    connectionError,
    clearConnectionError,
    enableHandleDetection,
  } = useBleConnection();

  // Local state for configuration
  const [selectedMode, setSelectedMode] = useState<WorkoutMode>(WorkoutModeConstants.OldSchool);
  const [weightPerCable, setWeightPerCable] = useState<number>(10);
  const [weightChangePerRep, setWeightChangePerRep] = useState<number>(0);
  const [eccentricLoad, setEccentricLoad] = useState<EccentricLoad>(EccentricLoad.LOAD_100);
  const [echoLevel, setEchoLevel] = useState<EchoLevel>(EchoLevel.HARDER);
  const [weightUnit] = useState<WeightUnit>(WeightUnit.KG); // TODO: Get from settings

  // Enable handle detection when connected
  useEffect(() => {
    if (connectionState.type === 'connected') {
      enableHandleDetection();
    }
  }, [connectionState, enableHandleDetection]);

  // Navigate to ActiveWorkout when workout becomes active
  useEffect(() => {
    if (workoutState.type === 'active') {
      navigation.navigate('ActiveWorkout');
    }
  }, [workoutState, navigation]);

  // Update workout parameters when configuration changes
  useEffect(() => {
    const weightChangeKg =
      weightUnit === WeightUnit.LB
        ? weightChangePerRep / 2.20462
        : weightChangePerRep;

    const updatedParameters = {
      ...workoutParameters,
      workoutType: workoutModeToWorkoutType(selectedMode, eccentricLoad),
      weightPerCableKg: weightPerCable,
      progressionRegressionKg: weightChangeKg,
      isJustLift: true,
      useAutoStart: true,
    };

    updateWorkoutParameters(updatedParameters);
  }, [
    selectedMode,
    weightPerCable,
    weightChangePerRep,
    eccentricLoad,
    weightUnit,
    updateWorkoutParameters,
  ]);

  // Format weight with unit
  const formatWeight = (weight: number): string => {
    if (weightUnit === WeightUnit.LB) {
      return `${Math.round(weight * 2.20462)} lbs`;
    }
    return `${Math.round(weight)} kg`;
  };

  // Background gradient
  const backgroundGradient = isDark
    ? ['#0F172A', '#1E1B4B', '#172554'] // Dark mode
    : ['#E0E7FF', '#FCE7F3', '#DDD6FE']; // Light mode

  const isOldSchoolOrPump =
    selectedMode.type === 'oldSchool' || selectedMode.type === 'pump';
  const isEchoMode = selectedMode.type === 'echo';

  return (
    <View style={{ flex: 1, backgroundColor: backgroundGradient[0] }}>
      {/* Header */}
      <View
        style={{
          paddingTop: Platform.OS === 'ios' ? 50 : 20,
          paddingBottom: spacing.medium,
          paddingHorizontal: spacing.large,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.outlineVariant,
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ marginRight: spacing.medium }}>
            <Icon name="arrow-back" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <Text style={[typography.titleLarge, { color: colors.onSurface }]}>
            Just Lift
          </Text>
        </View>
      </View>

      {/* Main content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.large, gap: spacing.medium }}>

        {/* Auto-start/Auto-stop unified card */}
        <AutoStartStopCard
          workoutState={workoutState}
          autoStartCountdown={autoStartCountdown}
          autoStopState={autoStopState}
        />

        {/* Mode Selection Card */}
        <Card style={{ padding: spacing.medium }}>
          <Text
            style={[
              typography.titleMedium,
              { color: colors.onSurface, fontWeight: 'bold', marginBottom: spacing.small },
            ]}>
            Workout Mode
          </Text>

          <View
            style={{
              flexDirection: 'row',
              gap: spacing.small,
              marginBottom: spacing.small,
            }}>
            <FilterChip
              label="Old School"
              selected={selectedMode.type === 'oldSchool'}
              onPress={() => setSelectedMode(WorkoutModeConstants.OldSchool)}
            />
            <FilterChip
              label="Pump"
              selected={selectedMode.type === 'pump'}
              onPress={() => setSelectedMode(WorkoutModeConstants.Pump)}
            />
            <FilterChip
              label="Echo"
              selected={selectedMode.type === 'echo'}
              onPress={() => setSelectedMode(WorkoutModeConstants.Echo(echoLevel))}
            />
          </View>

          <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>
            {selectedMode.type === 'oldSchool' &&
              'Constant resistance throughout the movement.'}
            {selectedMode.type === 'pump' &&
              'Resistance increases the faster you go.'}
            {selectedMode.type === 'echo' &&
              'Adaptive resistance with echo feedback.'}
          </Text>
        </Card>

        {/* Old School & Pump: Weight per cable, Progression/Regression */}
        {isOldSchoolOrPump && (
          <>
            {/* Weight per Cable */}
            <Card style={{ padding: spacing.medium }}>
              <NumberPicker
                label="Weight per Cable"
                value={
                  weightUnit === WeightUnit.LB
                    ? Math.round(weightPerCable * 2.20462)
                    : Math.round(weightPerCable)
                }
                onValueChange={(value) => {
                  setWeightPerCable(
                    weightUnit === WeightUnit.LB ? value / 2.20462 : value
                  );
                }}
                min={1}
                max={weightUnit === WeightUnit.LB ? 220 : 100}
                suffix={weightUnit === WeightUnit.LB ? 'lbs' : 'kg'}
              />
            </Card>

            {/* Weight Change Per Rep */}
            <Card style={{ padding: spacing.medium }}>
              <NumberPicker
                label="Weight Change Per Rep"
                value={weightChangePerRep}
                onValueChange={setWeightChangePerRep}
                min={-10}
                max={10}
                suffix={weightUnit === WeightUnit.LB ? 'lbs' : 'kg'}
              />
              <Text
                style={[
                  typography.bodySmall,
                  { color: colors.onSurfaceVariant, marginTop: spacing.small },
                ]}>
                Negative = Regression, Positive = Progression
              </Text>
            </Card>
          </>
        )}

        {/* Echo Mode: Eccentric Load, Echo Level */}
        {isEchoMode && (
          <>
            {/* Eccentric Load */}
            <Card style={{ padding: spacing.medium }}>
              <Text
                style={[
                  typography.titleMedium,
                  { color: colors.onSurface, fontWeight: 'bold', marginBottom: spacing.medium },
                ]}>
                Eccentric Load: {EccentricLoadDisplay[eccentricLoad]}
              </Text>

              <EccentricLoadSlider
                value={eccentricLoad}
                onValueChange={setEccentricLoad}
              />

              <Text
                style={[
                  typography.bodySmall,
                  { color: colors.onSurfaceVariant, marginTop: spacing.small },
                ]}>
                Load percentage applied during eccentric (lowering) phase
              </Text>
            </Card>

            {/* Echo Level */}
            <Card style={{ padding: spacing.medium }}>
              <Text
                style={[
                  typography.titleMedium,
                  { color: colors.onSurface, fontWeight: 'bold', marginBottom: spacing.small },
                ]}>
                Echo Level
              </Text>

              <View style={{ flexDirection: 'row', gap: spacing.small }}>
                {Object.values(EchoLevel)
                  .filter((v) => typeof v === 'number')
                  .map((level) => (
                    <FilterChip
                      key={level}
                      label={EchoLevelDisplay[level as EchoLevel]}
                      selected={echoLevel === level}
                      onPress={() => {
                        setEchoLevel(level as EchoLevel);
                        setSelectedMode(WorkoutModeConstants.Echo(level as EchoLevel));
                      }}
                      style={{ flex: 1 }}
                    />
                  ))}
              </View>
            </Card>
          </>
        )}

        {/* Current workout status if active */}
        {workoutState.type !== 'idle' && (
          <>
            <View
              style={{
                height: 1,
                backgroundColor: colors.outlineVariant,
                marginVertical: spacing.medium,
              }}
            />
            <ActiveStatusCard
              workoutState={workoutState}
              currentMetric={currentMetric}
              repCount={repCount}
              formatWeight={formatWeight}
              onStopWorkout={stopWorkout}
            />
          </>
        )}
      </ScrollView>

      {/* Auto-connect UI overlays */}
      <ConnectingOverlay visible={isAutoConnecting} />

      {connectionError && (
        <ConnectionErrorDialog
          visible={!!connectionError}
          message={connectionError}
          onDismiss={clearConnectionError}
        />
      )}
    </View>
  );
};

/**
 * Auto-Start/Auto-Stop Card Component
 * Shows auto-start when idle, auto-stop when active
 */
interface AutoStartStopCardProps {
  workoutState: WorkoutState;
  autoStartCountdown: number | null;
  autoStopState: {
    isActive: boolean;
    progress: number;
    secondsRemaining: number;
  };
}

const AutoStartStopCard: React.FC<AutoStartStopCardProps> = ({
  workoutState,
  autoStartCountdown,
  autoStopState,
}) => {
  const colors = useColors();
  const typography = useTypography();
  const spacing = useSpacing();

  const isIdle = workoutState.type === 'idle';
  const isActive = workoutState.type === 'active';

  // Only show card when idle or active
  if (!isIdle && !isActive) {
    return null;
  }

  const containerColor =
    autoStartCountdown !== null
      ? colors.primaryContainer
      : autoStopState.isActive
      ? colors.errorContainer
      : isActive
      ? colors.surfaceVariant
      : colors.tertiaryContainer;

  const contentColor =
    autoStartCountdown !== null
      ? colors.onPrimaryContainer
      : autoStopState.isActive
      ? colors.onErrorContainer
      : isActive
      ? colors.onSurfaceVariant
      : colors.onSecondaryContainer;

  const borderColor = isIdle ? colors.tertiary : colors.outline;

  const title =
    autoStartCountdown !== null
      ? 'Starting...'
      : autoStopState.isActive
      ? `Stopping in ${autoStopState.secondsRemaining}s...`
      : isActive
      ? 'Auto-Stop Ready'
      : 'Auto-Start Ready';

  const instruction = isIdle
    ? 'Grab and hold handles briefly (~1s) to start'
    : 'Put handles down for 3 seconds to stop';

  return (
    <Card
      style={{
        backgroundColor: containerColor,
        borderWidth: 2,
        borderColor: borderColor,
      }}
      elevation={4}>
      <View
        style={{
          padding: spacing.medium,
          alignItems: 'center',
          gap: spacing.small,
        }}>
        {/* Icon and Title */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.small,
          }}>
          <Icon
            name={isIdle ? 'play-circle-filled' : 'pan-tool'}
            size={32}
            color={contentColor}
          />
          <Text
            style={[
              typography.titleLarge,
              { color: contentColor, fontWeight: 'bold' },
            ]}>
            {title}
          </Text>
        </View>

        {/* Progress indicators */}
        {autoStartCountdown !== null && (
          <View
            style={{
              width: '100%',
              height: 8,
              backgroundColor: `${colors.primary}40`,
              borderRadius: 4,
              overflow: 'hidden',
            }}>
            <Animated.View
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: colors.primary,
              }}
            />
          </View>
        )}

        {autoStopState.isActive && (
          <View
            style={{
              width: '100%',
              height: 8,
              backgroundColor: `${colors.error}40`,
              borderRadius: 4,
              overflow: 'hidden',
            }}>
            <View
              style={{
                width: `${autoStopState.progress * 100}%`,
                height: '100%',
                backgroundColor: colors.error,
              }}
            />
          </View>
        )}

        {/* Instructions */}
        <Text
          style={[
            typography.bodyMedium,
            { color: contentColor, fontWeight: '500', textAlign: 'center' },
          ]}>
          {instruction}
        </Text>
      </View>
    </Card>
  );
};

/**
 * Active Status Card Component
 * Shows current workout state with metrics
 */
interface ActiveStatusCardProps {
  workoutState: WorkoutState;
  currentMetric: WorkoutMetric | null;
  repCount: RepCount;
  formatWeight: (weight: number) => string;
  onStopWorkout: () => void;
}

const ActiveStatusCard: React.FC<ActiveStatusCardProps> = ({
  workoutState,
  currentMetric,
  repCount,
  formatWeight,
  onStopWorkout,
}) => {
  const colors = useColors();
  const typography = useTypography();
  const spacing = useSpacing();

  const getStatusText = () => {
    switch (workoutState.type) {
      case 'countdown':
        return `Get Ready: ${workoutState.secondsRemaining}s`;
      case 'active':
        return 'Workout Active';
      case 'resting':
        return `Resting: ${workoutState.restSecondsRemaining}s`;
      case 'completed':
        return 'Workout Complete';
      default:
        return 'Workout Status';
    }
  };

  return (
    <Card
      style={{ backgroundColor: colors.primaryContainer }}
      elevation={4}>
      <View style={{ padding: spacing.medium, gap: spacing.small }}>
        <Text
          style={[
            typography.titleMedium,
            { color: colors.onPrimaryContainer, fontWeight: 'bold' },
          ]}>
          {getStatusText()}
        </Text>

        {workoutState.type === 'active' && (
          <>
            <Text
              style={[
                typography.bodyLarge,
                { color: colors.onPrimaryContainer },
              ]}>
              Reps: {repCount.totalReps || 0}
            </Text>

            {currentMetric && (
              <Text
                style={[
                  typography.bodyMedium,
                  { color: colors.onPrimaryContainer },
                ]}>
                Load: {formatWeight(currentMetric.loadA + currentMetric.loadB)}
              </Text>
            )}

            <Button
              onPress={onStopWorkout}
              fullWidth
              style={{
                backgroundColor: colors.error,
                marginTop: spacing.small,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.small }}>
                <Icon name="close" size={20} color={colors.onError} />
                <Text style={{ color: colors.onError, fontWeight: 'bold' }}>
                  Stop Workout
                </Text>
              </View>
            </Button>
          </>
        )}
      </View>
    </Card>
  );
};

/**
 * FilterChip Component
 * Chip button for selecting options
 */
interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

const FilterChip: React.FC<FilterChipProps> = ({
  label,
  selected,
  onPress,
  style,
}) => {
  const colors = useColors();
  const typography = useTypography();
  const spacing = useSpacing();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.medium,
          paddingVertical: spacing.small,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: selected ? colors.primary : colors.outline,
          backgroundColor: selected ? colors.primaryContainer : 'transparent',
          gap: spacing.extraSmall,
        },
        style,
      ]}
      activeOpacity={0.7}>
      {selected && <Icon name="check" size={18} color={colors.primary} />}
      <Text
        style={[
          typography.labelLarge,
          {
            color: selected ? colors.primary : colors.onSurface,
            fontWeight: selected ? 'bold' : 'normal',
          },
        ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

/**
 * NumberPicker Component
 * Number input with increment/decrement buttons
 */
interface NumberPickerProps {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  min: number;
  max: number;
  suffix?: string;
}

const NumberPicker: React.FC<NumberPickerProps> = ({
  label,
  value,
  onValueChange,
  min,
  max,
  suffix = '',
}) => {
  const colors = useColors();
  const typography = useTypography();
  const spacing = useSpacing();

  const increment = () => {
    if (value < max) {
      onValueChange(value + 1);
    }
  };

  const decrement = () => {
    if (value > min) {
      onValueChange(value - 1);
    }
  };

  return (
    <View style={{ gap: spacing.small }}>
      <Text
        style={[
          typography.titleMedium,
          { color: colors.onSurface, fontWeight: 'bold' },
        ]}>
        {label}
      </Text>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: colors.surfaceVariant,
          borderRadius: 12,
          padding: spacing.small,
        }}>
        <TouchableOpacity
          onPress={decrement}
          disabled={value <= min}
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: value > min ? colors.primary : colors.outline,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          activeOpacity={0.7}>
          <Icon
            name="remove"
            size={24}
            color={value > min ? colors.onPrimary : colors.onSurface}
          />
        </TouchableOpacity>

        <Text
          style={[
            typography.displaySmall,
            { color: colors.onSurface, fontWeight: 'bold' },
          ]}>
          {value} {suffix}
        </Text>

        <TouchableOpacity
          onPress={increment}
          disabled={value >= max}
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: value < max ? colors.primary : colors.outline,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          activeOpacity={0.7}>
          <Icon
            name="add"
            size={24}
            color={value < max ? colors.onPrimary : colors.onSurface}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

/**
 * EccentricLoadSlider Component
 * Slider for selecting eccentric load percentage
 */
interface EccentricLoadSliderProps {
  value: EccentricLoad;
  onValueChange: (value: EccentricLoad) => void;
}

const EccentricLoadSlider: React.FC<EccentricLoadSliderProps> = ({
  value,
  onValueChange,
}) => {
  const colors = useColors();
  const spacing = useSpacing();

  const loadValues = [
    EccentricLoad.LOAD_0,
    EccentricLoad.LOAD_50,
    EccentricLoad.LOAD_75,
    EccentricLoad.LOAD_100,
    EccentricLoad.LOAD_125,
    EccentricLoad.LOAD_150,
  ];

  const currentIndex = loadValues.indexOf(value);

  return (
    <View>
      {/* Slider track */}
      <View
        style={{
          height: 4,
          backgroundColor: colors.surfaceVariant,
          borderRadius: 2,
          marginVertical: spacing.small,
        }}>
        <View
          style={{
            width: `${(currentIndex / (loadValues.length - 1)) * 100}%`,
            height: '100%',
            backgroundColor: colors.primary,
            borderRadius: 2,
          }}
        />
      </View>

      {/* Slider marks */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: spacing.small,
        }}>
        {loadValues.map((load, index) => (
          <TouchableOpacity
            key={load}
            onPress={() => onValueChange(load)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor:
                value === load ? colors.primary : colors.surfaceVariant,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            activeOpacity={0.7}>
            <Text
              style={{
                color: value === load ? colors.onPrimary : colors.onSurface,
                fontWeight: value === load ? 'bold' : 'normal',
                fontSize: 12,
              }}>
              {load}%
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default JustLiftScreen;
