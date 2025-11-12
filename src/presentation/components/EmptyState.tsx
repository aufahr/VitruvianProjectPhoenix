/**
 * EmptyState Component
 * Displays when lists/screens have no data
 * Migrated from Android Compose EmptyState
 */

import React from 'react';
import {View, Text, StyleSheet, ViewStyle} from 'react-native';
import {useColors, useTypography, useSpacing} from '../theme';
import {Button} from './Button';

export interface EmptyStateProps {
  icon?: string | React.ReactNode;
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
  style?: ViewStyle;
  testID?: string;
}

/**
 * Reusable empty state component for displaying when lists/screens have no data
 * Follows Material Design 3 principles and uses theme colors for consistent styling
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '🏋️',
  title,
  message,
  actionText,
  onAction,
  style,
  testID,
}) => {
  const colors = useColors();
  const typography = useTypography();
  const spacing = useSpacing();

  return (
    <View
      style={[
        {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing.large,
        },
        style,
      ]}
      testID={testID}>
      <View
        style={{
          alignItems: 'center',
          gap: spacing.medium,
        }}>
        {/* Icon */}
        {typeof icon === 'string' ? (
          <Text
            style={{
              fontSize: 64,
              opacity: 0.6,
            }}
            accessibilityLabel="Empty state icon">
            {icon}
          </Text>
        ) : (
          <View style={{opacity: 0.6}}>{icon}</View>
        )}

        {/* Title */}
        <Text
          style={[
            typography.titleLarge,
            {
              color: colors.onSurface,
              fontWeight: 'bold',
              textAlign: 'center',
            },
          ]}>
          {title}
        </Text>

        {/* Message */}
        <Text
          style={[
            typography.bodyMedium,
            {
              color: colors.onSurfaceVariant,
              textAlign: 'center',
              paddingHorizontal: spacing.large,
            },
          ]}>
          {message}
        </Text>

        {/* Optional Action Button */}
        {actionText && onAction && (
          <Button onPress={onAction} style={{marginTop: spacing.medium}}>
            {actionText}
          </Button>
        )}
      </View>
    </View>
  );
};
