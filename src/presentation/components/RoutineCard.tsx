/**
 * RoutineCard Component
 * Displays workout routine information with exercises
 * Migrated from Android Compose RoutineCard
 */

import React, {useState, useRef, useEffect} from 'react';
import {View, Text, Animated, TouchableOpacity, StyleSheet, ViewStyle} from 'react-native';
import {useColors, useTypography, useSpacing} from '../theme';
import {Card} from './Card';

export interface RoutineExercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
}

export interface RoutineCardProps {
  id: string;
  name: string;
  description?: string;
  exercises: RoutineExercise[];
  estimatedDuration?: number;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  showMenu?: boolean;
  style?: ViewStyle;
  testID?: string;
}

/**
 * Routine card component for displaying workout routines
 * Shows routine name, exercises, and estimated duration with actions
 */
export const RoutineCard: React.FC<RoutineCardProps> = ({
  id,
  name,
  description,
  exercises,
  estimatedDuration,
  onPress,
  onEdit,
  onDelete,
  onDuplicate,
  showMenu = true,
  style,
  testID,
}) => {
  const colors = useColors();
  const typography = useTypography();
  const spacing = useSpacing();
  const [menuVisible, setMenuVisible] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isPressed ? 0.99 : 1,
      useNativeDriver: true,
      damping: 12,
      stiffness: 400,
    }).start();
  }, [isPressed]);

  const formatSetReps = (exercise: RoutineExercise): string => {
    return `${exercise.sets} × ${exercise.reps}`;
  };

  const formatEstimatedDuration = (minutes?: number): string => {
    if (!minutes) return 'Duration unknown';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `~${hours}h ${mins}m`;
    }
    return `~${mins}m`;
  };

  const exercisesToShow = exercises.slice(0, 4);
  const remainingCount = Math.max(0, exercises.length - exercisesToShow.length);

  return (
    <Animated.View style={[{transform: [{scale: scaleAnim}]}, style]}>
      <Card
        onPress={onPress}
        style={{marginBottom: spacing.small}}
        elevation={isPressed ? 2 : 4}
        testID={testID}>
        <View style={{position: 'relative'}}>
          <View
            style={{
              flexDirection: 'row',
              padding: spacing.medium,
              gap: spacing.medium,
            }}>
            {/* Gradient Icon */}
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 12,
                backgroundColor: colors.primary,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Text style={{fontSize: 32}}>🏋️</Text>
            </View>

            {/* Content Column */}
            <View style={{flex: 1, gap: spacing.extraSmall}}>
              <Text
                style={[
                  typography.titleMedium,
                  {color: colors.onSurface, fontWeight: 'bold'},
                ]}>
                {name}
              </Text>

              <Text style={[typography.bodySmall, {color: colors.onSurfaceVariant}]}>
                {description || `${exercises.length} exercises`}
              </Text>

              {/* Exercise list preview */}
              <View style={{gap: 2, marginTop: spacing.extraSmall}}>
                {exercisesToShow.map(exercise => (
                  <Text
                    key={exercise.id}
                    style={[typography.labelSmall, {color: colors.onSurfaceVariant}]}>
                    {exercise.name} - {formatSetReps(exercise)}
                  </Text>
                ))}
                {remainingCount > 0 && (
                  <Text
                    style={[
                      typography.labelSmall,
                      {color: colors.primary, fontWeight: '500'},
                    ]}>
                    + {remainingCount} more
                  </Text>
                )}
              </View>

              <Text style={[typography.bodySmall, {color: colors.primary}]}>
                {exercises.length} exercises • {formatEstimatedDuration(estimatedDuration)}
              </Text>
            </View>

            {/* Arrow Icon */}
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: `${colors.primary}20`,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Text style={{fontSize: 16, color: colors.primary}}>→</Text>
            </View>
          </View>

          {/* Overflow menu */}
          {showMenu && (onEdit || onDelete || onDuplicate) && (
            <View style={{position: 'absolute', top: 0, right: 0}}>
              <TouchableOpacity
                onPress={() => setMenuVisible(!menuVisible)}
                style={{padding: spacing.small}}
                accessibilityRole="button"
                accessibilityLabel="More options">
                <Text style={{fontSize: 24, color: colors.onSurface}}>⋮</Text>
              </TouchableOpacity>

              {/* Simple dropdown menu */}
              {menuVisible && (
                <View
                  style={{
                    position: 'absolute',
                    top: 40,
                    right: 0,
                    backgroundColor: colors.surface,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: colors.outline,
                    minWidth: 120,
                    elevation: 8,
                    shadowColor: '#000',
                    shadowOffset: {width: 0, height: 2},
                    shadowOpacity: 0.25,
                    shadowRadius: 4,
                  }}>
                  {onEdit && (
                    <TouchableOpacity
                      onPress={() => {
                        setMenuVisible(false);
                        onEdit();
                      }}
                      style={{
                        padding: spacing.medium,
                        borderBottomWidth: onDuplicate || onDelete ? 1 : 0,
                        borderBottomColor: colors.surfaceVariant,
                      }}
                      accessibilityRole="menuitem">
                      <Text style={[typography.bodyMedium, {color: colors.onSurface}]}>
                        Edit
                      </Text>
                    </TouchableOpacity>
                  )}
                  {onDuplicate && (
                    <TouchableOpacity
                      onPress={() => {
                        setMenuVisible(false);
                        onDuplicate();
                      }}
                      style={{
                        padding: spacing.medium,
                        borderBottomWidth: onDelete ? 1 : 0,
                        borderBottomColor: colors.surfaceVariant,
                      }}
                      accessibilityRole="menuitem">
                      <Text style={[typography.bodyMedium, {color: colors.onSurface}]}>
                        Duplicate
                      </Text>
                    </TouchableOpacity>
                  )}
                  {onDelete && (
                    <TouchableOpacity
                      onPress={() => {
                        setMenuVisible(false);
                        onDelete();
                      }}
                      style={{padding: spacing.medium}}
                      accessibilityRole="menuitem">
                      <Text style={[typography.bodyMedium, {color: colors.error}]}>
                        Delete
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )}
        </View>
      </Card>
    </Animated.View>
  );
};
