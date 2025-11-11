#!/bin/bash

# Expo Setup Script for Vitruvian Phoenix
# This script sets up Expo alongside the existing React Native CLI setup

set -e  # Exit on error

echo "================================"
echo "Vitruvian Phoenix - Expo Setup"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

echo -e "${GREEN}Step 1: Installing Expo dependencies...${NC}"
echo ""

# Install Expo SDK and required dependencies
npm install --save-dev \
    expo@~50.0.0 \
    @expo/cli@~0.17.0 \
    @expo/config@~8.5.0 \
    @expo/config-plugins@~7.8.0 \
    @expo/metro-config@~0.17.0 \
    @expo/prebuild-config@~6.7.0

echo ""
echo -e "${GREEN}Step 2: Installing Expo plugins for existing dependencies...${NC}"
echo ""

# Install Expo plugins for native modules
npm install --save-dev \
    expo-build-properties@~0.11.0 \
    expo-font@~11.10.0 \
    expo-sqlite@~13.6.0

echo ""
echo -e "${GREEN}Step 3: Installing EAS CLI (for builds)...${NC}"
echo ""

# Install EAS CLI globally
npm install -g eas-cli

echo ""
echo -e "${YELLOW}Step 4: Configuration...${NC}"
echo ""

# Check if app.json is configured
if grep -q "YOUR_PROJECT_ID_HERE" app.json; then
    echo -e "${YELLOW}⚠️  You need to configure your EAS project ID:${NC}"
    echo "   1. Run: eas init"
    echo "   2. This will create a project and update app.json with your project ID"
    echo ""
fi

echo -e "${GREEN}Step 5: Prebuild (generate native code)...${NC}"
echo ""
echo -e "${YELLOW}Do you want to run prebuild now? This will regenerate iOS/Android native code.${NC}"
echo -e "${YELLOW}⚠️  WARNING: This will modify your ios/ and android/ directories!${NC}"
echo -e "${YELLOW}Make sure you've committed your changes first.${NC}"
echo ""
read -p "Run prebuild? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}Running prebuild...${NC}"
    npx expo prebuild --clean
else
    echo -e "${YELLOW}Skipping prebuild. You can run it later with: npx expo prebuild${NC}"
fi

echo ""
echo -e "${GREEN}✓ Expo setup complete!${NC}"
echo ""
echo "================================"
echo "Next Steps:"
echo "================================"
echo ""
echo "1. Initialize EAS (if not done):"
echo "   $ eas init"
echo ""
echo "2. Configure EAS credentials:"
echo "   $ eas credentials"
echo ""
echo "3. Create a development build:"
echo "   $ eas build --profile development --platform ios"
echo "   $ eas build --profile development --platform android"
echo ""
echo "4. Or build locally:"
echo "   $ eas build --profile development --platform ios --local"
echo "   $ eas build --profile development --platform android --local"
echo ""
echo "5. Start development server:"
echo "   $ npx expo start --dev-client"
echo ""
echo "For more information, see EXPO_SETUP.md"
echo ""
