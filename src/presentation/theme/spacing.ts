/**
 * Spacing constants based on 8dp grid system
 * Migrated from Android Kotlin/Jetpack Compose
 */

/**
 * Spacing values in pixels (React Native uses density-independent pixels by default)
 * These values match the Android dp system
 */
export const Spacing = {
  extraSmall: 4,
  small: 8,
  medium: 16,
  large: 24,
  extraLarge: 32,
  huge: 48,
} as const;

export type SpacingType = typeof Spacing;
