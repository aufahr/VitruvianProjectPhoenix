/**
 * RootNavigator - Main navigation component for Vitruvian Phoenix
 *
 * This component sets up the complete navigation hierarchy:
 * - Root stack navigator for full-screen transitions
 * - Bottom tab navigator for main app sections (Home, Analytics, Settings)
 * - Screen animations matching Android app behavior
 * - Deep linking support for iOS
 */

import React from 'react';
import { Platform } from 'react-native';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';

import {
  RootStackParamList,
  MainTabParamList,
  SCREEN_NAMES,
  DEEP_LINK_CONFIG,
  LINKING_PREFIXES,
} from './types';

import { DarkColorScheme } from '../theme/colors';

// Import screens (these will be created as the React Native app develops)
// For now, we'll use placeholder screens that will be replaced with actual implementations

// Placeholder screen component for development
const PlaceholderScreen = ({ name }: { name: string }) => {
  const { View, Text, StyleSheet } = require('react-native');
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>{name} Screen</Text>
      <Text style={styles.placeholderSubtext}>Coming soon...</Text>
    </View>
  );
};

const styles = require('react-native').StyleSheet.create({
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 16,
    color: '#666',
  },
});

// Import actual screens
import { JustLiftScreen } from '../screens/JustLiftScreen';

// Placeholder screens - replace with actual screen imports as they're developed
const HomeScreen = () => <PlaceholderScreen name="Home" />;
const AnalyticsScreen = () => <PlaceholderScreen name="Analytics" />;
const SettingsScreen = () => <PlaceholderScreen name="Settings" />;
const SingleExerciseScreen = () => <PlaceholderScreen name="Single Exercise" />;
const DailyRoutinesScreen = () => <PlaceholderScreen name="Daily Routines" />;
const ActiveWorkoutScreen = () => <PlaceholderScreen name="Active Workout" />;
const WeeklyProgramsScreen = () => <PlaceholderScreen name="Weekly Programs" />;
const ProgramBuilderScreen = () => <PlaceholderScreen name="Program Builder" />;
const ConnectionLogsScreen = () => <PlaceholderScreen name="Connection Logs" />;

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * Bottom Tab Navigator
 * Three tabs: Analytics (left), Home/Workout (center, elevated), Settings (right)
 */
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: DarkColorScheme.primary,
        tabBarInactiveTintColor: DarkColorScheme.outline,
        tabBarStyle: {
          height: 80,
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          paddingTop: 10,
          borderTopWidth: 1,
          borderTopColor: DarkColorScheme.outlineVariant,
          backgroundColor: DarkColorScheme.surface,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      {/* Left: Analytics Tab */}
      <Tab.Screen
        name={SCREEN_NAMES.ANALYTICS}
        component={AnalyticsScreen}
        options={{
          tabBarLabel: 'Analytics',
          tabBarIcon: ({ color, size, focused }) => (
            <Icon
              name={focused ? 'bar-chart' : 'bar-chart'}
              size={24}
              color={color}
            />
          ),
        }}
      />

      {/* Center: Home/Workout Tab (Elevated FAB style) */}
      <Tab.Screen
        name={SCREEN_NAMES.HOME}
        component={HomeScreen}
        options={{
          tabBarLabel: 'Workouts',
          tabBarIcon: ({ color, size, focused }) => (
            <Icon
              name={focused ? 'home' : 'home'}
              size={28}
              color={color}
            />
          ),
          tabBarIconStyle: {
            marginTop: 0,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: 'bold',
          },
        }}
      />

      {/* Right: Settings Tab */}
      <Tab.Screen
        name={SCREEN_NAMES.SETTINGS}
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size, focused }) => (
            <Icon
              name={focused ? 'settings' : 'settings'}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

/**
 * Root Stack Navigator
 * Manages full-screen transitions and modal screens
 */
const RootStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
      }}
    >
      {/* Main Tab Navigation */}
      <Stack.Screen
        name={SCREEN_NAMES.MAIN_TABS}
        component={MainTabNavigator}
        options={{
          gestureEnabled: false, // Disable swipe gesture on main tabs
        }}
      />

      {/* Workout Flow Screens */}
      <Stack.Screen
        name={SCREEN_NAMES.JUST_LIFT}
        component={JustLiftScreen}
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          gestureDirection: 'horizontal',
        }}
      />

      <Stack.Screen
        name={SCREEN_NAMES.SINGLE_EXERCISE}
        component={SingleExerciseScreen}
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        }}
      />

      <Stack.Screen
        name={SCREEN_NAMES.DAILY_ROUTINES}
        component={DailyRoutinesScreen}
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        }}
      />

      <Stack.Screen
        name={SCREEN_NAMES.ACTIVE_WORKOUT}
        component={ActiveWorkoutScreen}
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          gestureEnabled: false, // Prevent accidental swipe during workout
        }}
      />

      <Stack.Screen
        name={SCREEN_NAMES.WEEKLY_PROGRAMS}
        component={WeeklyProgramsScreen}
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        }}
      />

      <Stack.Screen
        name={SCREEN_NAMES.PROGRAM_BUILDER}
        component={ProgramBuilderScreen}
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        }}
      />

      {/* Settings/Debug Screens */}
      <Stack.Screen
        name={SCREEN_NAMES.CONNECTION_LOGS}
        component={ConnectionLogsScreen}
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        }}
      />
    </Stack.Navigator>
  );
};

/**
 * Deep Linking Configuration for iOS
 * Enables universal links and custom URL scheme support
 */
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: LINKING_PREFIXES,
  config: DEEP_LINK_CONFIG,
};

/**
 * Root Navigator Component
 * Main export that wraps the navigation tree with NavigationContainer
 */
export const RootNavigator: React.FC = () => {
  return (
    <NavigationContainer linking={linking} fallback={<PlaceholderScreen name="Loading" />}>
      <RootStackNavigator />
    </NavigationContainer>
  );
};

export default RootNavigator;
