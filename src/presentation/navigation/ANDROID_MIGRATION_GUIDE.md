# Android to React Native Navigation Migration Guide

## Overview

This guide maps the Android (Kotlin/Jetpack Compose) navigation structure to the React Native implementation, helping developers understand the equivalencies and differences.

## Navigation Component Mapping

### Core Navigation Files

| Android (Kotlin) | React Native (TypeScript) | Purpose |
|------------------|---------------------------|---------|
| `NavigationRoutes.kt` | `types.ts` | Route definitions and constants |
| `NavGraph.kt` | `RootNavigator.tsx` | Main navigation graph/tree |
| `BottomNavItem` enum | `MainTabParamList` type | Bottom tab definitions |
| `MainActivity.kt` | `App.tsx` (root) | App entry point |
| `EnhancedMainScreen.kt` | `RootNavigator.tsx` | Main screen with tabs/navigation |

### Navigation Components

| Android | React Native | Notes |
|---------|--------------|-------|
| `NavController` | `useNavigation()` hook | Access navigation object |
| `navController.navigate()` | `navigation.navigate()` | Navigate to screen |
| `navController.popBackStack()` | `navigation.goBack()` | Go back one screen |
| `composable()` | `<Stack.Screen>` or `<Tab.Screen>` | Define a screen route |
| `NavHost` | `<Stack.Navigator>` or `<Tab.Navigator>` | Container for routes |
| `remember { mutableStateOf() }` | `useState()` | Local state management |
| `collectAsState()` | Custom hook with Zustand | Global state observation |

## Screen Route Mapping

### All Screens (10 main screens)

| Android Route | React Native Route | Screen Name | Component File (Android) | Component File (React Native - TBD) |
|---------------|-------------------|-------------|-------------------------|-------------------------------------|
| `home` | `Home` | Home/Workout Selection | `HomeScreen.kt` | `HomeScreen.tsx` |
| `just_lift` | `JustLift` | Quick Lift Setup | `JustLiftScreen.kt` | `JustLiftScreen.tsx` |
| `single_exercise` | `SingleExercise` | Single Exercise Config | `SingleExerciseScreen.kt` | `SingleExerciseScreen.tsx` |
| `daily_routines` | `DailyRoutines` | Routine Browser | `DailyRoutinesScreen.kt` | `DailyRoutinesScreen.tsx` |
| `active_workout` | `ActiveWorkout` | Live Workout Controls | `ActiveWorkoutScreen.kt` | `ActiveWorkoutScreen.tsx` |
| `weekly_programs` | `WeeklyPrograms` | Program Manager | `WeeklyProgramsScreen.kt` | `WeeklyProgramsScreen.tsx` |
| `program_builder/{programId}` | `ProgramBuilder` | Program Builder | `ProgramBuilderScreen.kt` | `ProgramBuilderScreen.tsx` |
| `analytics` | `Analytics` | Analytics Dashboard | `AnalyticsScreen.kt` | `AnalyticsScreen.tsx` |
| `settings` | `Settings` | Settings/Preferences | `HistoryAndSettingsTabs.kt` (SettingsTab) | `SettingsScreen.tsx` |
| `connection_logs` | `ConnectionLogs` | BLE Debug Logs | `ConnectionLogsScreen.kt` | `ConnectionLogsScreen.tsx` |

### Bottom Tab Structure

#### Android (EnhancedMainScreen.kt)
```kotlin
BottomAppBar {
  // LEFT: Analytics (small)
  IconButton(onClick = { navController.navigate("analytics") })

  // CENTER: Workouts (LARGER - FloatingActionButton)
  FloatingActionButton(onClick = { navController.navigate("home") })

  // RIGHT: Settings (small)
  IconButton(onClick = { navController.navigate("settings") })
}
```

#### React Native (RootNavigator.tsx)
```typescript
<Tab.Navigator>
  {/* LEFT: Analytics Tab */}
  <Tab.Screen name="Analytics" component={AnalyticsScreen} />

  {/* CENTER: Home/Workout Tab (Elevated FAB style) */}
  <Tab.Screen name="Home" component={HomeScreen} />

  {/* RIGHT: Settings Tab */}
  <Tab.Screen name="Settings" component={SettingsScreen} />
</Tab.Navigator>
```

## Navigation Pattern Comparisons

### Pattern 1: Navigate to a Screen

**Android (Kotlin)**
```kotlin
navController.navigate(NavigationRoutes.JustLift.route)
```

**React Native (TypeScript)**
```typescript
navigation.navigate('JustLift');
```

### Pattern 2: Navigate with Parameters

**Android (Kotlin)**
```kotlin
navController.navigate(NavigationRoutes.ProgramBuilder.createRoute(programId))
// or
navController.navigate("program_builder/$programId")
```

**React Native (TypeScript)**
```typescript
navigation.navigate('ProgramBuilder', { programId });
```

### Pattern 3: Navigate and Clear Back Stack

**Android (Kotlin)**
```kotlin
navController.navigate(NavigationRoutes.Home.route) {
  popUpTo(NavigationRoutes.Home.route)
  launchSingleTop = true
  restoreState = true
}
```

**React Native (TypeScript)**
```typescript
navigation.navigate('Home', {
  // This is handled differently in React Navigation
  // Use reset() for complete stack replacement
});

// Or use reset for complete control:
navigation.reset({
  index: 0,
  routes: [{ name: 'MainTabs' }],
});
```

### Pattern 4: Go Back

**Android (Kotlin)**
```kotlin
navController.popBackStack()
```

**React Native (TypeScript)**
```typescript
navigation.goBack();

// Or with safety check:
if (navigation.canGoBack()) {
  navigation.goBack();
}
```

### Pattern 5: Get Current Route

**Android (Kotlin)**
```kotlin
var currentRoute by remember { mutableStateOf(NavigationRoutes.Home.route) }

LaunchedEffect(navController) {
  navController.currentBackStackEntryFlow.collect { backStackEntry ->
    currentRoute = backStackEntry.destination.route ?: NavigationRoutes.Home.route
  }
}
```

**React Native (TypeScript)**
```typescript
import { useRoute, useNavigationState } from '@react-navigation/native';

const route = useRoute();
const currentRouteName = route.name;

// Or get the full navigation state:
const currentRouteName = useNavigationState(state => {
  return state.routes[state.index].name;
});
```

## Animation Mapping

### Android Compose Animations

```kotlin
composable(
  route = NavigationRoutes.JustLift.route,
  enterTransition = {
    slideIntoContainer(
      towards = AnimatedContentTransitionScope.SlideDirection.Left,
      animationSpec = tween(300)
    )
  },
  exitTransition = {
    slideOutOfContainer(
      towards = AnimatedContentTransitionScope.SlideDirection.Left,
      animationSpec = tween(300)
    )
  }
)
```

### React Navigation Animations

```typescript
<Stack.Screen
  name="JustLift"
  component={JustLiftScreen}
  options={{
    cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
    // This gives the slide-from-right animation like iOS
    // Other options:
    // - forVerticalIOS (slide from bottom)
    // - forModalPresentationIOS (modal)
    // - forFadeFromBottomAndroid
    // - forRevealFromBottomAndroid
  }}
/>
```

### Animation Comparison Table

| Android Compose | React Navigation | Effect |
|----------------|------------------|--------|
| `slideIntoContainer(Left)` | `forHorizontalIOS` | Slide from right |
| `slideIntoContainer(Up)` | `forVerticalIOS` | Slide from bottom |
| `fadeIn` | `forFadeFromCenter` | Fade in |
| `slideIn + fadeIn` | Combined interpolator | Custom combo |

## State Management Migration

### Android ViewModel Pattern

```kotlin
@HiltViewModel
class MainViewModel @Inject constructor(...) : ViewModel() {
  private val _connectionState = MutableStateFlow<ConnectionState>(...)
  val connectionState: StateFlow<ConnectionState> = _connectionState.asStateFlow()

  fun connect() { ... }
}

// Usage in Composable:
@Composable
fun HomeScreen(viewModel: MainViewModel = hiltViewModel()) {
  val connectionState by viewModel.connectionState.collectAsState()
}
```

### React Native Zustand Pattern

```typescript
// Create store
import create from 'zustand';

interface MainStore {
  connectionState: ConnectionState;
  connect: () => void;
}

export const useMainStore = create<MainStore>((set) => ({
  connectionState: ConnectionState.Disconnected,
  connect: () => { ... },
}));

// Usage in Component:
const HomeScreen = () => {
  const connectionState = useMainStore(state => state.connectionState);
  const connect = useMainStore(state => state.connect);

  return (
    // Component JSX
  );
};
```

## Screen Props Pattern

### Android

```kotlin
@Composable
fun ProgramBuilderScreen(
  navController: NavController,
  viewModel: MainViewModel,
  programId: String,
  exerciseRepository: ExerciseRepository
) {
  // Screen content
}
```

### React Native

```typescript
import { RootStackScreenProps } from '@/presentation/navigation/types';

type Props = RootStackScreenProps<'ProgramBuilder'>;

const ProgramBuilderScreen: React.FC<Props> = ({ navigation, route }) => {
  const { programId } = route.params;

  // Screen content
};
```

## Key Differences to Note

### 1. Navigation State Persistence

**Android**: Jetpack Navigation automatically handles state persistence
**React Native**: Requires manual implementation with AsyncStorage or similar

### 2. Back Button Handling

**Android**: Hardware back button built-in
**React Native iOS**: No hardware back button; relies on swipe gestures and UI back buttons

### 3. Deep Linking

**Android**: Uses AndroidManifest.xml intent filters
```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <data android:scheme="vitruvianphoenix" />
</intent-filter>
```

**React Native iOS**: Uses Info.plist and Associated Domains
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

### 4. UI Component Libraries

| Android | React Native |
|---------|--------------|
| Material 3 (Jetpack Compose) | Custom components or libraries like React Native Paper |
| `Button`, `Card`, `Surface` | Custom styled components |
| `Icon` from Material Icons | `react-native-vector-icons/MaterialIcons` |

### 5. Theming

**Android**: Material 3 ColorScheme
```kotlin
MaterialTheme(colorScheme = colorScheme) {
  // Content
}
```

**React Native**: Custom ThemeContext
```typescript
<ThemeProvider value={theme}>
  {/* Content */}
</ThemeProvider>
```

## Testing Navigation

### Android (Compose)

```kotlin
@Test
fun testNavigation() {
  val navController = TestNavHostController(ApplicationProvider.getApplicationContext())

  composeTestRule.setContent {
    NavHost(navController = navController, startDestination = "home") {
      composable("home") { HomeScreen(navController) }
    }
  }

  // Test navigation
}
```

### React Native

```typescript
import { NavigationContainer } from '@react-navigation/native';
import { render } from '@testing-library/react-native';

describe('Navigation', () => {
  it('navigates to JustLift screen', () => {
    const { getByText } = render(
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    );

    // Test navigation
  });
});
```

## Migration Checklist

When migrating a screen from Android to React Native:

- [ ] Create screen component file (`.tsx`)
- [ ] Add route to `RootStackParamList` in `types.ts`
- [ ] Add screen to `RootNavigator.tsx`
- [ ] Import and use `useNavigation()` hook for navigation
- [ ] Convert ViewModel to Zustand store
- [ ] Convert Compose UI to React Native components
- [ ] Test navigation flow
- [ ] Test deep linking (if applicable)
- [ ] Add screen animation preferences
- [ ] Test back navigation behavior
- [ ] Update this guide with any new patterns

## Additional Resources

- [React Navigation Documentation](https://reactnavigation.org/docs/getting-started)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [React Native TypeScript Guide](https://reactnative.dev/docs/typescript)
- [Jetpack Compose Navigation](https://developer.android.com/jetpack/compose/navigation)

## Common Issues and Solutions

### Issue: Type errors with navigation params

**Solution**: Always use typed navigation props:
```typescript
import { RootStackScreenProps } from '@/presentation/navigation/types';
type Props = RootStackScreenProps<'ScreenName'>;
```

### Issue: Navigation not working after migrating

**Solution**: Check that:
1. Screen is registered in `RootStackParamList`
2. Screen is added to navigator in `RootNavigator.tsx`
3. Screen name string exactly matches the type definition

### Issue: Animation direction wrong

**Solution**: Use appropriate `CardStyleInterpolator`:
- `forHorizontalIOS` - slide from right (most common)
- `forVerticalIOS` - slide from bottom
- `forModalPresentationIOS` - modal style

### Issue: Cannot access route params

**Solution**: Make sure params are defined in param list:
```typescript
export type RootStackParamList = {
  ScreenName: {
    paramName: string;
  };
};
```

## Version Compatibility

| Library | Android Version | React Native Version |
|---------|----------------|---------------------|
| Navigation | Jetpack Compose Navigation 2.7.x | React Navigation 7.x |
| State Management | Hilt + ViewModels | Zustand 5.x |
| UI Framework | Jetpack Compose 1.5.x | React Native 0.76.x |
| Animations | Compose Animations | React Native Reanimated 3.x |
