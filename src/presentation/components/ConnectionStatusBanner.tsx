/**
 * ConnectionStatusBanner Component
 * Displays when not connected to the Vitruvian Trainer
 * Migrated from Android Compose ConnectionStatusBanner
 */

import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useColors, useTypography, useSpacing} from '../theme';
import {Card} from './Card';
import {TextButton} from './Button';

export interface ConnectionStatusBannerProps {
  onConnect: () => void;
  message?: string;
  testID?: string;
}

/**
 * Connection status banner that displays when not connected to the machine
 * Shows a warning message and a Connect button for easy manual connection
 */
export const ConnectionStatusBanner: React.FC<ConnectionStatusBannerProps> = ({
  onConnect,
  message = 'Not connected to machine',
  testID,
}) => {
  const colors = useColors();
  const typography = useTypography();
  const spacing = useSpacing();

  return (
    <Card
      style={{
        marginHorizontal: spacing.medium,
        marginVertical: spacing.small,
        backgroundColor: colors.surfaceVariant,
      }}
      borderWidth={0}
      testID={testID}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: spacing.medium,
        }}>
        {/* Status icon and message */}
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.small,
          }}>
          {/* Bluetooth icon */}
          <Text
            style={{
              fontSize: 24,
              color: colors.error,
            }}
            accessibilityLabel="Bluetooth disconnected">
            🔵
          </Text>
          <Text
            style={[
              typography.bodyMedium,
              {
                color: colors.onSurface,
                fontWeight: '500',
                flex: 1,
              },
            ]}>
            {message}
          </Text>
        </View>

        {/* Connect button */}
        <TextButton onPress={onConnect} size="small">
          Connect
        </TextButton>
      </View>
    </Card>
  );
};
