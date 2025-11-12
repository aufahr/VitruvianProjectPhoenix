/**
 * Card Component
 * Reusable React Native card container with elevation and border support
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {useColors, useSpacing} from '../theme';

export interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  elevation?: number;
  borderWidth?: number;
  borderRadius?: number;
  variant?: 'elevated' | 'outlined' | 'filled';
  accessibilityLabel?: string;
  testID?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  elevation = 2,
  borderWidth = 0,
  borderRadius = 12,
  variant = 'elevated',
  accessibilityLabel,
  testID,
}) => {
  const colors = useColors();
  const spacing = useSpacing();

  const cardStyle: ViewStyle = {
    backgroundColor: colors.surface,
    borderRadius,
    ...getElevationStyle(elevation),
    ...(borderWidth > 0 && {
      borderWidth,
      borderColor: colors.outline,
    }),
    ...(variant === 'filled' && {
      backgroundColor: colors.surfaceVariant,
    }),
  };

  const containerStyle = [cardStyle, style];

  if (onPress) {
    return (
      <TouchableOpacity
        style={containerStyle}
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        testID={testID}>
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={containerStyle}
      accessibilityLabel={accessibilityLabel}
      testID={testID}>
      {children}
    </View>
  );
};

/**
 * Helper function to generate elevation shadow styles
 * iOS and Android have different shadow properties
 */
const getElevationStyle = (elevation: number): ViewStyle => {
  if (Platform.OS === 'ios') {
    return {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: elevation / 2,
      },
      shadowOpacity: 0.2 + elevation * 0.02,
      shadowRadius: elevation,
    };
  }

  return {
    elevation,
  };
};
