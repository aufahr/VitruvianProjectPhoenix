/**
 * Theme Context and Provider for React Native
 * Provides theme management with light/dark mode support
 * Migrated from Android Kotlin/Jetpack Compose
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
} from 'react';
import {useColorScheme} from 'react-native';
import {Theme, ThemeMode, DarkTheme, LightTheme, createTheme} from './theme';
import {ColorScheme} from './colors';
import {TypographyType} from './typography';
import {SpacingType} from './spacing';

/**
 * Theme Context interface
 */
interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
  toggleTheme: () => void;
}

/**
 * Create Theme Context
 */
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Theme Provider Props
 */
interface ThemeProviderProps {
  children: ReactNode;
  initialThemeMode?: ThemeMode;
}

/**
 * Theme Provider Component
 * Wraps the app and provides theme context to all children
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  initialThemeMode = ThemeMode.SYSTEM,
}) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>(initialThemeMode);

  /**
   * Determine if dark mode should be used
   */
  const isDark = useMemo(() => {
    switch (themeMode) {
      case ThemeMode.SYSTEM:
        return systemColorScheme === 'dark';
      case ThemeMode.LIGHT:
        return false;
      case ThemeMode.DARK:
        return true;
      default:
        return false;
    }
  }, [themeMode, systemColorScheme]);

  /**
   * Create theme based on current mode
   */
  const theme = useMemo(() => createTheme(isDark), [isDark]);

  /**
   * Toggle between light and dark themes
   */
  const toggleTheme = () => {
    setThemeMode(prevMode => {
      if (prevMode === ThemeMode.SYSTEM) {
        return systemColorScheme === 'dark' ? ThemeMode.LIGHT : ThemeMode.DARK;
      }
      return prevMode === ThemeMode.DARK ? ThemeMode.LIGHT : ThemeMode.DARK;
    });
  };

  /**
   * Context value
   */
  const contextValue = useMemo(
    () => ({
      theme,
      themeMode,
      setThemeMode,
      isDark,
      toggleTheme,
    }),
    [theme, themeMode, isDark]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook to use the theme context
 * @throws Error if used outside ThemeProvider
 * @returns Theme context
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/**
 * Hook to get current colors
 * @returns Current color scheme
 */
export const useColors = (): ColorScheme => {
  const {theme} = useTheme();
  return theme.colors;
};

/**
 * Hook to get typography
 * @returns Typography definitions
 */
export const useTypography = (): TypographyType => {
  const {theme} = useTheme();
  return theme.typography;
};

/**
 * Hook to get spacing
 * @returns Spacing constants
 */
export const useSpacing = (): SpacingType => {
  const {theme} = useTheme();
  return theme.spacing;
};

/**
 * Hook to check if dark mode is active
 * @returns Boolean indicating if dark mode is active
 */
export const useIsDark = (): boolean => {
  const {isDark} = useTheme();
  return isDark;
};

/**
 * Hook to get theme mode setter
 * @returns Function to set theme mode
 */
export const useThemeMode = (): [ThemeMode, (mode: ThemeMode) => void] => {
  const {themeMode, setThemeMode} = useTheme();
  return [themeMode, setThemeMode];
};
