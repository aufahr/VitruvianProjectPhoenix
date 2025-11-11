/**
 * StatsCard Component
 * Compact stats card displaying icon, value, and label
 * Migrated from Android Compose StatsCard
 */

import React from 'react';
import {View, Text, StyleSheet, ViewStyle} from 'react-native';
import {useColors, useTypography, useSpacing} from '../theme';
import {Card} from './Card';

export interface StatsCardProps {
  label: string;
  value: string;
  icon?: string | React.ReactNode;
  iconColor?: string;
  onPress?: () => void;
  style?: ViewStyle;
  testID?: string;
}

/**
 * Compact stats card matching reference design:
 * - Icon on top (20px)
 * - Value below in large text
 * - Label at bottom in small text
 */
export const StatsCard: React.FC<StatsCardProps> = ({
  label,
  value,
  icon,
  iconColor,
  onPress,
  style,
  testID,
}) => {
  const colors = useColors();
  const typography = useTypography();
  const spacing = useSpacing();

  const effectiveIconColor = iconColor || colors.primary;

  return (
    <Card
      onPress={onPress}
      style={{
        borderWidth: 1,
        borderColor: colors.surfaceVariant,
        ...style,
      }}
      elevation={2}
      testID={testID}>
      <View
        style={{
          padding: 14,
          gap: 4,
        }}>
        {/* Icon */}
        {icon && (
          <View style={{height: 20, width: 20}}>
            {typeof icon === 'string' ? (
              <Text
                style={{
                  fontSize: 20,
                  color: effectiveIconColor,
                }}>
                {icon}
              </Text>
            ) : (
              icon
            )}
          </View>
        )}

        {/* Value */}
        <Text
          style={[
            typography.titleMedium,
            {
              color: colors.onSurface,
              fontWeight: 'bold',
            },
          ]}>
          {value}
        </Text>

        {/* Label */}
        <Text
          style={[
            typography.bodySmall,
            {
              color: colors.onSurfaceVariant,
            },
          ]}>
          {label}
        </Text>
      </View>
    </Card>
  );
};
