/**
 * CountdownTimer Component
 * Displays a countdown before workout starts
 * Migrated from Android Compose CountdownCard
 */

import React, {useEffect, useRef} from 'react';
import {View, Text, Animated, StyleSheet} from 'react-native';
import {useColors, useTypography, useSpacing} from '../theme';

export interface CountdownTimerProps {
  secondsRemaining: number;
  onComplete?: () => void;
  testID?: string;
}

/**
 * Countdown timer with pulsing animation
 * Shows "Get Ready!" message and large animated countdown number
 */
export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  secondsRemaining,
  onComplete,
  testID,
}) => {
  const colors = useColors();
  const typography = useTypography();
  const spacing = useSpacing();

  // Pulsing animation
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Create pulsing animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();

    return () => pulse.stop();
  }, []);

  useEffect(() => {
    if (secondsRemaining === 0 && onComplete) {
      onComplete();
    }
  }, [secondsRemaining, onComplete]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        padding: spacing.large,
        justifyContent: 'center',
        alignItems: 'center',
      }}
      testID={testID}>
      <Text
        style={[
          typography.titleLarge,
          {
            color: colors.onSurfaceVariant,
            marginBottom: spacing.medium,
          },
        ]}>
        Get Ready!
      </Text>

      {/* Huge gradient number with pulsing animation */}
      <Animated.View style={{transform: [{scale: pulseAnim}]}}>
        <Text
          style={[
            typography.displayLarge,
            {
              fontSize: 96,
              fontWeight: '800',
              color: colors.primary,
            },
          ]}>
          {secondsRemaining}
        </Text>
      </Animated.View>

      <Text
        style={[
          typography.titleMedium,
          {
            color: colors.onSurface,
            marginTop: spacing.medium,
          },
        ]}>
        Starting in...
      </Text>
    </View>
  );
};
