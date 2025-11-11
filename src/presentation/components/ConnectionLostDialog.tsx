/**
 * ConnectionLostDialog Component
 * Critical alert dialog shown when BLE connection is lost during an active workout
 * Migrated from Android Compose ConnectionLostDialog
 */

import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useColors, useTypography, useSpacing} from '../theme';
import {Modal} from './Modal';
import {Button, TextButton} from './Button';

export interface ConnectionLostDialogProps {
  visible: boolean;
  onReconnect: () => void;
  onDismiss: () => void;
  testID?: string;
}

/**
 * Critical alert dialog shown when BLE connection is lost during an active workout
 * Addresses Issue #43: Connection lost during screen lock
 */
export const ConnectionLostDialog: React.FC<ConnectionLostDialogProps> = ({
  visible,
  onReconnect,
  onDismiss,
  testID,
}) => {
  const colors = useColors();
  const typography = useTypography();
  const spacing = useSpacing();

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      title="Connection Lost"
      variant="center"
      testID={testID}
      footer={
        <View style={{flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.small}}>
          <TextButton onPress={onDismiss}>Dismiss</TextButton>
          <Button onPress={onReconnect}>Reconnect</Button>
        </View>
      }>
      <View style={{gap: spacing.small}}>
        {/* Bluetooth disabled icon */}
        <Text
          style={{
            fontSize: 48,
            textAlign: 'center',
            color: colors.error,
          }}
          accessibilityLabel="Bluetooth disconnected">
          🔴
        </Text>

        <Text style={[typography.bodyLarge, {color: colors.onSurface}]}>
          Bluetooth connection to the trainer was lost during your workout.
        </Text>

        <Text style={[typography.bodyMedium, {color: colors.onSurfaceVariant}]}>
          Rep tracking may have been interrupted. Please reconnect to continue.
        </Text>
      </View>
    </Modal>
  );
};
