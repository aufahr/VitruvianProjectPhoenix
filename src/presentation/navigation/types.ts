/**
 * Navigation types and screen names for the Vitruvian Phoenix app.
 *
 * This file defines all navigation routes, their parameters, and TypeScript types
 * for type-safe navigation throughout the app.
 */

import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

/**
 * Root Stack Navigator param list
 * Defines all screens in the main navigation stack and their required params
 */
export type RootStackParamList = {
  // Main tab navigation
  MainTabs: undefined;

  // Workout screens (push onto stack from Home tab)
  JustLift: undefined;
  SingleExercise: undefined;
  DailyRoutines: undefined;
  ActiveWorkout: undefined;
  WeeklyPrograms: undefined;
  ProgramBuilder: {
    programId?: string; // Optional - "new" for creating, existing ID for editing
  };

  // Settings/Debug screens (push onto stack from Settings tab)
  ConnectionLogs: undefined;
};

/**
 * Bottom Tab Navigator param list
 * Defines the three main tabs in the bottom navigation
 */
export type MainTabParamList = {
  Home: undefined;      // Workout type selection
  Analytics: undefined; // History, PRs, trends
  Settings: undefined;  // App settings, preferences
};

/**
 * Screen names as constants for consistent reference
 */
export const SCREEN_NAMES = {
  // Root Stack
  MAIN_TABS: 'MainTabs' as const,
  JUST_LIFT: 'JustLift' as const,
  SINGLE_EXERCISE: 'SingleExercise' as const,
  DAILY_ROUTINES: 'DailyRoutines' as const,
  ACTIVE_WORKOUT: 'ActiveWorkout' as const,
  WEEKLY_PROGRAMS: 'WeeklyPrograms' as const,
  PROGRAM_BUILDER: 'ProgramBuilder' as const,
  CONNECTION_LOGS: 'ConnectionLogs' as const,

  // Bottom Tabs
  HOME: 'Home' as const,
  ANALYTICS: 'Analytics' as const,
  SETTINGS: 'Settings' as const,
} as const;

/**
 * Helper types for screen props
 */
export type RootStackScreenProps<T extends keyof RootStackParamList> = {
  navigation: StackNavigationProp<RootStackParamList, T>;
  route: RouteProp<RootStackParamList, T>;
};

export type MainTabScreenProps<T extends keyof MainTabParamList> = {
  navigation: BottomTabNavigationProp<MainTabParamList, T>;
  route: RouteProp<MainTabParamList, T>;
};

/**
 * Deep linking configuration types
 */
export type DeepLinkConfig = {
  screens: {
    [K in keyof RootStackParamList]: string | {
      path: string;
      parse?: Record<string, (value: string) => any>;
    };
  };
};

/**
 * Deep linking URL patterns
 */
export const DEEP_LINK_CONFIG: DeepLinkConfig = {
  screens: {
    MainTabs: {
      path: '',
    },
    JustLift: 'just-lift',
    SingleExercise: 'single-exercise',
    DailyRoutines: 'daily-routines',
    ActiveWorkout: 'active-workout',
    WeeklyPrograms: 'weekly-programs',
    ProgramBuilder: {
      path: 'program-builder/:programId?',
      parse: {
        programId: (id: string) => id || 'new',
      },
    },
    ConnectionLogs: 'connection-logs',
  },
};

/**
 * Deep linking prefixes for iOS
 */
export const LINKING_PREFIXES = [
  'vitruvianphoenix://',
  'https://vitruvian.app',
  'https://*.vitruvian.app',
];
