/**
 * Theme System - Main Export
 * Migrated from Android Kotlin/Jetpack Compose to React Native
 */

// Export all colors
export * from './colors';

// Export typography
export * from './typography';

// Export spacing
export * from './spacing';

// Export theme configuration
export * from './theme';

// Export theme context and hooks
export {
  ThemeProvider,
  useTheme,
  useColors,
  useTypography,
  useSpacing,
  useIsDark,
  useThemeMode,
} from './ThemeContext';
