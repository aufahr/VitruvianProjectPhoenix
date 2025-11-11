# Navigation System Documentation

## Overview

The Vitruvian Phoenix React Native app uses React Navigation v7 with a hybrid navigation architecture combining Stack and Bottom Tab navigators. This structure mirrors the Android app's navigation pattern while providing iOS-specific optimizations.

## Architecture

```
NavigationContainer (with deep linking)
└── RootStackNavigator (Stack)
    ├── MainTabNavigator (Bottom Tabs)
    │   ├── Home (Workout selection)
    │   ├── Analytics (History, stats, PRs)
    │   └── Settings (App preferences)
    └── Full-screen Screens (Stack)
        ├── JustLift
        ├── SingleExercise
        ├── DailyRoutines
        ├── ActiveWorkout
        ├── WeeklyPrograms
        ├── ProgramBuilder
        └── ConnectionLogs
```

## Navigation Structure

### Bottom Tab Navigator (MainTabNavigator)

Three main tabs accessible from the bottom navigation bar:

1. **Analytics Tab** (Left)
   - Icon: Bar Chart
   - Screen: Analytics history, PRs, trends
   - Route: `/analytics`

2. **Home/Workouts Tab** (Center, Elevated)
   - Icon: Home (larger, emphasized)
   - Screen: Workout type selection
   - Route: `/` (root)
   - Primary landing screen

3. **Settings Tab** (Right)
   - Icon: Settings
   - Screen: App preferences, units, theme
   - Route: `/settings`

### Stack Navigator (RootStackNavigator)

Full-screen navigation for workout flows and detail screens:

#### Workout Flow Screens

- **JustLift** (`/just-lift`)
  - Quick workout setup with minimal configuration
  - Slide animation from right
  - Swipe-to-go-back enabled

- **SingleExercise** (`/single-exercise`)
  - Choose and configure a single exercise
  - Slide animation from right
  - Swipe-to-go-back enabled

- **DailyRoutines** (`/daily-routines`)
  - Browse and select pre-built routines
  - Slide animation from right
  - Swipe-to-go-back enabled

- **ActiveWorkout** (`/active-workout`)
  - Live workout controls during active session
  - Slide animation from right
  - **Swipe-to-go-back DISABLED** (prevents accidental exits)

- **WeeklyPrograms** (`/weekly-programs`)
  - View and manage weekly training programs
  - Slide animation from right
  - Swipe-to-go-back enabled

- **ProgramBuilder** (`/program-builder/:programId?`)
  - Create or edit weekly programs
  - Parameter: `programId` (optional, defaults to "new")
  - Slide animation from right
  - Swipe-to-go-back enabled

#### Settings/Debug Screens

- **ConnectionLogs** (`/connection-logs`)
  - Debug Bluetooth connection logs
  - Accessible from Settings tab
  - Slide animation from right
  - Swipe-to-go-back enabled

## Navigation Patterns

### Opening a Screen

```typescript
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/presentation/navigation/types';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const MyComponent = () => {
  const navigation = useNavigation<NavigationProp>();

  const openJustLift = () => {
    navigation.navigate('JustLift');
  };

  const openProgramBuilder = (programId: string) => {
    navigation.navigate('ProgramBuilder', { programId });
  };

  return (
    // Component JSX
  );
};
```

### Going Back

```typescript
const goBack = () => {
  navigation.goBack();
};

// Or use canGoBack() to check first
const safeGoBack = () => {
  if (navigation.canGoBack()) {
    navigation.goBack();
  } else {
    // Navigate to home or handle as needed
    navigation.navigate('MainTabs');
  }
};
```

### Navigating to a Specific Tab

```typescript
import { useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootStackParamList, MainTabParamList } from '@/presentation/navigation/types';

type NavProp = CompositeNavigationProp<
  StackNavigationProp<RootStackParamList>,
  BottomTabNavigationProp<MainTabParamList>
>;

const MyComponent = () => {
  const navigation = useNavigation<NavProp>();

  const goToAnalytics = () => {
    navigation.navigate('MainTabs', {
      screen: 'Analytics',
    });
  };

  return (
    // Component JSX
  );
};
```

## Deep Linking (iOS)

### URL Scheme Support

The app supports both custom URL schemes and universal links:

- **Custom Scheme**: `vitruvianphoenix://`
- **Universal Links**: `https://vitruvian.app/*` and `https://*.vitruvian.app/*`

### Deep Link Examples

```
vitruvianphoenix://just-lift
vitruvianphoenix://single-exercise
vitruvianphoenix://daily-routines
vitruvianphoenix://active-workout
vitruvianphoenix://weekly-programs
vitruvianphoenix://program-builder/123
vitruvianphoenix://program-builder/new
vitruvianphoenix://analytics
vitruvianphoenix://settings
vitruvianphoenix://connection-logs
```

### iOS Universal Links Configuration

Add to `ios/VitruvianPhoenix/Info.plist`:

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>vitruvianphoenix</string>
    </array>
  </dict>
</array>
```

Add Associated Domains entitlement in Xcode:
- `applinks:vitruvian.app`
- `applinks:*.vitruvian.app`

## Screen Transitions

### Horizontal Slide (Default)

Most screens use horizontal slide transitions matching iOS conventions:
- Enter: Slide in from right
- Exit: Slide out to right
- Supports swipe-to-go-back gesture

### Gesture Configuration

- **Enabled**: Most screens support swipe-to-go-back
- **Disabled**:
  - MainTabs (bottom navigation)
  - ActiveWorkout (prevents accidental exits during workouts)

## TypeScript Types

### Screen Props

Every screen receives typed navigation and route props:

```typescript
import { RootStackScreenProps } from '@/presentation/navigation/types';

type Props = RootStackScreenProps<'ProgramBuilder'>;

const ProgramBuilderScreen: React.FC<Props> = ({ navigation, route }) => {
  const { programId } = route.params;

  // Fully typed navigation and params
  navigation.navigate('WeeklyPrograms');

  return (
    // Component JSX
  );
};
```

### Param Lists

- `RootStackParamList`: All screens in the root stack
- `MainTabParamList`: Three main tab screens

## Screen Components Checklist

### Status: To Be Implemented

The following screen components need to be created in `/src/presentation/screens/`:

- [ ] `HomeScreen.tsx` - Workout type selection
- [ ] `AnalyticsScreen.tsx` - History, PRs, trends
- [ ] `SettingsScreen.tsx` - App preferences
- [ ] `JustLiftScreen.tsx` - Quick workout setup
- [ ] `SingleExerciseScreen.tsx` - Single exercise configuration
- [ ] `DailyRoutinesScreen.tsx` - Routine selection
- [ ] `ActiveWorkoutScreen.tsx` - Live workout controls
- [ ] `WeeklyProgramsScreen.tsx` - Program management
- [ ] `ProgramBuilderScreen.tsx` - Program creation/editing
- [ ] `ConnectionLogsScreen.tsx` - BLE debug logs

### Current State

All screens are currently using placeholder components. As screens are implemented, replace the placeholder imports in `RootNavigator.tsx` with actual screen imports.

## Migration from Android

### Mapping Android to React Native Navigation

| Android Component | React Native Equivalent |
|-------------------|-------------------------|
| `NavigationRoutes.kt` | `types.ts` (SCREEN_NAMES) |
| `NavGraph.kt` | `RootNavigator.tsx` |
| `BottomNavItem` enum | `MainTabParamList` type |
| Jetpack Compose Navigation | React Navigation |
| `NavController` | `useNavigation()` hook |
| `composable()` | `<Stack.Screen>` / `<Tab.Screen>` |

### Key Differences

1. **State Management**: Android uses Hilt/ViewModels; React Native will use Zustand
2. **Animations**: Android uses Compose animations; React Native uses Reanimated
3. **Deep Linking**: Android uses intent filters; iOS uses Associated Domains
4. **Back Button**: Android has hardware back; iOS uses swipe gestures

## Testing Navigation

### Unit Testing

```typescript
import { NavigationContainer } from '@react-navigation/native';
import { render } from '@testing-library/react-native';

// Wrap component with NavigationContainer for testing
const renderWithNavigation = (component: React.ReactElement) => {
  return render(
    <NavigationContainer>
      {component}
    </NavigationContainer>
  );
};
```

### Integration Testing

Test navigation flows:
- Tab switching
- Stack push/pop
- Deep link handling
- Back button behavior

## Best Practices

1. **Always use typed navigation**: Import and use `RootStackScreenProps` or `MainTabScreenProps`
2. **Check canGoBack()**: Before calling `goBack()` to avoid crashes
3. **Use SCREEN_NAMES**: Import constants instead of hardcoding strings
4. **Handle deep links**: Test all deep link routes on both schemes
5. **Disable gestures carefully**: Only disable swipe-to-go-back when absolutely necessary
6. **Test on iOS**: Verify swipe gestures and tab bar behavior on physical devices

## Troubleshooting

### Issue: Navigation not working

- Verify NavigationContainer is at the root of your app
- Check that all screen names match the param list types
- Ensure react-navigation dependencies are installed

### Issue: Deep links not working

- Verify Info.plist configuration
- Check Associated Domains entitlement
- Test with `xcrun simctl openurl booted vitruvianphoenix://just-lift`

### Issue: Swipe-to-go-back not working

- Check `gestureEnabled` is not set to `false`
- Verify `gestureDirection` is set to `'horizontal'`
- Ensure `react-native-gesture-handler` is properly installed

## Future Enhancements

- [ ] Add modal presentation for dialogs (Exercise edit, Routine builder)
- [ ] Implement custom tab bar animations (matching Android's active indicator)
- [ ] Add navigation state persistence (survive app restarts)
- [ ] Implement deep link analytics tracking
- [ ] Add accessibility labels for navigation elements
- [ ] Implement dynamic tab badge counts (e.g., pending workouts)

## Related Files

- `/src/presentation/navigation/types.ts` - TypeScript types and constants
- `/src/presentation/navigation/RootNavigator.tsx` - Main navigator component
- `/src/presentation/navigation/index.ts` - Module exports
- `/ios/VitruvianPhoenix/Info.plist` - iOS URL scheme configuration
- `/android/app/src/main/AndroidManifest.xml` - Android intent filters (if needed)
