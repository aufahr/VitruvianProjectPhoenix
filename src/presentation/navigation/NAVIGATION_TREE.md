# Navigation Tree Structure

## Visual Hierarchy

```
App.tsx
└── NavigationContainer (Deep Linking Enabled)
    └── RootStackNavigator (Stack)
        ├── MainTabNavigator (Bottom Tabs) ⭐ Default Screen
        │   ├── Analytics Tab (Left)
        │   │   └── AnalyticsScreen
        │   │       - Workout history
        │   │       - Personal records (PRs)
        │   │       - Progress trends
        │   │       - Statistics charts
        │   │
        │   ├── Home Tab (Center, Elevated FAB Style) ⭐ Landing Screen
        │   │   └── HomeScreen
        │   │       - Just Lift card → navigates to JustLift
        │   │       - Single Exercise card → navigates to SingleExercise
        │   │       - Daily Routines card → navigates to DailyRoutines
        │   │       - Weekly Programs card → navigates to WeeklyPrograms
        │   │       - Active Program widget (if set)
        │   │       - Quick stats overview
        │   │
        │   └── Settings Tab (Right)
        │       └── SettingsScreen
        │           - Weight unit preferences (kg/lbs)
        │           - Workout preferences
        │           - Autoplay settings
        │           - Stop at top toggle
        │           - LED color scheme
        │           - Data management (delete all)
        │           - Connection logs button → navigates to ConnectionLogs
        │           - App info
        │
        ├── JustLiftScreen (Pushed onto Stack)
        │   - Quick workout configuration
        │   - Exercise selection
        │   - Weight/reps setup
        │   - Start workout → navigates to ActiveWorkout
        │   - Swipe back enabled ✓
        │
        ├── SingleExerciseScreen (Pushed onto Stack)
        │   - Single exercise browser
        │   - Exercise details
        │   - Configuration options
        │   - Start exercise → navigates to ActiveWorkout
        │   - Swipe back enabled ✓
        │
        ├── DailyRoutinesScreen (Pushed onto Stack)
        │   - Browse saved routines
        │   - Routine details
        │   - Edit routine
        │   - Start routine → navigates to ActiveWorkout
        │   - Create new routine
        │   - Swipe back enabled ✓
        │
        ├── ActiveWorkoutScreen (Pushed onto Stack)
        │   - Live workout controls
        │   - Set/rep counter
        │   - Weight display
        │   - Timer controls
        │   - Exercise progression
        │   - End workout button
        │   - Swipe back DISABLED ✗ (prevents accidental exits)
        │
        ├── WeeklyProgramsScreen (Pushed onto Stack)
        │   - View all programs
        │   - Set active program
        │   - Edit program → navigates to ProgramBuilder
        │   - Create new program → navigates to ProgramBuilder
        │   - Delete program
        │   - Swipe back enabled ✓
        │
        ├── ProgramBuilderScreen (Pushed onto Stack)
        │   - 7-day week view
        │   - Assign routines to days
        │   - Rest day configuration
        │   - Save program
        │   - Parameter: programId (string | "new")
        │   - Swipe back enabled ✓
        │
        └── ConnectionLogsScreen (Pushed onto Stack)
            - BLE connection logs
            - Debug information
            - Connection timeline
            - Error messages
            - Export logs
            - Swipe back enabled ✓
```

## Navigation Flow Diagrams

### Primary User Flow (Workout Session)

```
HomeScreen
    ↓ [Tap "Just Lift"]
JustLiftScreen
    ↓ [Configure & Start]
ActiveWorkoutScreen
    ↓ [Complete/End Workout]
← Back to HomeScreen (or stay on ActiveWorkout if continuing)
```

### Routine Flow

```
HomeScreen
    ↓ [Tap "Daily Routines"]
DailyRoutinesScreen
    ↓ [Select Routine & Start]
ActiveWorkoutScreen
    ↓ [Complete Routine]
← Back to HomeScreen
```

### Program Management Flow

```
HomeScreen
    ↓ [Tap "Weekly Programs"]
WeeklyProgramsScreen
    ↓ [Tap "Create New" or "Edit"]
ProgramBuilderScreen
    ↓ [Assign routines to days]
    ↓ [Save Program]
← Back to WeeklyProgramsScreen
← Back to HomeScreen
```

### Settings/Debug Flow

```
SettingsTab (Bottom Tab)
    ↓ [Tap "Connection Logs"]
ConnectionLogsScreen
    ↓ [View logs]
← Back to SettingsTab
```

### Tab Switching Flow

```
HomeTab ←→ AnalyticsTab ←→ SettingsTab
  ↕          ↕                ↕
(All maintain their own navigation stacks)
```

## Screen State Management

### Stack-Based Screens (Full Screen)

Each screen pushed onto the stack:
- Has its own back button behavior
- Can be dismissed with swipe gesture (except ActiveWorkout)
- Maintains its state when navigating away and returning
- Cleared when navigating to a different tab

### Tab-Based Screens (Persistent)

Each tab:
- Persists its state when switching between tabs
- Has independent navigation stack
- Can navigate to full-screen modals/screens
- Always accessible via bottom tab bar

## Deep Link URL Mapping

```
vitruvianphoenix://                         → Home Tab
vitruvianphoenix://just-lift                → JustLiftScreen
vitruvianphoenix://single-exercise          → SingleExerciseScreen
vitruvianphoenix://daily-routines           → DailyRoutinesScreen
vitruvianphoenix://active-workout           → ActiveWorkoutScreen
vitruvianphoenix://weekly-programs          → WeeklyProgramsScreen
vitruvianphoenix://program-builder/123      → ProgramBuilderScreen (Edit mode)
vitruvianphoenix://program-builder/new      → ProgramBuilderScreen (Create mode)
vitruvianphoenix://analytics                → Analytics Tab
vitruvianphoenix://settings                 → Settings Tab
vitruvianphoenix://connection-logs          → ConnectionLogsScreen
```

## Navigation Patterns by Use Case

### Use Case 1: Quick Workout

```
User opens app
    → Lands on HomeTab/HomeScreen
    → Taps "Just Lift"
    → JustLiftScreen opens (slide from right)
    → Configures workout
    → Taps "Start"
    → ActiveWorkoutScreen opens (slide from right, swipe disabled)
    → Completes workout
    → Taps "End Workout"
    → Returns to HomeScreen (or navigate to Analytics)
```

### Use Case 2: Program-Based Training

```
User opens app
    → Lands on HomeTab/HomeScreen
    → Sees "Today's Workout" widget (Active Program)
    → Taps "Start Routine"
    → Navigates to DailyRoutinesScreen (pre-loaded with routine)
    → Routine starts
    → ActiveWorkoutScreen opens
    → Follows program for the day
    → Completes workout
    → Returns to HomeScreen
    → Tomorrow: Process repeats with next day's routine
```

### Use Case 3: Check History

```
User opens app
    → Switches to AnalyticsTab (bottom tab)
    → Views workout history
    → Sees personal records
    → Views progress charts
    → Switches back to HomeTab
```

### Use Case 4: Debug BLE Issues

```
User experiencing connection issues
    → Switches to SettingsTab (bottom tab)
    → Scrolls to Developer Tools
    → Taps "Connection Logs"
    → ConnectionLogsScreen opens (slide from right)
    → Views detailed BLE logs
    → Identifies issue
    → Swipes back or taps back button
    → Returns to SettingsTab
```

## Screen Lifecycle

### Mount/Unmount Behavior

| Screen Type | When Mounted | When Unmounted | State Persistence |
|-------------|-------------|----------------|-------------------|
| Tab Screens (Home, Analytics, Settings) | On app start | Never (stay mounted) | Persistent |
| Stack Screens (JustLift, etc.) | On navigate | On back/navigate away | Temporary (configurable) |
| ActiveWorkout | On workout start | On workout end | Important - saved to DB |

### Navigation State Persistence

- **Tab state**: Persists automatically (React Navigation default)
- **Stack state**: Can be configured to persist using `enablePersistence` (optional)
- **Workout state**: Always saved to SQLite database via Zustand middleware

## Animation Timing

| Transition Type | Duration | Easing |
|----------------|----------|--------|
| Horizontal slide (push) | 300ms | iOS default |
| Horizontal slide (pop) | 300ms | iOS default |
| Tab switch | Instant | None (0ms) |
| Modal presentation | 400ms | Spring |

## Gesture Recognition

### Swipe-to-Go-Back

**Enabled on:**
- JustLiftScreen
- SingleExerciseScreen
- DailyRoutinesScreen
- WeeklyProgramsScreen
- ProgramBuilderScreen
- ConnectionLogsScreen

**Disabled on:**
- MainTabNavigator (bottom tabs)
- ActiveWorkoutScreen (prevents accidental exits)

### Tab Bar Gestures

- Single tap to switch tabs
- No swipe gestures between tabs (follows iOS convention)

## Error Handling

### Navigation Failures

```typescript
try {
  navigation.navigate('ScreenName', params);
} catch (error) {
  // Handle navigation error
  console.error('Navigation failed:', error);
  // Fallback to home
  navigation.reset({
    index: 0,
    routes: [{ name: 'MainTabs' }],
  });
}
```

### Back Navigation Safety

```typescript
const handleBack = () => {
  if (navigation.canGoBack()) {
    navigation.goBack();
  } else {
    // At root of stack
    navigation.navigate('MainTabs', {
      screen: 'Home',
    });
  }
};
```

## Performance Considerations

### Lazy Loading

Screens can be lazy-loaded to improve initial load time:

```typescript
const JustLiftScreen = React.lazy(() => import('./screens/JustLiftScreen'));
```

### Navigation Optimization

- Tab screens stay mounted for instant switching
- Stack screens unmount when popped (memory optimization)
- ActiveWorkoutScreen keeps state even when backgrounded

## Future Enhancements

- [ ] Add modal presentation for dialogs
- [ ] Implement custom tab bar with animations
- [ ] Add navigation state persistence
- [ ] Implement screen transition callbacks
- [ ] Add navigation analytics tracking
- [ ] Support for landscape orientation
- [ ] Tablet-specific navigation (split view)
- [ ] Watch app navigation sync (future)
