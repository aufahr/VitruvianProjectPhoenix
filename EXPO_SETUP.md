# Expo Setup Guide for Vitruvian Phoenix

This guide explains how to use Expo for faster development cycles alongside the existing React Native CLI setup.

## Table of Contents

- [Overview](#overview)
- [Why Expo?](#why-expo)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
- [Development Workflow](#development-workflow)
- [Building](#building)
- [Expo vs React Native CLI](#expo-vs-react-native-cli)
- [Troubleshooting](#troubleshooting)

## Overview

This project now supports **both** Expo and React Native CLI workflows. You can choose the approach that best fits your needs:

- **Expo**: Fast iteration, easy setup, great for rapid development
- **React Native CLI**: Full control, custom native code, traditional workflow

Both setups coexist without conflicts. The native iOS and Android code remains available for the React Native CLI workflow.

## Why Expo?

### Advantages of Expo

1. **Faster Development Cycles**
   - Hot reload with Expo Go app (for compatible dependencies)
   - Development builds for testing on real devices
   - Over-the-air updates for quick fixes

2. **Simplified Build Process**
   - Cloud builds with EAS (Expo Application Services)
   - Local builds with automated configuration
   - No need for Xcode or Android Studio on your machine

3. **Better Developer Experience**
   - Automatic configuration of native modules
   - Config plugins handle native setup
   - Built-in debugging tools

4. **Easy Testing**
   - Share builds with QR codes
   - Internal distribution made simple
   - TestFlight/Play Store integration

### When to Use Each Approach

**Use Expo when:**
- Developing new features rapidly
- Testing on multiple devices quickly
- Building for distribution without local native toolchains
- Working on UI/UX and app logic

**Use React Native CLI when:**
- Adding custom native modules
- Debugging native iOS/Android code
- Modifying native build configurations
- Need full control over native layer

## Quick Start

### 1. Run the Setup Script

```bash
./expo-setup.sh
```

This will:
- Install Expo dependencies
- Install EAS CLI
- Configure your project
- Optionally run prebuild

### 2. Initialize EAS

```bash
eas init
```

This creates an Expo account and project, linking it to your app.

### 3. Create Development Build

**For iOS Simulator:**
```bash
eas build --profile development --platform ios
```

**For Android Emulator/Device:**
```bash
eas build --profile development --platform android
```

### 4. Start Development Server

```bash
npx expo start --dev-client
```

## Detailed Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo account (free at https://expo.dev)
- iOS Simulator (for iOS development)
- Android Emulator or physical device (for Android development)

### Step-by-Step Installation

#### 1. Install Dependencies

```bash
# Install Expo packages
npm install --save-dev expo @expo/cli @expo/config @expo/config-plugins @expo/metro-config @expo/prebuild-config

# Install Expo plugins
npm install --save-dev expo-build-properties expo-font expo-sqlite

# Install EAS CLI globally
npm install -g eas-cli
```

#### 2. Configure Project

The `app.json` file has been configured with:
- BLE permissions and background modes
- Deep linking (vitruvianphoenix://)
- iOS bundle identifier: `com.vitruvianphoenix.app`
- Android package: `com.vitruvianphoenix.app`
- Native module plugins (BLE, SQLite, fonts)

#### 3. Initialize EAS

```bash
# Login to Expo
eas login

# Initialize project
eas init

# Configure credentials (optional, can be done during first build)
eas credentials
```

This will update `app.json` with your project ID.

#### 4. Generate Native Code (Prebuild)

Expo uses "prebuild" to generate the `ios/` and `android/` directories from your configuration:

```bash
# Clean prebuild (regenerates from scratch)
npx expo prebuild --clean

# Or just update changes
npx expo prebuild
```

**Note:** Prebuild will modify your `ios/` and `android/` directories. Any manual changes to native code will be overwritten. Use config plugins for native customizations instead.

## Development Workflow

### Local Development

#### Option 1: Development Build on Physical Device (Recommended)

1. **Create development build:**
   ```bash
   # iOS
   eas build --profile development --platform ios --local

   # Android
   eas build --profile development --platform android --local
   ```

2. **Install the build on your device**

3. **Start dev server:**
   ```bash
   npx expo start --dev-client
   ```

4. **Scan QR code** with your development build

#### Option 2: Cloud Builds

1. **Create development build in cloud:**
   ```bash
   # iOS (TestFlight or Ad Hoc)
   eas build --profile development --platform ios

   # Android APK
   eas build --profile development --platform android
   ```

2. **Download and install** when build completes

3. **Start dev server:**
   ```bash
   npx expo start --dev-client
   ```

#### Option 3: Expo Go (Limited Support)

**Note:** Expo Go may not work due to custom native modules (react-native-ble-plx, react-native-vector-icons). Use development builds instead.

```bash
npx expo start
```

### Hot Reload and Fast Refresh

With a development build running:
- Edit your code
- Save the file
- Changes appear instantly on device

### Debugging

```bash
# Open Expo DevTools
npx expo start --dev-client

# Then press:
# - 'j' to open Chrome DevTools
# - 'm' to toggle menu on device
# - 'r' to reload
```

## Building

### Build Profiles

The `eas.json` file defines four build profiles:

#### 1. Development

For testing during development:

```bash
# iOS Simulator
eas build --profile development --platform ios

# Android APK
eas build --profile development --platform android
```

**Features:**
- Development client enabled
- Debug mode
- Fast builds
- Internal distribution

#### 2. Preview

For internal testing and demos:

```bash
# iOS (Ad Hoc)
eas build --profile preview --platform ios

# Android APK
eas build --profile preview --platform android
```

**Features:**
- Production mode
- Internal distribution
- No App Store/Play Store submission

#### 3. Production

For App Store and Play Store releases:

```bash
# iOS (App Store)
eas build --profile production --platform ios

# Android AAB (Play Store)
eas build --profile production --platform android
```

**Features:**
- Production optimized
- Store-ready builds
- Automatic submission (if configured)

#### 4. Local Development

For building locally without cloud services:

```bash
# iOS Simulator
eas build --profile local-dev --platform ios --local

# Android APK
eas build --profile local-dev --platform android --local
```

**Features:**
- Builds on your machine
- No cloud costs
- Faster iteration

### Local vs Cloud Builds

#### Cloud Builds (Recommended)

**Pros:**
- No need for Xcode or Android Studio
- Consistent build environment
- Build on any machine
- Automatic credential management

**Cons:**
- Requires internet connection
- Build queue times
- Limited free builds (EAS pricing)

```bash
eas build --profile development --platform ios
```

#### Local Builds

**Pros:**
- Faster (no queue)
- Offline capable
- Unlimited builds
- More control

**Cons:**
- Requires native toolchains
- Must manage credentials manually
- Platform-specific (need Mac for iOS)

```bash
# Requires Xcode (iOS) or Android Studio (Android)
eas build --profile development --platform ios --local
```

### Submitting to Stores

#### iOS App Store

```bash
# Build and submit
eas submit --platform ios --profile production

# Or build first, submit later
eas build --profile production --platform ios
eas submit --platform ios
```

#### Google Play Store

```bash
# Build and submit
eas submit --platform android --profile production

# Or build first, submit later
eas build --profile production --platform android
eas submit --platform android
```

**Prerequisites:**
- App Store Connect account and app created
- Google Play Console account and app created
- Service account JSON for Play Store (in `eas.json`)

## Expo vs React Native CLI

### Comparison Matrix

| Feature | Expo | React Native CLI |
|---------|------|------------------|
| Setup Time | 5 minutes | 30+ minutes |
| Build Process | Cloud or local, automated | Local, manual |
| Native Modules | Config plugins | Manual linking |
| Custom Native Code | Limited (via plugins) | Full control |
| OTA Updates | Built-in | Requires CodePush |
| Testing on Device | QR code + dev build | USB or network |
| Build Machine Required | No | Yes (Xcode/Android Studio) |
| Learning Curve | Low | Medium-High |

### Using Both Approaches

This project is configured to support both workflows simultaneously:

#### File Structure

```
vitruvian-phoenix/
├── app.json           # Expo configuration
├── eas.json           # EAS Build profiles
├── expo-setup.sh      # Expo setup script
├── ios/               # Native iOS code (shared)
├── android/           # Native Android code (shared)
├── src/               # React Native app code (shared)
└── package.json       # Dependencies (shared)
```

#### Switching Between Workflows

**For Expo:**
```bash
# Start Expo dev server
npx expo start --dev-client

# Build with EAS
eas build --profile development --platform ios
```

**For React Native CLI:**
```bash
# Start Metro bundler
npm start

# Run iOS
npm run ios

# Run Android
npm run android
```

Both use the same source code in `src/`. Native code in `ios/` and `android/` is shared.

### When Prebuild Regenerates Native Code

Prebuild will regenerate `ios/` and `android/` when:
- Running `npx expo prebuild`
- Running `eas build` (automatically)
- Running `npx expo run:ios` or `npx expo run:android`

**Important:** If you've made manual changes to native code, either:
1. Create a config plugin to apply those changes automatically
2. Don't run prebuild (use React Native CLI instead)
3. Exclude prebuild for specific builds

## Troubleshooting

### Common Issues

#### 1. "Cannot find module 'expo'"

**Solution:**
```bash
npm install --save-dev expo
```

#### 2. Build fails with "No bundle identifier"

**Solution:** Update `app.json`:
```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.vitruvianphoenix.app"
    }
  }
}
```

#### 3. BLE not working in development build

**Solution:** Ensure `react-native-ble-plx` plugin is configured in `app.json`:
```json
{
  "plugins": [
    [
      "react-native-ble-plx",
      {
        "isBackgroundEnabled": true,
        "modes": ["peripheral", "central"]
      }
    ]
  ]
}
```

#### 4. "No Expo Config found"

**Solution:** Make sure `app.json` has the `expo` key:
```json
{
  "name": "VitruvianPhoenix",
  "expo": {
    // Expo config here
  }
}
```

#### 5. Development build crashes on launch

**Solution:**
```bash
# Clear cache and rebuild
npx expo prebuild --clean
eas build --profile development --platform ios --clear-cache
```

#### 6. Vector icons not showing

**Solution:** Expo handles vector icons automatically, but you may need:
```bash
npx expo install expo-font @expo/vector-icons
```

#### 7. SQLite database not working

**Solution:** Ensure SQLite plugin is installed:
```bash
npx expo install expo-sqlite
```

And configured in `app.json`:
```json
{
  "plugins": [
    ["expo-sqlite", { "enableFTS": true }]
  ]
}
```

### Getting Help

- **Expo Documentation:** https://docs.expo.dev
- **EAS Build:** https://docs.expo.dev/build/introduction/
- **Forums:** https://forums.expo.dev
- **Discord:** https://chat.expo.dev

## Advanced Topics

### Config Plugins

To customize native code without manual edits, create a config plugin:

```javascript
// app-plugin.js
module.exports = (config) => {
  // Modify iOS config
  if (config.ios) {
    config.ios.infoPlist.UIBackgroundModes = [
      'bluetooth-central',
      'bluetooth-peripheral'
    ];
  }

  return config;
};
```

Add to `app.json`:
```json
{
  "expo": {
    "plugins": ["./app-plugin.js"]
  }
}
```

### OTA Updates

Expo supports over-the-air updates for JavaScript changes:

```bash
# Configure updates
eas update:configure

# Publish update
eas update --branch preview --message "Fix: Bluetooth connection issue"
```

Users get updates automatically without reinstalling the app.

### Environment Variables

Use `.env` files for different environments:

```bash
# .env.development
API_URL=http://localhost:3000

# .env.production
API_URL=https://api.vitruvianphoenix.com
```

Access in code:
```javascript
import Constants from 'expo-constants';

const apiUrl = Constants.expoConfig.extra.apiUrl;
```

Configure in `app.json`:
```json
{
  "expo": {
    "extra": {
      "apiUrl": process.env.API_URL
    }
  }
}
```

### Custom Development Client

Extend the development client with additional native modules:

```bash
# Install native module
npm install some-native-module

# Rebuild development client
eas build --profile development --platform ios
```

## Migration Path

If you want to migrate fully to Expo (optional):

1. **Test everything with Expo** builds
2. **Document any custom native code** needed
3. **Create config plugins** for custom code
4. **Update CI/CD** to use EAS Build
5. **Train team** on Expo workflow

However, you can keep using both approaches indefinitely.

## Additional Resources

- [Expo Documentation](https://docs.expo.dev)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [Config Plugins](https://docs.expo.dev/guides/config-plugins/)
- [Expo Prebuild](https://docs.expo.dev/workflow/prebuild/)
- [Continuous Native Generation](https://docs.expo.dev/workflow/continuous-native-generation/)
- [Pricing](https://expo.dev/pricing)

## Summary

You now have two ways to develop and build Vitruvian Phoenix:

**For rapid development:**
```bash
npx expo start --dev-client
```

**For traditional workflow:**
```bash
npm start
npm run ios  # or npm run android
```

**For building:**
```bash
# Expo (cloud or local)
eas build --profile development --platform ios

# React Native CLI
cd ios && xcodebuild ...
```

Both approaches use the same codebase and work together seamlessly. Choose the tool that fits your current task.
