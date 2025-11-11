/**
 * ConnectionErrorDialog Component
 * Error dialog shown when auto-connect fails
 * Migrated from Android Compose ConnectionErrorDialog
 */

import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useColors, useTypography, useSpacing} from '../theme';
import {Modal} from './Modal';
import {Button, TextButton} from './Button';

export interface ConnectionErrorDialogProps {
  visible: boolean;
  message: string;
  onDismiss: () => void;
  onRetry?: () => void;
  testID?: string;
}

/**
 * Error dialog shown when auto-connect fails
 * Includes helpful troubleshooting suggestions for users
 */
export const ConnectionErrorDialog: React.FC<ConnectionErrorDialogProps> = ({
  visible,
  message,
  onDismiss,
  onRetry,
  testID,
}) => {
  const colors = useColors();
  const typography = useTypography();
  const spacing = useSpacing();

  const troubleshootingTips = [
    '• Ensure the machine is powered on',
    '• Try turning Bluetooth off and on',
    '• Move closer to the machine',
    '• Check that no other device is connected',
  ];

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      title="Connection Failed"
      variant="center"
      testID={testID}
      footer={
        <View style={{flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.small}}>
          <TextButton onPress={onDismiss}>OK</TextButton>
          {onRetry && <Button onPress={onRetry}>Retry</Button>}
        </View>
      }>
      <View style={{gap: spacing.medium}}>
        {/* Warning icon */}
        <Text
          style={{
            fontSize: 48,
            textAlign: 'center',
            color: colors.error,
          }}
          accessibilityLabel="Warning">
          ⚠️
        </Text>

        {/* Error message */}
        <Text style={[typography.bodyMedium, {color: colors.onSurface}]}>
          {message}
        </Text>

        {/* Divider */}
        <View
          style={{
            height: 1,
            backgroundColor: colors.surfaceVariant,
            marginVertical: spacing.small,
          }}
        />

        {/* Troubleshooting section */}
        <Text
          style={[
            typography.labelLarge,
            {
              color: colors.primary,
              fontWeight: 'bold',
            },
          ]}>
          Troubleshooting tips:
        </Text>

        <View style={{gap: spacing.small}}>
          {troubleshootingTips.map((tip, index) => (
            <Text
              key={index}
              style={[typography.bodySmall, {color: colors.onSurfaceVariant}]}>
              {tip}
            </Text>
          ))}
        </View>
      </View>
    </Modal>
  );
};
