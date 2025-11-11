/**
 * ProgramBuilderScreen - Create or edit a weekly program
 * Migrated from Android Compose ProgramBuilderScreen.kt
 *
 * Features:
 * - Create/edit weekly programs
 * - Assign routines to days of the week
 * - Program name editing
 * - Day selection with routine assignment
 * - Save program functionality
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { RootStackParamList, SCREEN_NAMES } from '../navigation/types';
import { useColors, useTypography, useSpacing } from '../theme';
import { useRoutines } from '../hooks/useRoutines';
import { useWeeklyPrograms } from '../hooks/useWeeklyPrograms';
import { Card } from '../components/Card';
import { Button, TextButton } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { Routine } from '../../domain/models/Routine';
import { WeeklyProgramEntity, ProgramDayEntity } from '../../data/local/entities';
import { generateUUID } from '../../domain/models/Models';

type ProgramBuilderScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ProgramBuilder'>;
type ProgramBuilderScreenRouteProp = RouteProp<RootStackParamList, 'ProgramBuilder'>;

// Days of week (1=Monday, 7=Sunday)
const DAYS_OF_WEEK = [
  { value: 1, name: 'Monday' },
  { value: 2, name: 'Tuesday' },
  { value: 3, name: 'Wednesday' },
  { value: 4, name: 'Thursday' },
  { value: 5, name: 'Friday' },
  { value: 6, name: 'Saturday' },
  { value: 7, name: 'Sunday' },
];

/**
 * ProgramBuilderScreen Component
 */
export const ProgramBuilderScreen: React.FC = () => {
  const navigation = useNavigation<ProgramBuilderScreenNavigationProp>();
  const route = useRoute<ProgramBuilderScreenRouteProp>();
  const colors = useColors();
  const typography = useTypography();
  const spacing = useSpacing();

  const { routines } = useRoutines();
  const { programs, saveProgram } = useWeeklyPrograms();

  const programId = route.params?.programId || 'new';
  const isEditing = programId !== 'new';

  // State
  const [programName, setProgramName] = useState('New Program');
  const [isEditingName, setIsEditingName] = useState(false);
  const [showRoutinePicker, setShowRoutinePicker] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [dailyRoutines, setDailyRoutines] = useState<Map<number, Routine | null>>(
    new Map(DAYS_OF_WEEK.map(day => [day.value, null]))
  );

  // Load existing program data if editing
  useEffect(() => {
    if (isEditing && programs.length > 0) {
      const existingProgram = programs.find(p => p.program.id === programId);
      if (existingProgram) {
        setProgramName(existingProgram.program.title);

        // Convert program days to map
        const routineMap = new Map<number, Routine | null>();
        DAYS_OF_WEEK.forEach(day => {
          routineMap.set(day.value, null);
        });

        existingProgram.days.forEach(programDay => {
          const routine = routines.find(r => r.id === programDay.routineId);
          if (routine) {
            routineMap.set(programDay.dayOfWeek, routine);
          }
        });

        setDailyRoutines(routineMap);
      }
    }
  }, [isEditing, programId, programs, routines]);

  // Handle day selection
  const handleDayPress = useCallback((dayValue: number) => {
    setSelectedDay(dayValue);
    setShowRoutinePicker(true);
  }, []);

  // Handle routine selection
  const handleRoutineSelect = useCallback((routine: Routine) => {
    if (selectedDay !== null) {
      setDailyRoutines(prev => new Map(prev).set(selectedDay, routine));
    }
    setShowRoutinePicker(false);
  }, [selectedDay]);

  // Handle clear routine
  const handleClearRoutine = useCallback((dayValue: number) => {
    setDailyRoutines(prev => new Map(prev).set(dayValue, null));
  }, []);

  // Handle save program
  const handleSaveProgram = useCallback(async () => {
    try {
      // Create program entity
      const program: WeeklyProgramEntity = {
        id: isEditing ? programId : generateUUID(),
        title: programName,
        notes: null,
        isActive: false,
        lastUsed: null,
        createdAt: Date.now(),
      };

      // Create program days for assigned routines
      const days: ProgramDayEntity[] = [];
      dailyRoutines.forEach((routine, dayValue) => {
        if (routine) {
          days.push({
            programId: program.id,
            dayOfWeek: dayValue,
            routineId: routine.id,
          });
        }
      });

      await saveProgram(program, days);
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save program:', error);
    }
  }, [isEditing, programId, programName, dailyRoutines, saveProgram, navigation]);

  // Calculate summary stats
  const workoutDays = Array.from(dailyRoutines.values()).filter(r => r !== null).length;
  const restDays = 7 - workoutDays;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.surfaceVariant,
          },
        ]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <Icon name="arrow-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>

        {isEditingName ? (
          <Input
            value={programName}
            onChangeText={setProgramName}
            style={styles.headerInput}
            containerStyle={{ marginBottom: 0 }}
            autoFocus
          />
        ) : (
          <Text style={[typography.headlineSmall, { color: colors.onSurface, flex: 1 }]}>
            {programName}
          </Text>
        )}

        <TouchableOpacity
          onPress={() => setIsEditingName(!isEditingName)}
          style={styles.headerButton}
          accessibilityRole="button"
          accessibilityLabel={isEditingName ? 'Save name' : 'Edit name'}>
          <Icon
            name={isEditingName ? 'check' : 'edit'}
            size={24}
            color={colors.onSurface}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSaveProgram}
          style={styles.headerButton}
          accessibilityRole="button"
          accessibilityLabel="Save program">
          <Icon name="done" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { padding: spacing.medium }]}
        showsVerticalScrollIndicator={false}>
        <Text
          style={[
            typography.titleMedium,
            {
              color: colors.onSurface,
              fontWeight: 'bold',
              marginBottom: spacing.medium,
            },
          ]}>
          Schedule workouts for each day
        </Text>

        {/* Day cards */}
        {DAYS_OF_WEEK.map(day => (
          <DayRoutineCard
            key={day.value}
            day={day}
            routine={dailyRoutines.get(day.value) || null}
            onPress={() => handleDayPress(day.value)}
            onClear={() => handleClearRoutine(day.value)}
          />
        ))}

        {/* Summary card */}
        <Card style={styles.summaryCard} elevation={4} borderWidth={1} borderRadius={16}>
          <View style={{ padding: spacing.medium }}>
            <Text
              style={[
                typography.titleMedium,
                { color: colors.onSurface, fontWeight: 'bold', marginBottom: spacing.small },
              ]}>
              Program Summary
            </Text>
            <Text style={[typography.bodyMedium, { color: colors.onSurface }]}>
              {workoutDays} workout days, {restDays} rest days
            </Text>
          </View>
        </Card>

        {/* Bottom spacing */}
        <View style={{ height: spacing.extraLarge }} />
      </ScrollView>

      {/* Routine picker modal */}
      {showRoutinePicker && selectedDay !== null && (
        <Modal
          visible={showRoutinePicker}
          onDismiss={() => setShowRoutinePicker(false)}
          title={`Select Routine for ${DAYS_OF_WEEK.find(d => d.value === selectedDay)?.name}`}
          variant="bottom">
          <View>
            {routines.length === 0 ? (
              <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant }]}>
                No routines available. Create a routine first.
              </Text>
            ) : (
              routines.map(routine => (
                <TouchableOpacity
                  key={routine.id}
                  onPress={() => handleRoutineSelect(routine)}
                  style={{ marginBottom: spacing.small }}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${routine.name}`}>
                  <Card
                    style={styles.routineCard}
                    elevation={2}
                    borderRadius={12}>
                    <View style={{ padding: spacing.medium }}>
                      <Text
                        style={[
                          typography.bodyLarge,
                          { color: colors.onSurface, fontWeight: '500', marginBottom: 4 },
                        ]}>
                        {routine.name}
                      </Text>
                      <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>
                        {routine.exercises?.length || 0} exercises
                      </Text>
                    </View>
                  </Card>
                </TouchableOpacity>
              ))
            )}
          </View>
        </Modal>
      )}
    </View>
  );
};

/**
 * DayRoutineCard Component
 */
interface DayRoutineCardProps {
  day: { value: number; name: string };
  routine: Routine | null;
  onPress: () => void;
  onClear: () => void;
}

const DayRoutineCard: React.FC<DayRoutineCardProps> = ({ day, routine, onPress, onClear }) => {
  const colors = useColors();
  const typography = useTypography();
  const spacing = useSpacing();

  return (
    <Card
      onPress={onPress}
      style={styles.dayCard}
      elevation={4}
      borderWidth={1}
      borderRadius={16}>
      <View style={[styles.dayCardContent, { padding: spacing.medium }]}>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              typography.titleMedium,
              { color: colors.onSurface, fontWeight: 'bold', marginBottom: spacing.extraSmall },
            ]}>
            {day.name}
          </Text>

          {routine ? (
            <>
              <Text style={[typography.bodyMedium, { color: colors.onSurface }]}>
                {routine.name}
              </Text>
              <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>
                {routine.exercises?.length || 0} exercises
              </Text>
            </>
          ) : (
            <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant }]}>
              Rest day
            </Text>
          )}
        </View>

        {routine ? (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onClear();
            }}
            style={styles.clearButton}
            accessibilityRole="button"
            accessibilityLabel="Clear routine">
            <Icon name="clear" size={24} color={colors.error} />
          </TouchableOpacity>
        ) : (
          <Icon name="add" size={24} color={colors.primary} />
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    ...Platform.select({
      ios: {
        paddingTop: 44,
      },
      android: {
        paddingTop: 12,
      },
    }),
  },
  headerButton: {
    padding: 8,
  },
  headerInput: {
    flex: 1,
    marginHorizontal: 8,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: 8,
  },
  dayCard: {
    width: '100%',
    marginBottom: 12,
  },
  dayCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clearButton: {
    padding: 4,
  },
  summaryCard: {
    width: '100%',
    marginTop: 12,
  },
  routineCard: {
    width: '100%',
  },
});

export default ProgramBuilderScreen;
