/**
 * LoadingSpinner Component
 * Displays a loading indicator with optional text
 * Reusable React Native component
 */

import React from 'react';
import {View, ActivityIndicator, Text, StyleSheet, ViewStyle} from 'react-native';
import {useColors, useTypography, useSpacing} from '../theme';

export interface LoadingSpinnerProps {
  size?: 'small' | 'large' | number;
  text?: string;
  color?: string;
  fullScreen?: boolean;
  style?: ViewStyle;
  testID?: string;
}

/**
 * Loading spinner with optional text
 * Can be displayed inline or fullscreen
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  text,
  color,
  fullScreen = false,
  style,
  testID,
}) => {
  const colors = useColors();
  const typography = useTypography();
  const spacing = useSpacing();

  const spinnerColor = color || colors.primary;

  const containerStyle: ViewStyle = {
    alignItems: 'center',
    justifyContent: 'center',
    ...(fullScreen && {
      flex: 1,
      backgroundColor: colors.background,
    }),
  };

  return (
    <View style={[containerStyle, style]} testID={testID}>
      <ActivityIndicator size={size} color={spinnerColor} />
      {text && (
        <Text
          style={[
            typography.bodyMedium,
            {
              color: colors.onSurfaceVariant,
              marginTop: spacing.medium,
              textAlign: 'center',
            },
          ]}>
          {text}
        </Text>
      )}
    </View>
  );
};

/**
 * Fullscreen loading overlay
 */
export const LoadingOverlay: React.FC<Omit<LoadingSpinnerProps, 'fullScreen'>> = props => (
  <LoadingSpinner {...props} fullScreen />
);
