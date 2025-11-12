/**
 * WorkoutMetricsDisplay Component
 * Displays workout metrics in a grid layout
 * Combines multiple StatsCard components for workout summary
 */

import React from 'react';
import {View, StyleSheet, ViewStyle} from 'react-native';
import {useSpacing} from '../theme';
import {StatsCard} from './StatsCard';

export interface WorkoutMetric {
  label: string;
  value: string;
  icon?: string | React.ReactNode;
  iconColor?: string;
  onPress?: () => void;
}

export interface WorkoutMetricsDisplayProps {
  metrics: WorkoutMetric[];
  columns?: 2 | 3 | 4;
  style?: ViewStyle;
  testID?: string;
}

/**
 * Workout metrics display component
 * Shows multiple stats in a responsive grid layout
 */
export const WorkoutMetricsDisplay: React.FC<WorkoutMetricsDisplayProps> = ({
  metrics,
  columns = 3,
  style,
  testID,
}) => {
  const spacing = useSpacing();

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: spacing.small,
        },
        style,
      ]}
      testID={testID}>
      {metrics.map((metric, index) => (
        <View
          key={index}
          style={{
            width: `${100 / columns - 2}%`,
            minWidth: 100,
          }}>
          <StatsCard
            label={metric.label}
            value={metric.value}
            icon={metric.icon}
            iconColor={metric.iconColor}
            onPress={metric.onPress}
          />
        </View>
      ))}
    </View>
  );
};

/**
 * Predefined workout summary metrics
 */
export const createWorkoutSummaryMetrics = (
  totalSets: number,
  totalReps: number,
  totalWeight: number,
  duration: number,
  formatWeight?: (weight: number) => string
): WorkoutMetric[] => {
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return [
    {
      label: 'Total Sets',
      value: totalSets.toString(),
      icon: '🎯',
      iconColor: '#9333EA',
    },
    {
      label: 'Total Reps',
      value: totalReps.toString(),
      icon: '🔄',
      iconColor: '#3B82F6',
    },
    {
      label: 'Total Volume',
      value: formatWeight ? formatWeight(totalWeight) : `${totalWeight}kg`,
      icon: '⚡',
      iconColor: '#10B981',
    },
    {
      label: 'Duration',
      value: formatDuration(duration),
      icon: '⏱️',
      iconColor: '#F59E0B',
    },
  ];
};
