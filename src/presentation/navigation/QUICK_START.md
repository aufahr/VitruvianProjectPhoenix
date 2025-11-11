# Navigation Quick Start Guide

## 🚀 Getting Started in 5 Minutes

This guide will help you quickly understand and use the Vitruvian Phoenix navigation system.

## Basic Setup (Already Done!)

The navigation system is already configured. You can start using it immediately:

1. ✅ React Navigation dependencies installed
2. ✅ Navigation types defined (`types.ts`)
3. ✅ Root navigator configured (`RootNavigator.tsx`)
4. ✅ Deep linking configured for iOS
5. ✅ Bottom tabs set up (Analytics, Home, Settings)
6. ✅ All screen routes defined

## Common Tasks

### Task 1: Navigate to a Screen

```typescript
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/presentation/navigation/types';

const MyComponent = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  return (
    <Button
      title="Start Just Lift"
      onPress={() => navigation.navigate('JustLift')}
    />
  );
};
```

### Task 2: Navigate with Parameters

```typescript
const MyComponent = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  return (
    <Button
      title="Edit Program"
      onPress={() => navigation.navigate('ProgramBuilder', {
        programId: '12345'
      })}
    />
  );
};
```

### Task 3: Go Back

```typescript
const MyScreen = () => {
  const navigation = useNavigation();

  return (
    <Button
      title="Go Back"
      onPress={() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        }
      }}
    />
  );
};
```

### Task 4: Access Route Parameters

```typescript
import { RootStackScreenProps } from '@/presentation/navigation/types';

type Props = RootStackScreenProps<'ProgramBuilder'>;

const ProgramBuilderScreen: React.FC<Props> = ({ route, navigation }) => {
  const { programId } = route.params; // Fully typed!

  return (
    <View>
      <Text>Editing program: {programId}</Text>
    </View>
  );
};
```

### Task 5: Switch Between Tabs

```typescript
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

  return (
    <Button
      title="Go to Analytics"
      onPress={() => navigation.navigate('MainTabs', {
        screen: 'Analytics'
      })}
    />
  );
};
```

## Screen Templates

### Basic Screen Template

```typescript
import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { RootStackScreenProps } from '@/presentation/navigation/types';

type Props = RootStackScreenProps<'ScreenName'>;

const MyScreen: React.FC<Props> = ({ navigation, route }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Screen</Text>
      <Button
        title="Go Back"
        onPress={() => navigation.goBack()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default MyScreen;
```

### Screen with Parameters Template

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RootStackScreenProps } from '@/presentation/navigation/types';

type Props = RootStackScreenProps<'ProgramBuilder'>;

const ProgramBuilderScreen: React.FC<Props> = ({ navigation, route }) => {
  const { programId } = route.params;
  const isNewProgram = programId === 'new';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {isNewProgram ? 'Create Program' : `Edit Program ${programId}`}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});

export default ProgramBuilderScreen;
```

### Tab Screen Template

```typescript
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MainTabScreenProps } from '@/presentation/navigation/types';

type Props = MainTabScreenProps<'Home'>;

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Welcome to Vitruvian Phoenix</Text>
      {/* Screen content */}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
  },
});

export default HomeScreen;
```

## Navigation Hooks

### useNavigation

Get the navigation object:

```typescript
import { useNavigation } from '@react-navigation/native';

const navigation = useNavigation();
navigation.navigate('ScreenName');
```

### useRoute

Get the current route:

```typescript
import { useRoute } from '@react-navigation/native';

const route = useRoute();
console.log(route.name); // Current screen name
console.log(route.params); // Route parameters
```

### useFocusEffect

Run code when screen is focused:

```typescript
import { useFocusEffect } from '@react-navigation/native';

useFocusEffect(
  React.useCallback(() => {
    // Do something when screen is focused
    console.log('Screen focused');

    return () => {
      // Cleanup when screen loses focus
      console.log('Screen unfocused');
    };
  }, [])
);
```

### useIsFocused

Check if screen is focused:

```typescript
import { useIsFocused } from '@react-navigation/native';

const isFocused = useIsFocused();

if (isFocused) {
  // Screen is focused
}
```

## Complete Navigation Flow Example

```typescript
// HomeScreen.tsx
import React from 'react';
import { View, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/presentation/navigation/types';

type NavProp = StackNavigationProp<RootStackParamList>;

const HomeScreen = () => {
  const navigation = useNavigation<NavProp>();

  const startJustLift = () => {
    // Navigate to Just Lift screen
    navigation.navigate('JustLift');
  };

  const startWeeklyProgram = () => {
    // Navigate to Weekly Programs
    navigation.navigate('WeeklyPrograms');
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 16 }}>
      <Button title="Just Lift" onPress={startJustLift} />
      <Button title="Weekly Programs" onPress={startWeeklyProgram} />
    </View>
  );
};

export default HomeScreen;
```

```typescript
// JustLiftScreen.tsx
import React, { useState } from 'react';
import { View, Button, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/presentation/navigation/types';

type NavProp = StackNavigationProp<RootStackParamList>;

const JustLiftScreen = () => {
  const navigation = useNavigation<NavProp>();
  const [weight, setWeight] = useState(50);

  const startWorkout = () => {
    // Save workout config
    // Start workout
    navigation.navigate('ActiveWorkout');
  };

  const goBack = () => {
    navigation.goBack();
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text>Configure your workout</Text>
      <Text>Weight: {weight} kg</Text>
      <Button title="Start Workout" onPress={startWorkout} />
      <Button title="Cancel" onPress={goBack} />
    </View>
  );
};

export default JustLiftScreen;
```

## Testing Deep Links

### iOS Simulator

```bash
xcrun simctl openurl booted vitruvianphoenix://just-lift
xcrun simctl openurl booted vitruvianphoenix://program-builder/123
xcrun simctl openurl booted vitruvianphoenix://analytics
```

### Testing in Development

```typescript
import { Linking } from 'react-native';

// Test deep link navigation
Linking.openURL('vitruvianphoenix://just-lift');
```

## Troubleshooting

### Problem: TypeScript errors with navigation

**Solution**: Make sure you're using the correct prop type:
```typescript
import { RootStackScreenProps } from '@/presentation/navigation/types';
type Props = RootStackScreenProps<'ScreenName'>;
```

### Problem: Navigation not working

**Solution**: Check these:
1. Is the screen registered in `RootNavigator.tsx`?
2. Does the screen name match exactly in both places?
3. Is NavigationContainer wrapping your app?

### Problem: Can't access route params

**Solution**: Make sure params are defined in `types.ts`:
```typescript
export type RootStackParamList = {
  ScreenName: {
    paramName: string;
  };
};
```

## Best Practices

1. **Always use typed navigation**
   ```typescript
   ✅ const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
   ❌ const navigation = useNavigation(); // Not type-safe
   ```

2. **Use constants for screen names**
   ```typescript
   ✅ navigation.navigate(SCREEN_NAMES.JUST_LIFT);
   ⚠️ navigation.navigate('JustLift'); // Works but less maintainable
   ```

3. **Check canGoBack before going back**
   ```typescript
   ✅ if (navigation.canGoBack()) navigation.goBack();
   ❌ navigation.goBack(); // May crash at root
   ```

4. **Use useFocusEffect for screen-specific effects**
   ```typescript
   ✅ useFocusEffect(React.useCallback(() => { ... }, []));
   ❌ useEffect(() => { ... }, []); // Runs on mount only
   ```

## Next Steps

1. ✅ You now understand basic navigation
2. 📖 Read [README.md](./README.md) for detailed documentation
3. 📖 Read [NAVIGATION_TREE.md](./NAVIGATION_TREE.md) for visual hierarchy
4. 📖 Read [ANDROID_MIGRATION_GUIDE.md](./ANDROID_MIGRATION_GUIDE.md) if migrating from Android
5. 🛠️ Start implementing your screens!

## Quick Reference

| Task | Code |
|------|------|
| Navigate | `navigation.navigate('ScreenName')` |
| Navigate with params | `navigation.navigate('Screen', { param: value })` |
| Go back | `navigation.goBack()` |
| Check can go back | `navigation.canGoBack()` |
| Get route name | `route.name` |
| Get route params | `route.params` |
| Replace screen | `navigation.replace('ScreenName')` |
| Reset navigation | `navigation.reset({ index: 0, routes: [{ name: 'Home' }] })` |
| Pop to top | `navigation.popToTop()` |

## Need Help?

- Check [README.md](./README.md) for full documentation
- Check [NAVIGATION_TREE.md](./NAVIGATION_TREE.md) for navigation hierarchy
- Check [ANDROID_MIGRATION_GUIDE.md](./ANDROID_MIGRATION_GUIDE.md) for Android comparison
- Check [React Navigation Docs](https://reactnavigation.org/docs/getting-started)
