/**
 * HomeScreen - Main landing screen for workout type selection
 * Migrated from Android Compose HomeScreen.kt
 *
 * Features:
 * - Workout mode selection (Just Lift, Single Exercise, Daily Routines, Weekly Programs)
 * - Connection status banner when not connected
 * - Gradient background (dark/light theme support)
 * - Auto-connect overlay and error dialogs
 * - Navigation to workout screens
 */

import React, {useCallback, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

import {RootStackParamList, SCREEN_NAMES} from '../navigation/types';
import {useColors, useTypography, useSpacing, useIsDark} from '../theme';
import {useBleConnection} from '../hooks/useBleConnection';
import {Card} from '../components/Card';
import {ConnectionStatusBanner} from '../components/ConnectionStatusBanner';
import {ConnectingOverlay} from '../components/ConnectingOverlay';
import {ConnectionErrorDialog} from '../components/ConnectionErrorDialog';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

/**
 * Workout mode card configuration
 */
interface WorkoutModeConfig {
  title: string;
  description: string;
  iconName: string;
  gradientColors: [string, string]; // Start and end colors for gradient effect
  route: keyof RootStackParamList;
}

/**
 * HomeScreen Component
 */
export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const colors = useColors();
  const typography = useTypography();
  const spacing = useSpacing();
  const isDark = useIsDark();

  // BLE connection state
  const {
    connectionState,
    isAutoConnecting,
    connectionError,
    autoConnect,
    clearConnectionError,
  } = useBleConnection();

  const isConnected = connectionState.type === 'connected';

  /**
   * Workout mode configurations
   * Colors match Android Compose gradients (purple-500 to purple-700, etc.)
   */
  const workoutModes: WorkoutModeConfig[] = [
    {
      title: 'Just Lift',
      description: 'Quick setup, start lifting immediately',
      iconName: 'fitness-center',
      gradientColors: ['#9333EA', '#7E22CE'], // purple-500 to purple-700
      route: SCREEN_NAMES.JUST_LIFT,
    },
    {
      title: 'Single Exercise',
      description: 'Perform one exercise with custom configuration',
      iconName: 'play-arrow',
      gradientColors: ['#8B5CF6', '#9333EA'], // violet-500 to purple-600
      route: SCREEN_NAMES.SINGLE_EXERCISE,
    },
    {
      title: 'Daily Routines',
      description: 'Choose from your saved multi-exercise routines',
      iconName: 'calendar-today',
      gradientColors: ['#6366F1', '#8B5CF6'], // indigo-500 to violet-600
      route: SCREEN_NAMES.DAILY_ROUTINES,
    },
    {
      title: 'Weekly Programs',
      description: 'Follow a structured weekly training schedule',
      iconName: 'date-range',
      gradientColors: ['#3B82F6', '#6366F1'], // blue-500 to indigo-600
      route: SCREEN_NAMES.WEEKLY_PROGRAMS,
    },
  ];

  /**
   * Navigate to workout screen
   */
  const handleWorkoutModePress = useCallback(
    (route: keyof RootStackParamList) => {
      navigation.navigate(route);
    },
    [navigation]
  );

  /**
   * Handle manual connection attempt
   */
  const handleConnectPress = useCallback(async () => {
    await autoConnect(30000); // 30 second timeout
  }, [autoConnect]);

  /**
   * Background gradient colors based on theme
   * Dark: slate-900 -> indigo-950 -> blue-950
   * Light: indigo-200 -> pink-100 -> violet-200
   */
  const backgroundGradientColors = isDark
    ? ['#0F172A', '#1E1B4B', '#172554']
    : ['#E0E7FF', '#FCE7F3', '#DDD6FE'];

  return (
    <View style={[styles.container, {backgroundColor: backgroundGradientColors[0]}]}>
      {/* Gradient background effect using layered views */}
      <View style={[styles.gradientLayer, {backgroundColor: backgroundGradientColors[1]}]} />
      <View style={[styles.gradientLayer, {backgroundColor: backgroundGradientColors[2]}]} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, {padding: spacing.large}]}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text
          style={[
            typography.headlineSmall,
            {
              color: colors.onSurface,
              fontWeight: 'bold',
              marginBottom: spacing.medium,
            },
          ]}>
          Start a workout
        </Text>

        {/* Connection Status Banner - only show when not connected */}
        {!isConnected && (
          <ConnectionStatusBanner
            onConnect={handleConnectPress}
            message="Not connected to machine"
            testID="home-connection-banner"
          />
        )}

        {/* Workout Mode Cards */}
        {workoutModes.map((mode, index) => (
          <WorkoutCard
            key={mode.route}
            config={mode}
            onPress={() => handleWorkoutModePress(mode.route)}
            style={{marginBottom: spacing.medium}}
          />
        ))}

        {/* Bottom spacing for better scrolling */}
        <View style={{height: spacing.extraLarge}} />
      </ScrollView>

      {/* Auto-connect overlay */}
      <ConnectingOverlay
        visible={isAutoConnecting}
        title="Connecting to device..."
        subtitle="Scanning for Vitruvian Trainer"
        testID="home-connecting-overlay"
      />

      {/* Connection error dialog */}
      <ConnectionErrorDialog
        visible={!!connectionError}
        message={connectionError || ''}
        onDismiss={clearConnectionError}
        onRetry={handleConnectPress}
        testID="home-connection-error"
      />
    </View>
  );
};

/**
 * Workout Card Component
 * Compact card with gradient icon, title, description, and arrow
 * Matches Android Compose design with 64dp icon and animations
 */
interface WorkoutCardProps {
  config: WorkoutModeConfig;
  onPress: () => void;
  style?: any;
}

const WorkoutCard: React.FC<WorkoutCardProps> = ({config, onPress, style}) => {
  const colors = useColors();
  const typography = useTypography();
  const spacing = useSpacing();

  // Press animation
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      damping: 15,
      stiffness: 400,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 15,
      stiffness: 400,
    }).start();
  };

  return (
    <Animated.View style={[{transform: [{scale: scaleAnim}]}, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={`Select ${config.title} workout`}>
        <Card
          style={styles.workoutCard}
          elevation={4}
          borderWidth={1}
          borderRadius={16}>
          <View style={styles.workoutCardContent}>
            {/* Gradient Icon Container (64dp) */}
            <View
              style={[
                styles.iconContainer,
                {
                  // Use first gradient color as background
                  backgroundColor: config.gradientColors[0],
                },
              ]}>
              <Icon
                name={config.iconName}
                size={32}
                color={colors.onPrimary}
              />
            </View>

            {/* Content Column */}
            <View style={styles.textContainer}>
              <Text
                style={[
                  typography.titleMedium,
                  {
                    color: colors.onSurface,
                    fontWeight: 'bold',
                    marginBottom: spacing.extraSmall,
                  },
                ]}>
                {config.title}
              </Text>
              <Text
                style={[
                  typography.bodySmall,
                  {color: colors.onSurfaceVariant},
                ]}>
                {config.description}
              </Text>
            </View>

            {/* Arrow Icon */}
            <View style={[styles.arrowContainer, {backgroundColor: '#F5F3FF'}]}>
              <Icon
                name="arrow-forward"
                size={16}
                color="#9333EA" // purple-500
              />
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientLayer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: Platform.OS === 'android' ? 20 : 0,
  },
  workoutCard: {
    width: '100%',
  },
  workoutCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  textContainer: {
    flex: 1,
  },
  arrowContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HomeScreen;
