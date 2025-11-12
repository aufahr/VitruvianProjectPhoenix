/**
 * RestTimer Component
 * Displays during rest periods between sets/exercises in autoplay mode
 * Reusable React Native component
 */

import React, {useRef, useEffect} from 'react';
import {View, Text, Animated, StyleSheet, ScrollView} from 'react-native';
import {useColors, useTypography, useSpacing} from '../theme';
import {Button, TextButton} from './Button';
import {Card} from './Card';

export interface RestTimerProps {
  restSecondsRemaining: number;
  nextExerciseName: string;
  isLastExercise: boolean;
  currentSet: number;
  totalSets: number;
  nextExerciseWeight?: number;
  nextExerciseReps?: number;
  nextExerciseMode?: string;
  currentExerciseIndex?: number;
  totalExercises?: number;
  formatWeight?: (weight: number) => string;
  onSkipRest: () => void;
  onEndWorkout: () => void;
  testID?: string;
}

/**
 * Rest Timer Card Component
 * Shows countdown timer, next exercise info, and action buttons
 */
export const RestTimer: React.FC<RestTimerProps> = ({
  restSecondsRemaining,
  nextExerciseName,
  isLastExercise,
  currentSet,
  totalSets,
  nextExerciseWeight,
  nextExerciseReps,
  nextExerciseMode,
  currentExerciseIndex,
  totalExercises,
  formatWeight,
  onSkipRest,
  onEndWorkout,
  testID,
}) => {
  const colors = useColors();
  const typography = useTypography();
  const spacing = useSpacing();

  // Subtle pulsing animation
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();

    return () => pulse.stop();
  }, []);

  const formatRestTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <ScrollView
      style={{flex: 1, backgroundColor: colors.background}}
      contentContainerStyle={{
        flexGrow: 1,
        padding: spacing.large,
        justifyContent: 'space-between',
      }}
      testID={testID}>
      <View style={{flex: 1, justifyContent: 'space-between'}}>
        {/* REST TIME Header */}
        <Text
          style={[
            typography.labelLarge,
            {
              color: colors.onSurfaceVariant,
              fontWeight: 'bold',
              letterSpacing: 1.5,
              textAlign: 'center',
              marginTop: spacing.small,
            },
          ]}>
          REST TIME
        </Text>

        {/* Immersive circular timer */}
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          {/* Outer gradient halo */}
          <Animated.View
            style={{
              position: 'absolute',
              width: 260,
              height: 260,
              borderRadius: 130,
              backgroundColor: `${colors.primary}40`,
              transform: [{scale: pulseAnim}],
            }}
          />

          {/* Timer circle */}
          <Card
            style={{
              width: 220,
              height: 220,
              borderRadius: 110,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: colors.outline,
            }}
            elevation={8}>
            <Text
              style={[
                typography.displayLarge,
                {
                  color: colors.primary,
                  fontWeight: 'bold',
                },
              ]}>
              {formatRestTime(restSecondsRemaining)}
            </Text>
          </Card>
        </View>

        {/* UP NEXT section */}
        <View style={{gap: spacing.small, alignItems: 'center'}}>
          <Text
            style={[
              typography.labelMedium,
              {
                color: colors.onSurfaceVariant,
                fontWeight: 'bold',
                letterSpacing: 1.2,
              },
            ]}>
            UP NEXT
          </Text>

          <Text
            style={[
              typography.titleLarge,
              {
                color: isLastExercise ? colors.primary : colors.onSurface,
                fontWeight: 'bold',
                textAlign: 'center',
              },
            ]}>
            {isLastExercise ? 'Workout Complete' : nextExerciseName}
          </Text>

          {!isLastExercise && (
            <Text
              style={[
                typography.bodyMedium,
                {color: colors.onSurfaceVariant},
              ]}>
              Set {currentSet} of {totalSets}
            </Text>
          )}

          {/* Workout parameters preview */}
          {!isLastExercise &&
            (nextExerciseWeight || nextExerciseReps || nextExerciseMode) && (
              <Card
                style={{
                  width: '100%',
                  marginTop: spacing.small,
                  backgroundColor: colors.surfaceVariant,
                }}>
                <View style={{padding: spacing.medium, gap: spacing.small}}>
                  <Text
                    style={[
                      typography.labelSmall,
                      {
                        color: colors.onSurfaceVariant,
                        fontWeight: 'bold',
                        letterSpacing: 1,
                      },
                    ]}>
                    WORKOUT PARAMETERS
                  </Text>

                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-evenly',
                    }}>
                    {nextExerciseWeight && formatWeight && (
                      <WorkoutParamItem
                        icon="⚙️"
                        label="Weight"
                        value={formatWeight(nextExerciseWeight)}
                      />
                    )}
                    {nextExerciseReps && (
                      <WorkoutParamItem
                        icon="🔄"
                        label="Target Reps"
                        value={nextExerciseReps.toString()}
                      />
                    )}
                    {nextExerciseMode && (
                      <WorkoutParamItem
                        icon="⚙️"
                        label="Mode"
                        value={nextExerciseMode.substring(0, 8)}
                      />
                    )}
                  </View>
                </View>
              </Card>
            )}

          {/* Progress through routine */}
          {currentExerciseIndex !== undefined &&
            totalExercises !== undefined &&
            totalExercises > 1 && (
              <View style={{width: '100%', gap: spacing.extraSmall, marginTop: spacing.small}}>
                <Text
                  style={[
                    typography.labelMedium,
                    {color: colors.onSurfaceVariant, textAlign: 'center'},
                  ]}>
                  Exercise {currentExerciseIndex + 1} of {totalExercises}
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
                      width: `${((currentExerciseIndex + 1) / totalExercises) * 100}%`,
                      backgroundColor: colors.primary,
                    }}
                  />
                </View>
              </View>
            )}
        </View>

        {/* Action buttons */}
        <View style={{gap: spacing.small, marginTop: spacing.large}}>
          <Button onPress={onSkipRest} fullWidth>
            {isLastExercise ? 'Continue' : 'Skip Rest'}
          </Button>

          <TextButton onPress={onEndWorkout} fullWidth>
            <Text style={{color: colors.error}}>End Workout</Text>
          </TextButton>
        </View>
      </View>
    </ScrollView>
  );
};

/**
 * Workout parameter item component
 */
const WorkoutParamItem: React.FC<{
  icon: string;
  label: string;
  value: string;
}> = ({icon, label, value}) => {
  const colors = useColors();
  const typography = useTypography();

  return (
    <View style={{alignItems: 'center', gap: 4}}>
      <Text style={{fontSize: 20}}>{icon}</Text>
      <Text
        style={[
          typography.titleSmall,
          {color: colors.onSurface, fontWeight: 'bold'},
        ]}>
        {value}
      </Text>
      <Text style={[typography.bodySmall, {color: colors.onSurfaceVariant}]}>
        {label}
      </Text>
    </View>
  );
};
