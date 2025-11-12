# Navigation Architecture

## Overview

This app uses **React Navigation** for routing and navigation, with a combination of Stack Navigator and Bottom Tab Navigator.

## Navigation Structure

```
RootNavigator (Stack)
└── MainTabs (Bottom Tabs)
    ├── HomeTab (Stack)
    │   ├── Home
    │   ├── JustLift
    │   ├── SingleExercise
    │   └── ActiveWorkout
    ├── RoutinesTab (Stack)
    │   ├── DailyRoutines
    │   ├── WeeklyPrograms
    │   └── ProgramBuilder
    ├── AnalyticsTab (Stack)
    │   └── Analytics
    └── SettingsTab (Stack)
        └── Settings
```

## Quick Start

### Basic Navigation

```typescript
import { useNavigation } from '@react-navigation/native';

const MyComponent = () => {
  const navigation = useNavigation();

  // Navigate to a screen
  navigation.navigate('JustLift');

  // Navigate with params
  navigation.navigate('SingleExercise', { exerciseId: '123' });

  // Go back
  navigation.goBack();
};
```

### Type-Safe Navigation

```typescript
import type { RootStackParamList } from '../navigation/types';
import { StackNavigationProp } from '@react-navigation/stack';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Home'>;
};

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  navigation.navigate('JustLift', { mode: 'OldSchool' });
};
```

## Screen Definitions

### Home Tab Screens

- **Home** - Workout mode selection
- **JustLift** - Quick single-exercise workouts
- **SingleExercise** - Full exercise configuration with all modes
- **ActiveWorkout** - Real-time workout monitoring

### Routines Tab Screens

- **DailyRoutines** - Browse and manage daily routines
- **WeeklyPrograms** - View and manage weekly training programs
- **ProgramBuilder** - Create custom programs

### Analytics Tab Screens

- **Analytics** - Workout history, stats, and charts

### Settings Tab Screens

- **Settings** - App preferences and configuration

## Navigation Patterns

### Modal Navigation

```typescript
// Open a modal
navigation.navigate('Modal', { content: 'Something' });

// Close a modal
navigation.goBack();
```

### Tab Navigation

```typescript
// Switch tabs
navigation.navigate('RoutinesTab');

// Navigate to a specific screen in a tab
navigation.navigate('RoutinesTab', { screen: 'ProgramBuilder' });
```

### Nested Navigation

```typescript
// Navigate deep into a nested navigator
navigation.navigate('MainTabs', {
  screen: 'HomeTab',
  params: {
    screen: 'ActiveWorkout',
    params: { sessionId: '123' }
  }
});
```

## Deep Linking

The app supports deep linking with the custom URL scheme `vitruvianphoenix://`:

```
vitruvianphoenix://home
vitruvianphoenix://justlift
vitruvianphoenix://routines
vitruvianphoenix://analytics
vitruvianphoenix://settings
```

Configure in `app.json`:
```json
{
  "expo": {
    "scheme": "vitruvianphoenix"
  }
}
```

## Navigation Guards

### Authentication Guard (if needed)

```typescript
const RootNavigator = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Stack.Navigator>
      {isAuthenticated ? (
        <Stack.Screen name="MainTabs" component={MainTabs} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
};
```

## Best Practices

1. **Type Safety** - Always use TypeScript types for navigation
2. **Params** - Keep navigation params simple and serializable
3. **Deep Linking** - Test deep linking thoroughly
4. **State Management** - Don't store navigation state in global state
5. **Back Button** - Handle Android back button properly
6. **Modals** - Use modal presentation for temporary screens

## Troubleshooting

### Navigation Not Working

1. Check navigator hierarchy
2. Verify screen names match exactly
3. Ensure params are serializable
4. Check for circular navigation

### Type Errors

1. Update `types.ts` with correct param lists
2. Use `CompositeNavigationProp` for nested navigators
3. Ensure all screens are properly typed

## Migration Notes

This navigation system was migrated from Android Jetpack Compose Navigation. Key differences:

- **Android**: `NavController` with composable destinations
- **React Native**: Stack/Tab navigators with component screens
- **Android**: `navController.navigate("route")`
- **React Native**: `navigation.navigate('Screen')`

## References

- [React Navigation Docs](https://reactnavigation.org/)
- [TypeScript Guide](https://reactnavigation.org/docs/typescript/)
- [Expo Router](https://docs.expo.dev/router/introduction/) (alternative)
