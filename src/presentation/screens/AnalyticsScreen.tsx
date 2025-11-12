/**
 * AnalyticsScreen - Analytics and workout tracking screen
 * Migrated from Android Compose AnalyticsScreen.kt
 *
 * Features:
 * - Three tabs: History, Personal Bests, Trends
 * - Workout statistics (total workouts, streak, volume)
 * - Charts for workout trends (using react-native-chart-kit)
 * - Personal records list with muscle group distribution
 * - Recent workout history with delete functionality
 * - PR progression tracking with charts
 */

import React, {useState, useEffect, useMemo, useCallback} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {LineChart, BarChart} from 'react-native-chart-kit';

import {useColors, useTypography, useSpacing, useIsDark} from '../theme';
import {useWorkoutHistory} from '../hooks/useWorkoutHistory';
import {usePersonalRecords} from '../hooks/usePersonalRecords';
import {Card} from '../components/Card';
import {StatsCard} from '../components/StatsCard';
import {EmptyState} from '../components/EmptyState';
import {getExerciseRepository} from '../../data/repository/ExerciseRepository';
import {PersonalRecordEntity} from '../../data/local/entities';
import {WorkoutSession} from '../../domain/models/Models';

const SCREEN_WIDTH = Dimensions.get('window').width;

/**
 * Tab configuration
 */
type TabType = 'history' | 'personalBests' | 'trends';

interface TabConfig {
  id: TabType;
  label: string;
  icon: string;
}

const TABS: TabConfig[] = [
  {id: 'history', label: 'History', icon: 'list'},
  {id: 'personalBests', label: 'Personal Bests', icon: 'star'},
  {id: 'trends', label: 'Trends', icon: 'show-chart'},
];

/**
 * AnalyticsScreen Component
 */
export const AnalyticsScreen: React.FC = () => {
  const colors = useColors();
  const typography = useTypography();
  const spacing = useSpacing();
  const isDark = useIsDark();

  // State
  const [selectedTab, setSelectedTab] = useState<TabType>('history');

  // Hooks
  const {
    workoutHistory,
    allSessions,
    workoutStats,
    isLoading: historyLoading,
    deleteWorkout,
    refresh: refreshHistory,
  } = useWorkoutHistory();

  const {
    allPRs,
    isLoading: prsLoading,
    refresh: refreshPRs,
  } = usePersonalRecords();

  /**
   * Background gradient colors based on theme
   */
  const backgroundGradientColors = isDark
    ? ['#0F172A', '#1E1B4B', '#172554']
    : ['#E0E7FF', '#FCE7F3', '#DDD6FE'];

  /**
   * Render tab content based on selected tab
   */
  const renderTabContent = () => {
    switch (selectedTab) {
      case 'history':
        return (
          <HistoryTab
            workoutHistory={workoutHistory}
            onDeleteWorkout={deleteWorkout}
            onRefresh={refreshHistory}
          />
        );
      case 'personalBests':
        return <PersonalBestsTab personalRecords={allPRs} />;
      case 'trends':
        return (
          <TrendsTab
            personalRecords={allPRs}
            allSessions={allSessions}
            workoutStats={workoutStats}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View
      style={[
        styles.container,
        {backgroundColor: backgroundGradientColors[0]},
      ]}>
      {/* Gradient background layers */}
      <View
        style={[
          styles.gradientLayer,
          {backgroundColor: backgroundGradientColors[1]},
        ]}
      />
      <View
        style={[
          styles.gradientLayer,
          {backgroundColor: backgroundGradientColors[2]},
        ]}
      />

      {/* Tab Row */}
      <View style={[styles.tabRow, {backgroundColor: colors.surface}]}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={styles.tabButton}
            onPress={() => setSelectedTab(tab.id)}
            activeOpacity={0.7}>
            <View style={styles.tabContent}>
              <Icon
                name={tab.icon}
                size={20}
                color={
                  selectedTab === tab.id ? colors.primary : colors.onSurface
                }
              />
              <Text
                style={[
                  typography.bodyMedium,
                  {
                    color:
                      selectedTab === tab.id ? colors.primary : colors.onSurface,
                    marginTop: spacing.extraSmall,
                  },
                ]}>
                {tab.label}
              </Text>
            </View>
            {/* Tab indicator */}
            {selectedTab === tab.id && (
              <View
                style={[
                  styles.tabIndicator,
                  {backgroundColor: colors.primary},
                ]}
              />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, {padding: spacing.medium}]}
        showsVerticalScrollIndicator={false}>
        {renderTabContent()}

        {/* Bottom spacing */}
        <View style={{height: spacing.extraLarge}} />
      </ScrollView>
    </View>
  );
};

/**
 * History Tab - Shows recent workout history
 */
interface HistoryTabProps {
  workoutHistory: WorkoutSession[];
  onDeleteWorkout: (sessionId: string) => void;
  onRefresh: () => void;
}

const HistoryTab: React.FC<HistoryTabProps> = ({
  workoutHistory,
  onDeleteWorkout,
  onRefresh,
}) => {
  const colors = useColors();
  const typography = useTypography();
  const spacing = useSpacing();
  const exerciseRepo = getExerciseRepository();

  // Exercise name cache
  const [exerciseNames, setExerciseNames] = useState<Record<string, string>>(
    {}
  );

  // Load exercise names
  useEffect(() => {
    const loadExerciseNames = async () => {
      const names: Record<string, string> = {};
      for (const session of workoutHistory) {
        if (session.exerciseId && !exerciseNames[session.exerciseId]) {
          try {
            const exercise = await exerciseRepo.getExerciseById(
              session.exerciseId
            );
            if (exercise) {
              names[session.exerciseId] = exercise.name;
            }
          } catch (err) {
            console.error('Failed to load exercise name:', err);
          }
        }
      }
      setExerciseNames(prev => ({...prev, ...names}));
    };

    loadExerciseNames();
  }, [workoutHistory]);

  /**
   * Handle delete workout with confirmation
   */
  const handleDelete = useCallback(
    (sessionId: string) => {
      Alert.alert(
        'Delete Workout',
        'Are you sure you want to delete this workout?',
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => onDeleteWorkout(sessionId),
          },
        ]
      );
    },
    [onDeleteWorkout]
  );

  if (workoutHistory.length === 0) {
    return (
      <EmptyState
        icon="fitness-center"
        title="No workout history"
        message="Complete workouts to see your history"
        style={{paddingTop: spacing.extraLarge}}
      />
    );
  }

  return (
    <View>
      <Text
        style={[
          typography.headlineSmall,
          {
            color: colors.onSurface,
            fontWeight: 'bold',
            marginBottom: spacing.medium,
          },
        ]}>
        Recent Workouts
      </Text>

      {workoutHistory.map((session, index) => (
        <WorkoutHistoryCard
          key={session.id || index}
          session={session}
          exerciseName={
            session.exerciseId ? exerciseNames[session.exerciseId] : null
          }
          onDelete={handleDelete}
        />
      ))}
    </View>
  );
};

/**
 * Workout History Card
 */
interface WorkoutHistoryCardProps {
  session: WorkoutSession;
  exerciseName: string | null | undefined;
  onDelete: (sessionId: string) => void;
}

const WorkoutHistoryCard: React.FC<WorkoutHistoryCardProps> = ({
  session,
  exerciseName,
  onDelete,
}) => {
  const colors = useColors();
  const typography = useTypography();
  const spacing = useSpacing();

  const date = new Date(session.timestamp || 0);
  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  const totalWeight = (session.weightPerCableKg || 0) * 2; // Both cables

  return (
    <Card
      style={{marginBottom: spacing.medium}}
      elevation={2}
      borderWidth={1}
      borderRadius={16}>
      <View style={{padding: spacing.medium}}>
        <View style={styles.historyCardHeader}>
          <View style={{flex: 1}}>
            <Text
              style={[
                typography.titleMedium,
                {color: colors.onSurface, fontWeight: 'bold'},
              ]}>
              {exerciseName || session.mode || 'Workout'}
            </Text>
            <Text
              style={[
                typography.bodySmall,
                {color: colors.onSurfaceVariant, marginTop: spacing.extraSmall},
              ]}>
              {dateStr} • {timeStr}
            </Text>
          </View>

          {/* Delete button */}
          <TouchableOpacity
            onPress={() => session.id && onDelete(session.id)}
            style={styles.deleteButton}>
            <Icon name="delete" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>

        {/* Workout stats */}
        <View style={styles.historyStatsRow}>
          <View style={styles.historyStat}>
            <Icon
              name="fitness-center"
              size={16}
              color={colors.primary}
              style={{marginRight: spacing.extraSmall}}
            />
            <Text style={[typography.bodyMedium, {color: colors.onSurface}]}>
              {totalWeight.toFixed(1)} kg
            </Text>
          </View>

          <View style={styles.historyStat}>
            <Icon
              name="repeat"
              size={16}
              color={colors.primary}
              style={{marginRight: spacing.extraSmall}}
            />
            <Text style={[typography.bodyMedium, {color: colors.onSurface}]}>
              {session.totalReps || 0} reps
            </Text>
          </View>

          {session.duration && (
            <View style={styles.historyStat}>
              <Icon
                name="timer"
                size={16}
                color={colors.primary}
                style={{marginRight: spacing.extraSmall}}
              />
              <Text style={[typography.bodyMedium, {color: colors.onSurface}]}>
                {Math.floor(session.duration / 60)}m
              </Text>
            </View>
          )}
        </View>
      </View>
    </Card>
  );
};

/**
 * Personal Bests Tab - Shows PRs grouped by exercise
 */
interface PersonalBestsTabProps {
  personalRecords: PersonalRecordEntity[];
}

const PersonalBestsTab: React.FC<PersonalBestsTabProps> = ({
  personalRecords,
}) => {
  const colors = useColors();
  const typography = useTypography();
  const spacing = useSpacing();
  const exerciseRepo = getExerciseRepository();

  // Group PRs by exercise
  const prsByExercise = useMemo(() => {
    const grouped = personalRecords.reduce((acc, pr) => {
      if (!acc[pr.exerciseId]) {
        acc[pr.exerciseId] = [];
      }
      acc[pr.exerciseId].push(pr);
      return acc;
    }, {} as Record<string, PersonalRecordEntity[]>);

    // Get best PR for each exercise
    return Object.entries(grouped)
      .map(([exerciseId, prs]) => {
        const bestPR = prs.reduce((best, current) => {
          if (current.weightPerCableKg > best.weightPerCableKg) {
            return current;
          }
          if (
            current.weightPerCableKg === best.weightPerCableKg &&
            current.reps > best.reps
          ) {
            return current;
          }
          return best;
        });
        return {exerciseId, pr: bestPR};
      })
      .sort((a, b) => b.pr.weightPerCableKg - a.pr.weightPerCableKg);
  }, [personalRecords]);

  // Exercise name cache
  const [exerciseNames, setExerciseNames] = useState<Record<string, string>>(
    {}
  );

  // Load exercise names
  useEffect(() => {
    const loadExerciseNames = async () => {
      const names: Record<string, string> = {};
      for (const {exerciseId} of prsByExercise) {
        if (!exerciseNames[exerciseId]) {
          try {
            const exercise = await exerciseRepo.getExerciseById(exerciseId);
            if (exercise) {
              names[exerciseId] = exercise.name;
            }
          } catch (err) {
            console.error('Failed to load exercise name:', err);
          }
        }
      }
      setExerciseNames(prev => ({...prev, ...names}));
    };

    loadExerciseNames();
  }, [prsByExercise]);

  if (prsByExercise.length === 0) {
    return (
      <EmptyState
        icon="⭐"
        title="No personal records yet"
        message="Complete workouts to see your PRs"
        style={{paddingTop: spacing.extraLarge}}
      />
    );
  }

  return (
    <View>
      <Text
        style={[
          typography.headlineSmall,
          {
            color: colors.onSurface,
            fontWeight: 'bold',
            marginBottom: spacing.medium,
          },
        ]}>
        Your Personal Records
      </Text>

      {prsByExercise.map(({exerciseId, pr}, index) => (
        <PersonalRecordCard
          key={exerciseId}
          rank={index + 1}
          exerciseName={exerciseNames[exerciseId] || 'Loading...'}
          pr={pr}
        />
      ))}
    </View>
  );
};

/**
 * Personal Record Card
 */
interface PersonalRecordCardProps {
  rank: number;
  exerciseName: string;
  pr: PersonalRecordEntity;
}

const PersonalRecordCard: React.FC<PersonalRecordCardProps> = ({
  rank,
  exerciseName,
  pr,
}) => {
  const colors = useColors();
  const typography = useTypography();
  const spacing = useSpacing();

  const date = new Date(pr.timestamp);
  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const rankColor =
    rank === 1
      ? colors.tertiary
      : rank <= 3
      ? colors.secondary
      : '#F5F3FF';
  const rankTextColor =
    rank === 1
      ? colors.onTertiary
      : rank <= 3
      ? colors.onSecondary
      : '#9333EA';

  return (
    <Card
      style={{marginBottom: spacing.medium}}
      elevation={4}
      borderWidth={1}
      borderRadius={16}>
      <View
        style={[
          styles.prCardContent,
          {padding: spacing.medium, gap: spacing.medium},
        ]}>
        {/* Rank badge */}
        <View style={[styles.rankBadge, {backgroundColor: rankColor}]}>
          <Text
            style={[
              typography.labelMedium,
              {color: rankTextColor, fontWeight: 'bold'},
            ]}>
            #{rank}
          </Text>
        </View>

        {/* Exercise info */}
        <View style={{flex: 1}}>
          <Text
            style={[
              typography.titleMedium,
              {color: colors.onSurface, fontWeight: 'bold'},
            ]}>
            {exerciseName}
          </Text>
          <Text
            style={[
              typography.bodyLarge,
              {color: colors.primary, marginTop: spacing.extraSmall},
            ]}>
            {pr.weightPerCableKg.toFixed(1)} kg per cable
          </Text>
          <View style={styles.prDetailsRow}>
            <Text style={[typography.bodySmall, {color: colors.onSurfaceVariant}]}>
              {pr.reps} reps
            </Text>
            <Text style={[typography.bodySmall, {color: colors.onSurfaceVariant}]}>
              {' '}
              •{' '}
            </Text>
            <Text
              style={[typography.bodySmall, {color: colors.secondary}]}>
              {pr.workoutMode}
            </Text>
            <Text style={[typography.bodySmall, {color: colors.onSurfaceVariant}]}>
              {' '}
              •{' '}
            </Text>
            <Text style={[typography.bodySmall, {color: colors.onSurfaceVariant}]}>
              {dateStr}
            </Text>
          </View>
        </View>

        {/* Star icon for #1 */}
        {rank === 1 && (
          <Icon name="star" size={32} color={colors.primary} />
        )}
      </View>
    </Card>
  );
};

/**
 * Trends Tab - Shows workout trends over time with charts
 */
interface TrendsTabProps {
  personalRecords: PersonalRecordEntity[];
  allSessions: WorkoutSession[];
  workoutStats: {
    completedWorkouts: number | null;
    workoutStreak: number | null;
    progressPercentage: number | null;
  };
}

const TrendsTab: React.FC<TrendsTabProps> = ({
  personalRecords,
  allSessions,
  workoutStats,
}) => {
  const colors = useColors();
  const typography = useTypography();
  const spacing = useSpacing();
  const isDark = useIsDark();

  // Calculate total volume (sum of all weights lifted)
  const totalVolume = useMemo(() => {
    return allSessions.reduce((sum, session) => {
      const weight = session.weightPerCableKg || 0;
      const reps = session.totalReps || 0;
      return sum + weight * 2 * reps; // Both cables
    }, 0);
  }, [allSessions]);

  // Max weight per cable
  const maxWeight = useMemo(() => {
    return personalRecords.reduce((max, pr) => {
      return Math.max(max, pr.weightPerCableKg);
    }, 0);
  }, [personalRecords]);

  // Prepare chart data - Volume over time (last 30 days)
  const volumeChartData = useMemo(() => {
    const today = Date.now();
    const thirtyDaysAgo = today - 30 * 24 * 60 * 60 * 1000;

    // Filter sessions from last 30 days
    const recentSessions = allSessions.filter(
      s => (s.timestamp || 0) >= thirtyDaysAgo
    );

    // Group by date and sum volume
    const volumeByDate: Record<string, number> = {};
    recentSessions.forEach(session => {
      const date = new Date(session.timestamp || 0);
      const dateKey = `${date.getMonth() + 1}/${date.getDate()}`;
      const volume =
        ((session.weightPerCableKg || 0) * 2 * (session.totalReps || 0));
      volumeByDate[dateKey] = (volumeByDate[dateKey] || 0) + volume;
    });

    const labels = Object.keys(volumeByDate).slice(-7); // Last 7 days
    const data = labels.map(label => volumeByDate[label] / 1000); // Convert to metric tons

    return {
      labels: labels.length > 0 ? labels : ['No data'],
      datasets: [
        {
          data: data.length > 0 ? data : [0],
          color: (opacity = 1) => `rgba(147, 51, 234, ${opacity})`, // purple-500
          strokeWidth: 2,
        },
      ],
    };
  }, [allSessions]);

  // Prepare bar chart data - Workouts per week (last 4 weeks)
  const workoutsPerWeekData = useMemo(() => {
    const today = Date.now();
    const fourWeeksAgo = today - 28 * 24 * 60 * 60 * 1000;

    // Filter sessions from last 4 weeks
    const recentSessions = allSessions.filter(
      s => (s.timestamp || 0) >= fourWeeksAgo
    );

    // Group by week
    const workoutsByWeek: Record<number, number> = {0: 0, 1: 0, 2: 0, 3: 0};
    recentSessions.forEach(session => {
      const daysAgo = Math.floor(
        (today - (session.timestamp || 0)) / (24 * 60 * 60 * 1000)
      );
      const weekIndex = Math.floor(daysAgo / 7);
      if (weekIndex >= 0 && weekIndex < 4) {
        workoutsByWeek[weekIndex] = (workoutsByWeek[weekIndex] || 0) + 1;
      }
    });

    const labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    const data = [
      workoutsByWeek[3] || 0,
      workoutsByWeek[2] || 0,
      workoutsByWeek[1] || 0,
      workoutsByWeek[0] || 0,
    ];

    return {
      labels,
      datasets: [{data}],
    };
  }, [allSessions]);

  const chartConfig = {
    backgroundColor: colors.surface,
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    decimalPlaces: 1,
    color: (opacity = 1) =>
      isDark ? `rgba(187, 134, 252, ${opacity})` : `rgba(147, 51, 234, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(${isDark ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: colors.primary,
    },
  };

  return (
    <ScrollView>
      <Text
        style={[
          typography.headlineSmall,
          {
            color: colors.onSurface,
            fontWeight: 'bold',
            marginBottom: spacing.medium,
          },
        ]}>
        Workout Trends
      </Text>

      {/* Overall stats */}
      <Card
        style={{marginBottom: spacing.medium}}
        elevation={4}
        borderWidth={1}
        borderRadius={16}>
        <View style={{padding: spacing.medium}}>
          <Text
            style={[
              typography.titleMedium,
              {
                color: colors.onSurface,
                fontWeight: 'bold',
                marginBottom: spacing.medium,
              },
            ]}>
            Overall Stats
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Icon
                name="star"
                size={24}
                color={colors.primary}
                style={{marginBottom: spacing.extraSmall}}
              />
              <Text
                style={[
                  typography.titleLarge,
                  {color: colors.onSurface, fontWeight: 'bold'},
                ]}>
                {workoutStats.completedWorkouts || 0}
              </Text>
              <Text
                style={[typography.bodySmall, {color: colors.onSurfaceVariant}]}>
                Total Workouts
              </Text>
            </View>

            <View style={styles.statItem}>
              <Icon
                name="local-fire-department"
                size={24}
                color={colors.primary}
                style={{marginBottom: spacing.extraSmall}}
              />
              <Text
                style={[
                  typography.titleLarge,
                  {color: colors.onSurface, fontWeight: 'bold'},
                ]}>
                {workoutStats.workoutStreak || 0}
              </Text>
              <Text
                style={[typography.bodySmall, {color: colors.onSurfaceVariant}]}>
                Day Streak
              </Text>
            </View>

            <View style={styles.statItem}>
              <Icon
                name="fitness-center"
                size={24}
                color={colors.primary}
                style={{marginBottom: spacing.extraSmall}}
              />
              <Text
                style={[
                  typography.titleLarge,
                  {color: colors.onSurface, fontWeight: 'bold'},
                ]}>
                {(totalVolume / 1000).toFixed(1)}t
              </Text>
              <Text
                style={[typography.bodySmall, {color: colors.onSurfaceVariant}]}>
                Total Volume
              </Text>
            </View>
          </View>
        </View>
      </Card>

      {/* Volume over time chart */}
      {allSessions.length >= 2 && (
        <Card
          style={{marginBottom: spacing.medium}}
          elevation={4}
          borderWidth={1}
          borderRadius={16}>
          <View style={{padding: spacing.medium}}>
            <View style={styles.chartHeader}>
              <Icon
                name="show-chart"
                size={24}
                color={colors.primary}
                style={{marginRight: spacing.small}}
              />
              <Text
                style={[
                  typography.titleMedium,
                  {color: colors.onSurface, fontWeight: 'bold'},
                ]}>
                Volume Over Time
              </Text>
            </View>

            <LineChart
              data={volumeChartData}
              width={SCREEN_WIDTH - spacing.medium * 4}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={{
                marginVertical: spacing.small,
                borderRadius: 16,
              }}
              yAxisLabel=""
              yAxisSuffix="t"
            />
          </View>
        </Card>
      )}

      {/* Workouts per week chart */}
      {allSessions.length >= 2 && (
        <Card
          style={{marginBottom: spacing.medium}}
          elevation={4}
          borderWidth={1}
          borderRadius={16}>
          <View style={{padding: spacing.medium}}>
            <View style={styles.chartHeader}>
              <Icon
                name="bar-chart"
                size={24}
                color={colors.primary}
                style={{marginRight: spacing.small}}
              />
              <Text
                style={[
                  typography.titleMedium,
                  {color: colors.onSurface, fontWeight: 'bold'},
                ]}>
                Workouts Per Week
              </Text>
            </View>

            <BarChart
              data={workoutsPerWeekData}
              width={SCREEN_WIDTH - spacing.medium * 4}
              height={220}
              chartConfig={chartConfig}
              style={{
                marginVertical: spacing.small,
                borderRadius: 16,
              }}
              yAxisLabel=""
              yAxisSuffix=""
              showValuesOnTopOfBars
            />
          </View>
        </Card>
      )}

      {/* Empty state */}
      {allSessions.length === 0 && (
        <EmptyState
          icon="📊"
          title="No trend data yet"
          message="Complete workouts to track your progress over time"
          style={{paddingTop: spacing.extraLarge}}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientLayer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  tabRow: {
    flexDirection: 'row',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    position: 'relative',
  },
  tabContent: {
    alignItems: 'center',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 6,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: Platform.OS === 'android' ? 16 : 0,
  },
  historyCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  deleteButton: {
    padding: 8,
  },
  historyStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  historyStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  prDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
});

export default AnalyticsScreen;
