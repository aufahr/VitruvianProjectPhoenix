/**
 * Main theme configuration
 * Migrated from Android Kotlin/Jetpack Compose
 */

import {DarkColorScheme, LightColorScheme, ColorScheme} from './colors';
import {Typography, TypographyType} from './typography';
import {Spacing, SpacingType} from './spacing';

/**
 * Theme modes matching Android implementation
 */
export enum ThemeMode {
  SYSTEM = 'SYSTEM',
  LIGHT = 'LIGHT',
  DARK = 'DARK',
}

/**
 * Complete theme interface
 */
export interface Theme {
  colors: ColorScheme;
  typography: TypographyType;
  spacing: SpacingType;
  isDark: boolean;
}

/**
 * Create a theme object based on mode
 * @param isDark - Whether to use dark theme
 * @returns Complete theme object
 */
export const createTheme = (isDark: boolean): Theme => ({
  colors: isDark ? DarkColorScheme : LightColorScheme,
  typography: Typography,
  spacing: Spacing,
  isDark,
});

/**
 * Default dark theme
 */
export const DarkTheme: Theme = createTheme(true);

/**
 * Default light theme
 */
export const LightTheme: Theme = createTheme(false);
