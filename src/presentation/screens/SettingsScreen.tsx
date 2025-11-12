/**
 * SettingsScreen - App settings and preferences
 * Migrated from Android Compose SettingsTab in HistoryAndSettingsTabs.kt
 *
 * Features:
 * - Weight unit preference (KG/LB)
 * - Workout preferences (Autoplay, Stop At Top)
 * - Theme selection (Light/Dark/System) - placeholder for LED color scheme
 * - Data management (clear data)
 * - Connection logs access
 * - App info section
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { RootStackParamList, SCREEN_NAMES } from '../navigation/types';
import { useColors, useTypography, useSpacing, useTheme } from '../theme';
import { usePreferences } from '../hooks/usePreferences';
import { useWorkoutHistory } from '../hooks/useWorkoutHistory';
import { Card } from '../components/Card';
import { Button, OutlinedButton } from '../components/Button';
import { Modal, AlertDialog } from '../components/Modal';
import { WeightUnit } from '../../domain/models/Models';
import { ThemeMode } from '../theme/theme';

type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

/**
 * SettingsScreen Component
 */
export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const colors = useColors();
  const typography = useTypography();
  const spacing = useSpacing();
  const { themeMode, setThemeMode } = useTheme();

  const { preferences, setWeightUnit, setAutoplayEnabled, setStopAtTop } = usePreferences();
  const { deleteAllWorkouts } = useWorkoutHistory();

  // State
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [showThemeDialog, setShowThemeDialog] = useState(false);
  const [localWeightUnit, setLocalWeightUnit] = useState(preferences.weightUnit || WeightUnit.KG);

  // Handle weight unit change
  const handleWeightUnitChange = (unit: WeightUnit) => {
    setLocalWeightUnit(unit);
    setWeightUnit(unit);
  };

  // Handle delete all workouts
  const handleDeleteAllWorkouts = async () => {
    try {
      await deleteAllWorkouts();
      setShowDeleteAllDialog(false);
      Alert.alert('Success', 'All workout history has been deleted.');
    } catch (error) {
      console.error('Failed to delete all workouts:', error);
      Alert.alert('Error', 'Failed to delete workout history.');
    }
  };

  // Handle navigate to connection logs
  const handleNavigateToConnectionLogs = () => {
    navigation.navigate(SCREEN_NAMES.CONNECTION_LOGS);
  };

  // Theme options (using LED color scheme names from Android)
  const themeOptions = [
    { label: 'System Default', value: ThemeMode.SYSTEM },
    { label: 'Light', value: ThemeMode.LIGHT },
    { label: 'Dark', value: ThemeMode.DARK },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { padding: spacing.medium }]}
        showsVerticalScrollIndicator={false}>
        <Text
          style={[
            typography.headlineMedium,
            {
              color: colors.onSurface,
              fontWeight: 'bold',
              marginBottom: spacing.medium,
            },
          ]}>
          Settings
        </Text>

        {/* Weight Unit Section */}
        <SettingsCard
          title="Weight Unit"
          icon="scale"
          iconColor="#8B5CF6">
          <View style={styles.chipRow}>
            <FilterChip
              label="kg"
              selected={localWeightUnit === WeightUnit.KG}
              onPress={() => handleWeightUnitChange(WeightUnit.KG)}
            />
            <FilterChip
              label="lbs"
              selected={localWeightUnit === WeightUnit.LB}
              onPress={() => handleWeightUnitChange(WeightUnit.LB)}
            />
          </View>
        </SettingsCard>

        {/* Workout Preferences Section */}
        <SettingsCard
          title="Workout Preferences"
          icon="tune"
          iconColor="#6366F1">
          {/* Autoplay toggle */}
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  typography.bodyLarge,
                  { color: colors.onSurface, fontWeight: '500', marginBottom: 4 },
                ]}>
                Autoplay Routines
              </Text>
              <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>
                Automatically advance to next exercise after rest timer
              </Text>
            </View>
            <Switch
              value={preferences.autoplayEnabled || false}
              onValueChange={setAutoplayEnabled}
              trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
              thumbColor={colors.onPrimary}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.surfaceVariant }]} />

          {/* Stop At Top toggle */}
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  typography.bodyLarge,
                  { color: colors.onSurface, fontWeight: '500', marginBottom: 4 },
                ]}>
                Stop At Top
              </Text>
              <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>
                Release tension at contracted position instead of extended position
              </Text>
            </View>
            <Switch
              value={preferences.stopAtTop || false}
              onValueChange={setStopAtTop}
              trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
              thumbColor={colors.onPrimary}
            />
          </View>
        </SettingsCard>

        {/* Theme Section */}
        <SettingsCard
          title="Appearance"
          icon="color-lens"
          iconColor="#3B82F6">
          <TouchableOpacity
            onPress={() => setShowThemeDialog(true)}
            style={styles.settingButton}
            accessibilityRole="button"
            accessibilityLabel="Change theme">
            <Text style={[typography.bodyLarge, { color: colors.onSurface, flex: 1 }]}>
              Theme
            </Text>
            <View style={styles.settingValue}>
              <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant }]}>
                {themeOptions.find(t => t.value === themeMode)?.label}
              </Text>
              <Icon name="chevron-right" size={24} color={colors.primary} />
            </View>
          </TouchableOpacity>
        </SettingsCard>

        {/* Data Management Section */}
        <SettingsCard
          title="Data Management"
          icon="delete-forever"
          iconColor="#EF4444">
          <Button
            onPress={() => setShowDeleteAllDialog(true)}
            variant="filled"
            fullWidth
            style={{ backgroundColor: colors.error }}>
            <Icon name="delete" size={20} color={colors.onPrimary} />
            <Text style={{ marginLeft: 8 }}>Delete All Workouts</Text>
          </Button>
        </SettingsCard>

        {/* Developer Tools Section */}
        <SettingsCard
          title="Developer Tools"
          icon="bug-report"
          iconColor="#F59E0B">
          <OutlinedButton
            onPress={handleNavigateToConnectionLogs}
            fullWidth>
            <Icon name="timeline" size={20} color={colors.primary} />
            <Text style={{ marginLeft: 8 }}>Connection Logs</Text>
          </OutlinedButton>
          <Text
            style={[
              typography.bodySmall,
              { color: colors.onSurfaceVariant, marginTop: 4 },
            ]}>
            View Bluetooth connection debug logs to diagnose connectivity issues
          </Text>
        </SettingsCard>

        {/* App Info Section */}
        <SettingsCard
          title="App Info"
          icon="info"
          iconColor="#22C55E">
          <Text style={[typography.bodyMedium, { color: colors.onSurface }]}>
            Version: 0.1.0-beta
          </Text>
          <Text style={[typography.bodyMedium, { color: colors.onSurface }]}>
            Build: Beta 1
          </Text>
          <Text
            style={[
              typography.bodySmall,
              { color: colors.onSurfaceVariant, marginTop: spacing.small },
            ]}>
            Open source community project to control Vitruvian Trainer machines locally.
          </Text>
        </SettingsCard>

        {/* Bottom spacing */}
        <View style={{ height: spacing.extraLarge }} />
      </ScrollView>

      {/* Delete All Workouts Dialog */}
      <AlertDialog
        visible={showDeleteAllDialog}
        onDismiss={() => setShowDeleteAllDialog(false)}
        title="Delete All Workouts?"
        message="This will permanently delete all workout history. This action cannot be undone."
        confirmText="Delete All"
        cancelText="Cancel"
        onConfirm={handleDeleteAllWorkouts}
        onCancel={() => setShowDeleteAllDialog(false)}
      />

      {/* Theme Selection Dialog */}
      <Modal
        visible={showThemeDialog}
        onDismiss={() => setShowThemeDialog(false)}
        title="Select Theme"
        variant="center">
        <View>
          {themeOptions.map(option => (
            <TouchableOpacity
              key={option.value}
              onPress={() => {
                setThemeMode(option.value);
                setShowThemeDialog(false);
              }}
              style={[
                styles.themeOption,
                { borderBottomColor: colors.surfaceVariant },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Select ${option.label} theme`}>
              <Text
                style={[
                  typography.bodyLarge,
                  {
                    color: themeMode === option.value ? colors.primary : colors.onSurface,
                    fontWeight: themeMode === option.value ? '600' : '400',
                  },
                ]}>
                {option.label}
              </Text>
              {themeMode === option.value && (
                <Icon name="check" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
    </View>
  );
};

/**
 * SettingsCard Component
 */
interface SettingsCardProps {
  title: string;
  icon: string;
  iconColor: string;
  children: React.ReactNode;
}

const SettingsCard: React.FC<SettingsCardProps> = ({ title, icon, iconColor, children }) => {
  const colors = useColors();
  const typography = useTypography();
  const spacing = useSpacing();

  return (
    <Card
      style={styles.settingsCard}
      elevation={4}
      borderWidth={1}
      borderRadius={16}>
      <View style={{ padding: spacing.medium }}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.iconBox,
              {
                backgroundColor: iconColor,
                ...Platform.select({
                  ios: {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 4,
                  },
                  android: {
                    elevation: 4,
                  },
                }),
              },
            ]}>
            <Icon name={icon} size={24} color={colors.onPrimary} />
          </View>
          <Text
            style={[
              typography.titleMedium,
              { color: colors.onSurface, fontWeight: 'bold', marginLeft: spacing.medium },
            ]}>
            {title}
          </Text>
        </View>

        {/* Content */}
        <View style={{ marginTop: spacing.small }}>{children}</View>
      </View>
    </Card>
  );
};

/**
 * FilterChip Component
 */
interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

const FilterChip: React.FC<FilterChipProps> = ({ label, selected, onPress }) => {
  const colors = useColors();
  const typography = useTypography();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.filterChip,
        {
          backgroundColor: selected ? colors.primary : colors.surface,
          borderColor: selected ? colors.primary : colors.outline,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${selected ? 'Selected' : 'Select'} ${label}`}>
      <Text
        style={[
          typography.labelLarge,
          { color: selected ? colors.onPrimary : colors.onSurfaceVariant },
        ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: 8,
  },
  settingsCard: {
    width: '100%',
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
});

export default SettingsScreen;
