/**
 * WeeklyProgramsScreen - View and manage weekly workout programs
 * Migrated from Android Compose WeeklyProgramsScreen.kt
 *
 * Features:
 * - Display weekly training programs
 * - Show program cards with days and routines
 * - Activate/deactivate programs
 * - Create new program button
 * - Navigate to ProgramBuilder screen
 * - Today's workout from active program
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { RootStackParamList, SCREEN_NAMES } from '../navigation/types';
import { useColors, useTypography, useSpacing, useIsDark } from '../theme';
import { useWeeklyPrograms } from '../hooks/useWeeklyPrograms';
import { useRoutines } from '../hooks/useRoutines';
import { useBleConnection } from '../hooks/useBleConnection';
import { useWorkoutSession } from '../hooks/useWorkoutSession';
import { Card } from '../components/Card';
import { Button, OutlinedButton, TextButton } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { ConnectingOverlay } from '../components/ConnectingOverlay';
import { ConnectionErrorDialog } from '../components/ConnectionErrorDialog';
import { Modal } from '../components/Modal';
import { WeeklyProgramWithDays } from '../../data/local/entities';

type WeeklyProgramsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

// Days of week (1=Monday, 7=Sunday)
const DAYS_OF_WEEK = [
  { value: 1, name: 'Monday', short: 'Mon' },
  { value: 2, name: 'Tuesday', short: 'Tue' },
  { value: 3, name: 'Wednesday', short: 'Wed' },
  { value: 4, name: 'Thursday', short: 'Thu' },
  { value: 5, name: 'Friday', short: 'Fri' },
  { value: 6, name: 'Saturday', short: 'Sat' },
  { value: 7, name: 'Sunday', short: 'Sun' },
];

/**
 * Get current day of week (1=Monday, 7=Sunday)
 */
const getCurrentDayOfWeek = (): number => {
  const day = new Date().getDay();
  // Convert Sunday (0) to 7, and shift others (Mon=1, Tue=2, etc.)
  return day === 0 ? 7 : day;
};

/**
 * Get day name from day value
 */
const getDayName = (dayValue: number): string => {
  const day = DAYS_OF_WEEK.find(d => d.value === dayValue);
  return day?.name || 'Unknown';
};

/**
 * WeeklyProgramsScreen Component
 */
export const WeeklyProgramsScreen: React.FC = () => {
  const navigation = useNavigation<WeeklyProgramsScreenNavigationProp>();
  const colors = useColors();
  const typography = useTypography();
  const spacing = useSpacing();
  const isDark = useIsDark();

  // Weekly programs state
  const { programs, activeProgram, activateProgram, deleteProgram } = useWeeklyPrograms();

  // Routines hook for loading routine by ID
  const { getRoutine, loadRoutine } = useRoutines();

  // BLE connection state
  const {
    connectionState,
    isAutoConnecting,
    connectionError,
    autoConnect,
    clearConnectionError,
  } = useBleConnection();

  // Workout session
  const { startWorkout } = useWorkoutSession();

  /**
   * Background gradient colors based on theme
   * Dark: slate-900 -> indigo-950 -> blue-950
   * Light: indigo-200 -> pink-100 -> violet-200
   */
  const backgroundGradientColors = isDark
    ? ['#0F172A', '#1E1B4B', '#172554']
    : ['#E0E7FF', '#FCE7F3', '#DDD6FE'];

  /**
   * Navigate back
   */
  const handleBackPress = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  /**
   * Navigate to ProgramBuilder (create or edit)
   */
  const handleCreateProgram = useCallback(() => {
    navigation.navigate(SCREEN_NAMES.PROGRAM_BUILDER, {});
  }, [navigation]);

  const handleEditProgram = useCallback(
    (programId: string) => {
      navigation.navigate(SCREEN_NAMES.PROGRAM_BUILDER, { programId });
    },
    [navigation]
  );

  /**
   * Start today's workout from active program
   */
  const handleStartTodayWorkout = useCallback(
    async (routineId: string) => {
      // Ensure BLE connection
      const ensureConnection = async () => {
        if (connectionState.type !== 'connected') {
          await autoConnect(30000); // 30 second timeout
        }
      };

      try {
        await ensureConnection();

        // Load routine and start workout
        const routine = await getRoutine(routineId);
        if (routine) {
          loadRoutine(routine);
          startWorkout();
          navigation.navigate(SCREEN_NAMES.ACTIVE_WORKOUT);
        }
      } catch (err) {
        console.error('Failed to start workout:', err);
      }
    },
    [connectionState, autoConnect, getRoutine, loadRoutine, startWorkout, navigation]
  );

  /**
   * Activate a program
   */
  const handleActivateProgram = useCallback(
    async (programId: string) => {
      try {
        await activateProgram(programId);
      } catch (err) {
        console.error('Failed to activate program:', err);
      }
    },
    [activateProgram]
  );

  /**
   * Delete a program
   */
  const handleDeleteProgram = useCallback(
    async (programId: string) => {
      try {
        await deleteProgram(programId);
      } catch (err) {
        console.error('Failed to delete program:', err);
      }
    },
    [deleteProgram]
  );

  return (
    <View style={[styles.container, { backgroundColor: backgroundGradientColors[0] }]}>
      {/* Gradient background effect using layered views */}
      <View style={[styles.gradientLayer, { backgroundColor: backgroundGradientColors[1] }]} />
      <View style={[styles.gradientLayer, { backgroundColor: backgroundGradientColors[2] }]} />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.outline,
          },
        ]}>
        <TouchableOpacity
          onPress={handleBackPress}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <Icon name="arrow-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={[typography.headlineSmall, { color: colors.onSurface, fontWeight: 'bold' }]}>
          Weekly Programs
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { padding: spacing.medium }]}
        showsVerticalScrollIndicator={false}>
        {/* Active Program Card */}
        {activeProgram ? (
          <ActiveProgramCard
            program={activeProgram}
            onStartTodayWorkout={handleStartTodayWorkout}
            onViewProgram={() => handleEditProgram(activeProgram.program.id)}
            style={{ marginBottom: spacing.medium }}
          />
        ) : (
          <Card style={{ marginBottom: spacing.medium }} elevation={4} borderRadius={16}>
            <View style={[styles.noActiveProgramCard, { padding: spacing.large }]}>
              <Icon name="info" size={48} color={colors.onSurfaceVariant} />
              <Text
                style={[
                  typography.titleMedium,
                  { color: colors.onSurface, fontWeight: 'bold', marginTop: spacing.small },
                ]}>
                No active program
              </Text>
              <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>
                Create a program or activate an existing one
              </Text>
            </View>
          </Card>
        )}

        {/* Programs List Header */}
        <View style={{ marginBottom: spacing.medium }}>
          <Text
            style={[
              typography.titleMedium,
              {
                color: colors.onSurface,
                fontWeight: 'bold',
                marginBottom: spacing.medium,
              },
            ]}>
            All Programs
          </Text>
          <OutlinedButton onPress={handleCreateProgram} fullWidth>
            <View style={styles.createButtonContent}>
              <Icon name="add" size={20} color={colors.primary} />
              <Text style={[typography.labelLarge, { color: colors.primary, marginLeft: spacing.small }]}>
                Create Program
              </Text>
            </View>
          </OutlinedButton>
        </View>

        {/* Programs List */}
        {programs.length === 0 ? (
          <EmptyState
            icon={<Icon name="date-range" size={64} color={colors.onSurfaceVariant} />}
            title="No Programs Yet"
            message="Create your first weekly program to follow a structured training schedule"
            actionText="Create Your First Program"
            onAction={handleCreateProgram}
          />
        ) : (
          programs.map(program => (
            <ProgramListItem
              key={program.program.id}
              program={program}
              isActive={program.program.id === activeProgram?.program.id}
              onClick={() => handleEditProgram(program.program.id)}
              onActivate={() => handleActivateProgram(program.program.id)}
              onDelete={() => handleDeleteProgram(program.program.id)}
              style={{ marginBottom: spacing.medium }}
            />
          ))
        )}

        {/* Bottom spacing for better scrolling */}
        <View style={{ height: spacing.extraLarge }} />
      </ScrollView>

      {/* Auto-connect overlay */}
      <ConnectingOverlay
        visible={isAutoConnecting}
        title="Connecting to device..."
        subtitle="Scanning for Vitruvian Trainer"
        testID="weekly-programs-connecting-overlay"
      />

      {/* Connection error dialog */}
      <ConnectionErrorDialog
        visible={!!connectionError}
        message={connectionError || ''}
        onDismiss={clearConnectionError}
        onRetry={() => autoConnect(30000)}
        testID="weekly-programs-connection-error"
      />
    </View>
  );
};

/**
 * Card showing the active program with today's workout
 */
interface ActiveProgramCardProps {
  program: WeeklyProgramWithDays;
  onStartTodayWorkout: (routineId: string) => void;
  onViewProgram: () => void;
  style?: any;
}

const ActiveProgramCard: React.FC<ActiveProgramCardProps> = ({
  program,
  onStartTodayWorkout,
  onViewProgram,
  style,
}) => {
  const colors = useColors();
  const typography = useTypography();
  const spacing = useSpacing();

  const today = getCurrentDayOfWeek();
  const todayName = getDayName(today);

  // Find today's routine ID from program days
  const todayRoutineId = program.days.find(d => d.dayOfWeek === today)?.routineId;
  const hasWorkoutToday = todayRoutineId != null;

  return (
    <Card style={style} elevation={4} borderRadius={16}>
      <View style={{ padding: spacing.medium }}>
        {/* Header Row */}
        <View style={styles.activeProgramHeader}>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                typography.labelMedium,
                {
                  color: colors.onSurfaceVariant,
                  textTransform: 'uppercase',
                },
              ]}>
              Active Program
            </Text>
            <Text
              style={[
                typography.titleLarge,
                {
                  color: colors.onSurface,
                  fontWeight: 'bold',
                  marginTop: spacing.extraSmall,
                },
              ]}>
              {program.program.title}
            </Text>
          </View>
          <TouchableOpacity onPress={onViewProgram} accessibilityRole="button" accessibilityLabel="View program">
            <Icon name="edit" size={24} color={colors.onSurface} />
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View
          style={{
            height: 1,
            backgroundColor: colors.outline,
            marginVertical: spacing.medium,
          }}
        />

        {/* Today's Workout */}
        <Text
          style={[
            typography.titleSmall,
            {
              color: colors.onSurface,
              fontWeight: '600',
              marginBottom: spacing.small,
            },
          ]}>
          Today: {todayName}
        </Text>

        {hasWorkoutToday ? (
          <>
            <Text style={[typography.bodyLarge, { color: colors.onSurface, marginBottom: spacing.medium }]}>
              Workout scheduled
            </Text>
            <Button onPress={() => onStartTodayWorkout(todayRoutineId!)} fullWidth>
              <View style={styles.startWorkoutButton}>
                <Icon name="play-arrow" size={20} color={colors.onPrimary} />
                <Text
                  style={[
                    typography.labelLarge,
                    { color: colors.onPrimary, marginLeft: spacing.small },
                  ]}>
                  Start Today's Workout
                </Text>
              </View>
            </Button>
          </>
        ) : (
          <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant }]}>Rest day</Text>
        )}
      </View>
    </Card>
  );
};

/**
 * List item for a program
 */
interface ProgramListItemProps {
  program: WeeklyProgramWithDays;
  isActive: boolean;
  onClick: () => void;
  onActivate: () => void;
  onDelete: () => void;
  style?: any;
}

const ProgramListItem: React.FC<ProgramListItemProps> = ({
  program,
  isActive,
  onClick,
  onActivate,
  onDelete,
  style,
}) => {
  const colors = useColors();
  const typography = useTypography();
  const spacing = useSpacing();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = () => {
    onDelete();
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Card onPress={onClick} style={style} elevation={4} borderRadius={16}>
        <View style={[styles.programListItem, { padding: spacing.medium }]}>
          {/* Program Info */}
          <View style={{ flex: 1 }}>
            <Text
              style={[
                typography.titleMedium,
                { color: colors.onSurface, fontWeight: 'bold' },
              ]}>
              {program.program.title}
            </Text>
            <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, marginTop: spacing.extraSmall }]}>
              {program.days.length} workout days
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.programActions}>
            {/* Delete button */}
            <TouchableOpacity
              onPress={() => setShowDeleteDialog(true)}
              style={{ padding: spacing.small }}
              accessibilityRole="button"
              accessibilityLabel="Delete program">
              <Icon name="delete" size={24} color={colors.error} />
            </TouchableOpacity>

            {/* Activate/Active status */}
            {!isActive ? (
              <TextButton onPress={onActivate} size="small">
                Activate
              </TextButton>
            ) : (
              <View
                style={[
                  styles.activeBadge,
                  {
                    backgroundColor: colors.primary,
                    paddingHorizontal: spacing.medium,
                    paddingVertical: spacing.small,
                  },
                ]}>
                <Text style={[typography.labelMedium, { color: colors.onPrimary }]}>Active</Text>
              </View>
            )}
          </View>
        </View>
      </Card>

      {/* Delete confirmation dialog */}
      <Modal
        visible={showDeleteDialog}
        onDismiss={() => setShowDeleteDialog(false)}
        title="Delete Program"
        variant="center"
        footer={
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.small }}>
            <TextButton onPress={() => setShowDeleteDialog(false)}>Cancel</TextButton>
            <Button onPress={handleDelete} style={{ backgroundColor: colors.error }}>
              Delete
            </Button>
          </View>
        }>
        <Text style={[typography.bodyMedium, { color: colors.onSurface }]}>
          Are you sure you want to delete "{program.program.title}"? This action cannot be undone.
        </Text>
      </Modal>
    </>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    ...Platform.select({
      ios: {
        paddingTop: 60,
      },
      android: {
        paddingTop: 16,
      },
    }),
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerSpacer: {
    width: 40, // Same width as back button for centering
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: Platform.OS === 'android' ? 8 : 0,
  },
  noActiveProgramCard: {
    alignItems: 'center',
    gap: 8,
  },
  createButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeProgramHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  startWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  programListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  programActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeBadge: {
    borderRadius: 8,
  },
});

export default WeeklyProgramsScreen;
