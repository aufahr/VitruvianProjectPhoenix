/**
 * ExerciseCard Component
 * Displays exercise information in a card format
 * Reusable React Native component
 */

import React from 'react';
import {View, Text, Image, StyleSheet, ViewStyle} from 'react-native';
import {useColors, useTypography, useSpacing} from '../theme';
import {Card} from './Card';

export interface ExerciseCardProps {
  name: string;
  muscleGroups?: string;
  equipment?: string;
  sets?: number;
  reps?: number;
  weight?: number;
  thumbnailUrl?: string;
  isFavorite?: boolean;
  timesPerformed?: number;
  onPress?: () => void;
  onFavoritePress?: () => void;
  showPerformanceCount?: boolean;
  style?: ViewStyle;
  testID?: string;
}

/**
 * Exercise card component for displaying exercise information
 * Supports thumbnail, favorite status, and performance tracking
 */
export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  name,
  muscleGroups,
  equipment,
  sets,
  reps,
  weight,
  thumbnailUrl,
  isFavorite = false,
  timesPerformed = 0,
  onPress,
  onFavoritePress,
  showPerformanceCount = false,
  style,
  testID,
}) => {
  const colors = useColors();
  const typography = useTypography();
  const spacing = useSpacing();

  const formatMuscleGroups = (groups?: string): string => {
    if (!groups) return '';
    return groups
      .split(',')
      .map(g => g.trim().toLowerCase().replace(/^\w/, c => c.toUpperCase()))
      .join(', ');
  };

  return (
    <Card
      onPress={onPress}
      style={{
        marginBottom: spacing.small,
        ...style
      }}
      testID={testID}>
      <View
        style={{
          flexDirection: 'row',
          padding: spacing.medium,
          gap: spacing.medium,
        }}>
        {/* Thumbnail or Initial */}
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 8,
            backgroundColor: thumbnailUrl ? colors.surfaceVariant : colors.primaryContainer,
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
          }}>
          {thumbnailUrl ? (
            <Image
              source={{uri: thumbnailUrl}}
              style={{width: '100%', height: '100%'}}
              resizeMode="cover"
            />
          ) : (
            <Text
              style={[
                typography.titleLarge,
                {color: colors.onPrimaryContainer},
              ]}>
              {name.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>

        {/* Content */}
        <View style={{flex: 1, justifyContent: 'center'}}>
          <Text
            style={[
              typography.titleMedium,
              {color: colors.onSurface, fontWeight: 'bold'},
            ]}>
            {name}
          </Text>

          {muscleGroups && (
            <Text
              style={[typography.bodySmall, {color: colors.onSurfaceVariant}]}>
              Muscle Group: {formatMuscleGroups(muscleGroups)}
            </Text>
          )}

          {equipment && (
            <Text
              style={[typography.bodySmall, {color: colors.onSurfaceVariant}]}>
              Equipment: {equipment}
            </Text>
          )}

          {(sets || reps || weight) && (
            <Text
              style={[
                typography.bodySmall,
                {color: colors.primary, marginTop: spacing.extraSmall},
              ]}>
              {sets && `${sets} sets`}
              {reps && ` • ${reps} reps`}
              {weight && ` • ${weight}kg`}
            </Text>
          )}
        </View>

        {/* Trailing content */}
        <View style={{justifyContent: 'center', alignItems: 'center', gap: spacing.small}}>
          {showPerformanceCount && timesPerformed > 0 && (
            <View
              style={{
                backgroundColor: colors.primaryContainer,
                paddingHorizontal: spacing.small,
                paddingVertical: spacing.extraSmall,
                borderRadius: 4,
              }}>
              <Text
                style={[
                  typography.labelSmall,
                  {color: colors.onPrimaryContainer},
                ]}>
                {timesPerformed}x
              </Text>
            </View>
          )}

          {onFavoritePress && (
            <Text
              style={{fontSize: 24}}
              onPress={onFavoritePress}
              accessibilityRole="button"
              accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
              {isFavorite ? '⭐' : '☆'}
            </Text>
          )}
        </View>
      </View>
    </Card>
  );
};
