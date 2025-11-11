/**
 * Color definitions for the Vitruvian Project Phoenix theme
 * Migrated from Android Kotlin/Jetpack Compose
 */

// Background Colors (Dark Theme)
export const BackgroundBlack = '#000000';          // Pure black background
export const BackgroundDarkGrey = '#121212';       // Dark grey surface
export const SurfaceDarkGrey = '#1E1E1E';         // Elevated surfaces
export const CardBackground = '#252525';           // Card backgrounds

// Light Theme Colors
export const ColorLightBackground = '#F8F9FB';     // Soft light background
export const ColorOnLightBackground = '#0F172A';   // Slate-900 like text
export const ColorLightSurface = '#FFFFFF';        // White surface
export const ColorOnLightSurface = '#111827';      // Dark text on surface
export const ColorLightSurfaceVariant = '#F3F4F6'; // Light gray surface variant
export const ColorOnLightSurfaceVariant = '#6B7280'; // Gray-500 text

// Purple Accent Colors
export const PrimaryPurple = '#BB86FC';           // Primary purple (Material 3 style)
export const SecondaryPurple = '#9965F4';         // Deeper purple
export const TertiaryPurple = '#E0BBF7';          // Light purple for highlights
export const PurpleAccent = '#7E57C2';            // Accent purple for buttons

// TopAppBar Colors (darker for better contrast)
export const TopAppBarDark = '#1A0E26';           // Very dark purple for dark mode header
export const TopAppBarLight = '#4A2F8A';          // Darker purple for light mode header

// Text Colors
export const TextPrimary = '#FFFFFF';             // Pure white text
export const TextSecondary = '#E0E0E0';           // Light grey text
export const TextTertiary = '#B0B0B0';            // Medium grey text
export const TextDisabled = '#707070';            // Disabled text

// Status Colors
export const SuccessGreen = '#4CAF50';            // Success states
export const ErrorRed = '#F44336';                // Error states
export const WarningOrange = '#FF9800';           // Warning states
export const InfoBlue = '#2196F3';                // Info states

// Legacy colors (kept for compatibility)
export const Purple80 = PrimaryPurple;
export const PurpleGrey80 = SecondaryPurple;
export const Pink80 = TertiaryPurple;
export const Purple40 = PurpleAccent;
export const PurpleGrey40 = '#625b71';
export const Pink40 = '#7D5260';

/**
 * Helper function to convert hex color to rgba
 * @param hex - Hex color string (e.g., '#FF0000')
 * @param alpha - Alpha value (0-1)
 * @returns RGBA color string
 */
export const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * Dark Color Scheme
 */
export const DarkColorScheme = {
  primary: PrimaryPurple,
  onPrimary: BackgroundBlack,
  primaryContainer: PurpleAccent,
  onPrimaryContainer: TextPrimary,

  secondary: SecondaryPurple,
  onSecondary: BackgroundBlack,
  secondaryContainer: SecondaryPurple,
  onSecondaryContainer: TextPrimary,

  tertiary: TertiaryPurple,
  onTertiary: BackgroundBlack,
  tertiaryContainer: TertiaryPurple,
  onTertiaryContainer: TextPrimary,

  background: BackgroundBlack,
  onBackground: TextPrimary,

  surface: SurfaceDarkGrey,
  onSurface: TextPrimary,
  surfaceVariant: CardBackground,
  onSurfaceVariant: TextSecondary,

  error: ErrorRed,
  onError: TextPrimary,

  outline: TextTertiary,
  outlineVariant: TextDisabled,

  // Additional utility colors
  success: SuccessGreen,
  warning: WarningOrange,
  info: InfoBlue,
  topAppBar: TopAppBarDark,
};

/**
 * Light Color Scheme
 */
export const LightColorScheme = {
  primary: TertiaryPurple,                    // Light purple for buttons
  onPrimary: ColorOnLightBackground,          // Dark text on light buttons
  primaryContainer: TertiaryPurple,           // Light purple container
  onPrimaryContainer: ColorOnLightBackground,

  secondary: TertiaryPurple,                  // Light purple for secondary elements
  onSecondary: ColorOnLightBackground,        // Dark text
  secondaryContainer: TertiaryPurple,
  onSecondaryContainer: ColorOnLightBackground,

  tertiary: hexToRgba(InfoBlue, 0.3),        // Light blue
  onTertiary: ColorOnLightBackground,
  tertiaryContainer: hexToRgba(InfoBlue, 0.15),
  onTertiaryContainer: ColorOnLightBackground,

  background: ColorLightBackground,
  onBackground: ColorOnLightBackground,

  surface: ColorLightSurface,
  onSurface: ColorOnLightSurface,
  surfaceVariant: ColorLightSurfaceVariant,
  onSurfaceVariant: ColorOnLightSurfaceVariant,

  error: ErrorRed,
  onError: ColorLightSurface,                 // White text on red error

  outline: hexToRgba(ColorOnLightSurfaceVariant, 0.6),
  outlineVariant: hexToRgba(ColorOnLightSurfaceVariant, 0.4),

  // Additional utility colors
  success: SuccessGreen,
  warning: WarningOrange,
  info: InfoBlue,
  topAppBar: TopAppBarLight,
};

export type ColorScheme = typeof DarkColorScheme;
