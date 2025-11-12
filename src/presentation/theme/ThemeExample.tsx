/**
 * Theme Usage Example
 * Demonstrates how to use the migrated theme system in React Native
 */

import React from 'react';
import {View, Text, Button, StyleSheet} from 'react-native';
import {
  ThemeProvider,
  useTheme,
  useColors,
  useTypography,
  useSpacing,
  ThemeMode,
} from './index';

/**
 * Example component demonstrating theme usage
 */
const ThemedComponent: React.FC = () => {
  const {theme, themeMode, setThemeMode, isDark, toggleTheme} = useTheme();
  const colors = useColors();
  const typography = useTypography();
  const spacing = useSpacing();

  return (
    <View
      style={[
        styles.container,
        {backgroundColor: colors.background, padding: spacing.medium},
      ]}>
      <Text
        style={[
          typography.headlineLarge,
          {color: colors.onBackground, marginBottom: spacing.small},
        ]}>
        Theme System Demo
      </Text>

      <Text
        style={[
          typography.bodyLarge,
          {color: colors.onSurface, marginBottom: spacing.medium},
        ]}>
        Current mode: {themeMode} ({isDark ? 'Dark' : 'Light'})
      </Text>

      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            padding: spacing.medium,
            marginBottom: spacing.small,
          },
        ]}>
        <Text style={[typography.titleMedium, {color: colors.onSurface}]}>
          Surface Card
        </Text>
        <Text style={[typography.bodyMedium, {color: colors.onSurfaceVariant}]}>
          This card uses surface colors from the theme
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Toggle Theme" onPress={toggleTheme} />
        <Button
          title="Set Light"
          onPress={() => setThemeMode(ThemeMode.LIGHT)}
        />
        <Button title="Set Dark" onPress={() => setThemeMode(ThemeMode.DARK)} />
        <Button
          title="Set System"
          onPress={() => setThemeMode(ThemeMode.SYSTEM)}
        />
      </View>

      {/* Color Palette Preview */}
      <View style={{marginTop: spacing.large}}>
        <Text
          style={[
            typography.titleMedium,
            {color: colors.onBackground, marginBottom: spacing.small},
          ]}>
          Color Palette
        </Text>
        <View style={styles.colorRow}>
          <View
            style={[
              styles.colorBox,
              {backgroundColor: colors.primary},
            ]}
          />
          <View
            style={[
              styles.colorBox,
              {backgroundColor: colors.secondary},
            ]}
          />
          <View
            style={[
              styles.colorBox,
              {backgroundColor: colors.tertiary},
            ]}
          />
          <View
            style={[
              styles.colorBox,
              {backgroundColor: colors.error},
            ]}
          />
        </View>
      </View>

      {/* Typography Preview */}
      <View style={{marginTop: spacing.large}}>
        <Text
          style={[
            typography.titleMedium,
            {color: colors.onBackground, marginBottom: spacing.small},
          ]}>
          Typography Scale
        </Text>
        <Text style={[typography.displayMedium, {color: colors.onBackground}]}>
          Display
        </Text>
        <Text style={[typography.headlineMedium, {color: colors.onBackground}]}>
          Headline
        </Text>
        <Text style={[typography.titleMedium, {color: colors.onBackground}]}>
          Title
        </Text>
        <Text style={[typography.bodyMedium, {color: colors.onBackground}]}>
          Body text
        </Text>
        <Text style={[typography.labelMedium, {color: colors.onBackground}]}>
          Label
        </Text>
      </View>
    </View>
  );
};

/**
 * Example App with ThemeProvider
 */
const ThemeExampleApp: React.FC = () => {
  return (
    <ThemeProvider initialThemeMode={ThemeMode.SYSTEM}>
      <ThemedComponent />
    </ThemeProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    borderRadius: 8,
  },
  buttonContainer: {
    gap: 8,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  colorBox: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
});

export default ThemeExampleApp;
