/**
 * Navigation module exports
 *
 * Central export point for all navigation-related types, components, and utilities.
 * Import navigation functionality from this file throughout the app.
 */

// Main navigator component
export { RootNavigator, default } from './RootNavigator';

// Navigation types and constants
export type {
  RootStackParamList,
  MainTabParamList,
  RootStackScreenProps,
  MainTabScreenProps,
  DeepLinkConfig,
} from './types';

export {
  SCREEN_NAMES,
  DEEP_LINK_CONFIG,
  LINKING_PREFIXES,
} from './types';
