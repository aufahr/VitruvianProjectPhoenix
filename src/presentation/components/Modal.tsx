/**
 * Modal Component
 * A reusable modal wrapper with consistent styling
 * Migrated from Android Compose Dialog/ModalBottomSheet
 */

import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import {useColors, useTypography, useSpacing} from '../theme';

export interface ModalProps {
  visible: boolean;
  onDismiss: () => void;
  title?: string;
  children?: React.ReactNode;
  variant?: 'center' | 'bottom' | 'fullscreen';
  showCloseButton?: boolean;
  dismissOnBackdropPress?: boolean;
  dismissOnBackPress?: boolean;
  footer?: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
}

const {height: SCREEN_HEIGHT} = Dimensions.get('window');

/**
 * Modal component supporting center, bottom sheet, and fullscreen variants
 */
export const Modal: React.FC<ModalProps> = ({
  visible,
  onDismiss,
  title,
  children,
  variant = 'center',
  showCloseButton = true,
  dismissOnBackdropPress = true,
  dismissOnBackPress = true,
  footer,
  style,
  testID,
}) => {
  const colors = useColors();
  const typography = useTypography();
  const spacing = useSpacing();

  const getContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: colors.surface,
      borderRadius: 12,
    };

    switch (variant) {
      case 'bottom':
        return {
          ...baseStyle,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          maxHeight: SCREEN_HEIGHT * 0.9,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        };

      case 'fullscreen':
        return {
          ...baseStyle,
          flex: 1,
          borderRadius: 0,
        };

      case 'center':
      default:
        return {
          ...baseStyle,
          maxHeight: SCREEN_HEIGHT * 0.8,
          width: '90%',
          maxWidth: 500,
        };
    }
  };

  const backdropStyle: ViewStyle = {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: variant === 'bottom' ? 'flex-end' : 'center',
    alignItems: 'center',
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType={variant === 'bottom' ? 'slide' : 'fade'}
      onRequestClose={dismissOnBackPress ? onDismiss : undefined}
      testID={testID}>
      <TouchableOpacity
        style={backdropStyle}
        activeOpacity={1}
        onPress={dismissOnBackdropPress ? onDismiss : undefined}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={variant === 'center' ? {} : {width: '100%'}}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={e => e.stopPropagation()}
            style={[getContainerStyle(), style]}>
            {/* Header */}
            {(title || showCloseButton) && (
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: spacing.large,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.surfaceVariant,
                }}>
                {title && (
                  <Text
                    style={[
                      typography.headlineSmall,
                      {color: colors.onSurface, flex: 1},
                    ]}>
                    {title}
                  </Text>
                )}
                {showCloseButton && (
                  <TouchableOpacity
                    onPress={onDismiss}
                    style={{
                      padding: spacing.small,
                      marginLeft: spacing.medium,
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Close modal">
                    <Text
                      style={[
                        typography.titleMedium,
                        {color: colors.onSurfaceVariant},
                      ]}>
                      ✕
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Content */}
            <ScrollView
              style={{
                maxHeight: variant === 'center' ? SCREEN_HEIGHT * 0.6 : undefined,
              }}
              contentContainerStyle={{
                padding: spacing.large,
              }}>
              {children}
            </ScrollView>

            {/* Footer */}
            {footer && (
              <View
                style={{
                  padding: spacing.large,
                  borderTopWidth: 1,
                  borderTopColor: colors.surfaceVariant,
                }}>
                {footer}
              </View>
            )}
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </RNModal>
  );
};

/**
 * Alert Dialog (convenience wrapper)
 */
export const AlertDialog: React.FC<
  ModalProps & {
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  }
> = ({
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  onDismiss,
  ...props
}) => {
  const colors = useColors();
  const typography = useTypography();
  const spacing = useSpacing();

  return (
    <Modal {...props} variant="center" onDismiss={onCancel || onDismiss}>
      <Text style={[typography.bodyLarge, {color: colors.onSurface}]}>
        {message}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-end',
          marginTop: spacing.large,
          gap: spacing.small,
        }}>
        {onCancel && (
          <TouchableOpacity
            onPress={onCancel}
            style={{padding: spacing.medium}}
            accessibilityRole="button">
            <Text style={[typography.labelLarge, {color: colors.primary}]}>
              {cancelText}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={onConfirm || onDismiss}
          style={{padding: spacing.medium}}
          accessibilityRole="button">
          <Text style={[typography.labelLarge, {color: colors.primary}]}>
            {confirmText}
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};
