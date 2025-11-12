# Vitruvian Phoenix - Expo App

A professional iOS and Android workout tracking application for Vitruvian fitness equipment, built with **Expo** and React Native.

## Overview

Connect to Vitruvian workout machines via Bluetooth LE for real-time workout monitoring, exercise tracking, analytics, and personal record management.

### Key Features

- **🔵 BLE Device Control** - Connect to Vitruvian machines wirelessly
- **💪 Multiple Workout Modes** - Old School, Pump, TUT, TUT Beast, Eccentric, Echo
- **📊 Real-time Metrics** - Live load, position, velocity, and rep counting
- **⚡ Just Lift Mode** - Quick workouts with auto-start/stop
- **📚 Exercise Library** - 200+ exercises with filtering
- **📋 Routine Management** - Custom routines and weekly programs
- **🏆 Personal Records** - Automatic PR tracking
- **📈 Analytics** - History, trends, and charts
- **🌓 Dark/Light Themes** - Full Material Design 3

## Quick Start

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Expo account** ([Sign up free](https://expo.dev/))
- **iOS Simulator** (Mac with Xcode) or **Android Emulator**

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Start Expo development server
npm start
```

This will open Expo DevTools in your browser. Choose how to run:

- Press **`i`** for iOS Simulator (Mac only)
- Press **`a`** for Android Emulator
- Scan QR code with **Expo Go** app on your device (for quick preview)
- Press **`w`** for web preview

### Development Builds (Recommended for BLE)

For full BLE functionality, create a development build:

```bash
# Install EAS CLI globally (one time only)
npm install -g eas-cli

# Login to Expo
eas login

# Create development build for iOS
eas build --profile development --platform ios

# Or for Android
eas build --profile development --platform android
```

Once built, install the development build on your device and run:

```bash
npm start --dev-client
```

## Project Structure

```
vitruvian-phoenix/
├── app.json              # Expo configuration
├── eas.json             # Build profiles
├── index.js             # Entry point
├── App.tsx              # Main app component
├── assets/              # Images and assets
├── src/
│   ├── data/            # Data layer
│   │   ├── ble/         # Bluetooth manager
│   │   ├── local/       # SQLite database
│   │   ├── preferences/ # User settings
│   │   └── repository/  # Data repositories
│   ├── domain/          # Business logic
│   │   ├── models/      # Domain models
│   │   └── usecases/    # Use cases
│   ├── presentation/    # UI layer
│   │   ├── components/  # Reusable components
│   │   ├── screens/     # Screen components
│   │   ├── hooks/       # Custom hooks
│   │   ├── navigation/  # Navigation setup
│   │   └── theme/       # Theme system
│   ├── utils/           # Utilities
│   └── types/           # TypeScript definitions
└── expo-setup.sh        # Automated setup script
```

## Scripts

```bash
npm start          # Start Expo dev server
npm run ios        # Run on iOS Simulator
npm run android    # Run on Android Emulator
npm run web        # Run on web browser
npm run lint       # Lint code
npm test           # Run tests
npm run prebuild   # Generate native projects (ios/, android/)
```

## Tech Stack

- **Framework**: Expo SDK 52
- **Language**: TypeScript 5.0
- **UI**: React Native + Custom Material Design 3 components
- **State**: Zustand + React Hooks
- **Navigation**: React Navigation (Stack + Bottom Tabs)
- **Database**: SQLite (react-native-sqlite-storage)
- **BLE**: react-native-ble-plx
- **Charts**: react-native-chart-kit
- **Theme**: Custom Material Design 3 system

## Configuration

### Expo Configuration (app.json)

The app is pre-configured with:
- ✅ BLE permissions (iOS & Android)
- ✅ Background Bluetooth modes
- ✅ Deep linking (`vitruvianphoenix://`)
- ✅ iOS bundle ID: `com.vitruvianphoenix.app`
- ✅ Android package: `com.vitruvianphoenix.app`

### EAS Build Profiles (eas.json)

- **development** - For local testing with dev client
- **preview** - For internal testing (APK/IPA)
- **production** - For App Store/Play Store

## Development Workflow

### 1. Quick UI Testing (Expo Go)

For rapid UI iteration without native dependencies:

```bash
npm start
# Scan QR code with Expo Go app
```

**Note**: BLE features won't work in Expo Go. Use development build instead.

### 2. Full Feature Development (Development Build)

For testing all features including BLE:

```bash
# First time only
eas build --profile development --platform ios

# Then for development
npm start --dev-client
```

### 3. Building for Production

```bash
# iOS (App Store)
eas build --profile production --platform ios

# Android (Play Store)
eas build --profile production --platform android
```

## Features

### Workout Modes

1. **Old School** - Classic resistance training
2. **Pump** - High volume, lighter weight
3. **TUT (Time Under Tension)** - Controlled tempo
4. **TUT Beast** - Extended TUT with progressive overload
5. **Eccentric Only** - Negative-focused training
6. **Echo** - Reactive training with variable resistance

### Screen Overview

- **HomeScreen** - Workout mode selection
- **JustLiftScreen** - Quick single-exercise workouts
- **SingleExerciseScreen** - Full exercise configuration
- **ActiveWorkoutScreen** - Real-time workout monitoring
- **DailyRoutinesScreen** - Browse and manage routines
- **WeeklyProgramsScreen** - Weekly training programs
- **ProgramBuilderScreen** - Create custom programs
- **AnalyticsScreen** - Stats, history, and charts
- **SettingsScreen** - App preferences

## Database Schema

SQLite database with 10 tables:
- `workout_sessions` - Workout data
- `workout_metrics` - Time-series metrics
- `routines` - Saved routines
- `routine_exercises` - Exercises in routines
- `exercises` - Exercise library
- `exercise_videos` - Video URLs
- `personal_records` - PR tracking
- `weekly_programs` - Training programs
- `program_days` - Program schedule
- `connection_logs` - BLE debug logs

## BLE Protocol

Communicates with Vitruvian machines via:
- **Services**: GATT, NUS (Nordic UART)
- **Characteristics**: 15+ for device control
- **Commands**: INIT, PROGRAM_PARAMS, ECHO_CONTROL, COLOR_SCHEME
- **Monitoring**: 100ms polling for real-time data
- **Notifications**: Rep counting from hardware

## Troubleshooting

### "Metro Bundler not found"

```bash
# Clear Metro cache
npm start -- --reset-cache
```

### "Unable to resolve module"

```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

### BLE not working

1. Ensure you're using a **development build**, not Expo Go
2. Check Bluetooth permissions are granted
3. Verify device name starts with "Vee"
4. Check Connection Logs in Settings

### Build fails

```bash
# Clear Expo cache
npx expo prebuild --clean
npm install
```

## Testing

```bash
# Run tests
npm test

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

## Documentation

- **EXPO_SETUP.md** - Detailed Expo setup guide
- **MIGRATION_REVIEW.md** - Migration details and analysis
- **BLE_MIGRATION_SUMMARY.md** - BLE layer documentation
- **Navigation docs** - 5 comprehensive navigation guides
- **assets/README.md** - Asset requirements

## Architecture

Follows **Clean Architecture** principles:

```
┌─────────────────┐
│  Presentation   │ ← React Native UI, Hooks, Navigation
├─────────────────┤
│     Domain      │ ← Business Logic, Models, Use Cases
├─────────────────┤
│      Data       │ ← BLE, Database, Repositories
└─────────────────┘
```

- **Separation of concerns** - Clear boundaries between layers
- **Dependency inversion** - Dependencies point inward
- **Testability** - Each layer can be tested independently
- **Type safety** - Full TypeScript coverage

## Contributing

This app was fully migrated from native Android Kotlin to Expo React Native.

**Migration Stats:**
- 74 Kotlin files → 100+ TypeScript files
- 15,000+ lines of code
- 100% feature parity
- 0 TypeScript errors ✅

## Deployment

### iOS

```bash
# Submit to App Store
eas build --profile production --platform ios
eas submit --platform ios
```

### Android

```bash
# Submit to Play Store
eas build --profile production --platform android
eas submit --platform android
```

### OTA Updates

Expo supports over-the-air updates for quick bug fixes:

```bash
# Publish update
eas update --branch production --message "Fix bug"
```

## Support

- **Expo Docs**: https://docs.expo.dev/
- **React Native Docs**: https://reactnative.dev/
- **EAS Build Docs**: https://docs.expo.dev/build/introduction/

## License

Proprietary - All rights reserved

---

**Version**: 0.3.0
**Platform**: iOS + Android (Expo)
**Last Updated**: 2025-11-11

Built with ❤️ using Expo
