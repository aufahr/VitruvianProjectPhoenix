/**
 * ConnectingOverlay Component
 * Full-screen overlay showing "Connecting..." with animation
 * Reusable React Native component
 */

import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useColors, useTypography, useSpacing} from '../theme';
import {Modal} from './Modal';
import {LoadingSpinner} from './LoadingSpinner';
import {Card} from './Card';

export interface ConnectingOverlayProps {
  visible: boolean;
  title?: string;
  subtitle?: string;
  testID?: string;
}

/**
 * Full-screen overlay showing connection progress
 * Non-dismissible while connecting
 */
export const ConnectingOverlay: React.FC<ConnectingOverlayProps> = ({
  visible,
  title = 'Connecting to device...',
  subtitle = 'Scanning for Vitruvian Trainer',
  testID,
}) => {
  const colors = useColors();
  const typography = useTypography();
  const spacing = useSpacing();

  return (
    <Modal
      visible={visible}
      onDismiss={() => {}}
      variant="center"
      dismissOnBackdropPress={false}
      dismissOnBackPress={false}
      showCloseButton={false}
      testID={testID}>
      <View
        style={{
          alignItems: 'center',
          padding: spacing.large,
          gap: spacing.medium,
        }}>
        <LoadingSpinner size="large" />
        <Text
          style={[
            typography.titleMedium,
            {
              color: colors.onSurface,
              textAlign: 'center',
            },
          ]}>
          {title}
        </Text>
        <Text
          style={[
            typography.bodySmall,
            {
              color: colors.onSurfaceVariant,
              textAlign: 'center',
            },
          ]}>
          {subtitle}
        </Text>
      </View>
    </Modal>
  );
};
