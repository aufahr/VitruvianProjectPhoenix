/**
 * Typography definitions for the Vitruvian Project Phoenix theme
 * Migrated from Android Kotlin/Jetpack Compose
 * Using React Native TextStyle
 */

import {TextStyle} from 'react-native';

/**
 * Font weights mapped from Compose FontWeight to React Native
 */
export const FontWeight = {
  Normal: '400' as TextStyle['fontWeight'],
  Medium: '500' as TextStyle['fontWeight'],
  SemiBold: '600' as TextStyle['fontWeight'],
  Bold: '700' as TextStyle['fontWeight'],
};

/**
 * Typography using system font with varied weights
 * Matches Material 3 typography scale
 */
export const Typography = {
  // Display styles (large headers)
  displayLarge: {
    fontWeight: FontWeight.Bold,
    fontSize: 57,
    lineHeight: 64,
    letterSpacing: -0.25,
  } as TextStyle,

  displayMedium: {
    fontWeight: FontWeight.Bold,
    fontSize: 45,
    lineHeight: 52,
    letterSpacing: 0,
  } as TextStyle,

  // Headline styles (screen titles)
  headlineLarge: {
    fontWeight: FontWeight.SemiBold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: 0,
  } as TextStyle,

  headlineMedium: {
    fontWeight: FontWeight.SemiBold,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: 0,
  } as TextStyle,

  headlineSmall: {
    fontWeight: FontWeight.SemiBold,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: 0,
  } as TextStyle,

  // Title styles (card headers, section titles)
  titleLarge: {
    fontWeight: FontWeight.SemiBold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 0,
  } as TextStyle,

  titleMedium: {
    fontWeight: FontWeight.Medium,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.15,
  } as TextStyle,

  titleSmall: {
    fontWeight: FontWeight.Medium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
  } as TextStyle,

  // Body styles (content text)
  bodyLarge: {
    fontWeight: FontWeight.Normal,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.5,
  } as TextStyle,

  bodyMedium: {
    fontWeight: FontWeight.Normal,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.25,
  } as TextStyle,

  bodySmall: {
    fontWeight: FontWeight.Normal,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.4,
  } as TextStyle,

  // Label styles (buttons, tabs, form labels)
  labelLarge: {
    fontWeight: FontWeight.Medium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
  } as TextStyle,

  labelMedium: {
    fontWeight: FontWeight.Medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.5,
  } as TextStyle,

  labelSmall: {
    fontWeight: FontWeight.Medium,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.5,
  } as TextStyle,
};

export type TypographyType = typeof Typography;
