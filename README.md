# Vitruvian Phoenix

A professional iOS and Android workout tracking application for Vitruvian fitness equipment, built with **Expo** and **React Native**.

## Overview

Connect to Vitruvian workout machines via Bluetooth LE for real-time workout monitoring, exercise tracking, analytics, and personal record management.

### Key Features

- **Bluetooth LE Device Control** - Connect to Vitruvian machines wirelessly
- **Multiple Workout Modes** - Old School, Pump, TUT, TUT Beast, Eccentric, Echo
- **Real-time Metrics** - Live load, position, velocity, and rep counting
- **Just Lift Mode** - Quick workouts with auto-start/stop
- **Exercise Library** - 200+ exercises with filtering
- **Routine Management** - Custom routines and weekly programs
- **Personal Records** - Automatic PR tracking
- **Analytics** - History, trends, and charts
- **Dark/Light Themes** - Full theme system

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

This will open Expo DevTools in your browser:
- Press **`i`** for iOS Simulator (Mac only)
- Press **`a`** for Android Emulator
- Scan QR code with **Expo Go** app (for quick preview)
- Press **`w`** for web preview

### Development Builds (Recommended for BLE)

For full BLE functionality, create a development build:

```bash
# Install EAS CLI globally (one time)
npm install -g eas-cli

# Login to Expo
eas login

# Create development build
eas build --profile development --platform ios
# Or for Android
eas build --profile development --platform android

# Then start with dev client
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
└── deprecated/          # Archived Android code
```

## Scripts

```bash
npm start          # Start Expo dev server
npm run ios        # Run on iOS Simulator
npm run android    # Run on Android Emulator
npm run web        # Run on web browser
npm run lint       # Lint code
npm test           # Run tests
npm run prebuild   # Generate native projects
```

## Tech Stack

- **Framework**: Expo SDK 52
- **Language**: TypeScript 5.0
- **UI**: React Native with custom reusable components
- **State**: Zustand + React Hooks
- **Navigation**: React Navigation (Stack + Bottom Tabs)
- **Database**: SQLite (react-native-sqlite-storage)
- **BLE**: react-native-ble-plx
- **Charts**: react-native-chart-kit

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

### Data Layer
- **BLE Manager**: Handles Bluetooth connectivity, device scanning, and characteristics
- **Database**: SQLite with 10 tables for workouts, exercises, routines, PRs
- **Repositories**: Abstract data sources, provide business-friendly APIs

### Domain Layer
- **Models**: Pure business entities (no platform dependencies)
- **Use Cases**: Business logic (e.g., RepCounterFromMachine)

### Presentation Layer
- **Screens**: Full-screen React Native components
- **Components**: Reusable UI elements
- **Hooks**: State management and side effects
- **Navigation**: React Navigation setup
- **Theme**: Custom theming system

## Key Features

### Workout Modes

1. **Old School** - Classic resistance training
2. **Pump** - High volume, lighter weight
3. **TUT** - Controlled tempo
4. **TUT Beast** - Extended TUT with progressive overload
5. **Eccentric** - Negative-focused training
6. **Echo** - Reactive training with variable resistance

### Screens

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

### Metro Bundler Issues
```bash
npm start -- --reset-cache
```

### Module Resolution Issues
```bash
rm -rf node_modules
npm install
```

### BLE Not Working
1. Use a **development build**, not Expo Go
2. Check Bluetooth permissions are granted
3. Verify device name starts with "Vee"
4. Check Connection Logs in Settings

### Build Fails
```bash
npx expo prebuild --clean
npm install
```

## Configuration

### Expo (app.json)
Pre-configured with:
- BLE permissions (iOS & Android)
- Background Bluetooth modes
- Deep linking (`vitruvianphoenix://`)
- iOS bundle ID: `com.vitruvianphoenix.app`
- Android package: `com.vitruvianphoenix.app`

### EAS Build (eas.json)
- **development** - For local testing with dev client
- **preview** - For internal testing (APK/IPA)
- **production** - For App Store/Play Store

## Building for Production

### iOS
```bash
eas build --profile production --platform ios
eas submit --platform ios
```

### Android
```bash
eas build --profile production --platform android
eas submit --platform android
```

### OTA Updates
```bash
eas update --branch production --message "Fix bug"
```

## Migration History

This app was fully migrated from native Android Kotlin/Jetpack Compose to Expo React Native:
- 74 Kotlin files → 100+ TypeScript files
- 15,000+ lines of code
- 100% feature parity
- 0 TypeScript errors

All Android code has been archived to `deprecated/` folder.

## Testing

```bash
npm test           # Run tests
npx tsc --noEmit   # Type check
npm run lint       # Lint code
```

## Documentation

See `docs/` folder for additional documentation:
- Development guides
- BLE protocol details
- Database schema documentation
- Navigation architecture

## Support

- **Expo Docs**: https://docs.expo.dev/
- **React Native Docs**: https://reactnative.dev/
- **EAS Build Docs**: https://docs.expo.dev/build/introduction/

## License

Proprietary - All rights reserved

---

**Version**: 0.3.0
**Platform**: iOS + Android (Expo)
**Last Updated**: 2025-11-12
