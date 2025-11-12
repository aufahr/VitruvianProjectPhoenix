/**
 * Button Component
 * Reusable React Native button with multiple variants and sizes
 * Supports icons, loading states, and accessibility
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import {useColors, useTypography, useSpacing} from '../theme';

export interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: 'filled' | 'outlined' | 'text' | 'elevated';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
  testID?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  variant = 'filled',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
  accessibilityLabel,
  testID,
}) => {
  const colors = useColors();
  const typography = useTypography();
  const spacing = useSpacing();

  const isDisabled = disabled || loading;

  // Get button styles based on variant
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      opacity: isDisabled ? 0.5 : 1,
      ...(fullWidth && {width: '100%'}),
    };

    // Size-specific padding
    const sizeStyles: Record<string, ViewStyle> = {
      small: {
        paddingHorizontal: spacing.medium,
        paddingVertical: spacing.small,
        minHeight: 36,
      },
      medium: {
        paddingHorizontal: spacing.large,
        paddingVertical: spacing.medium,
        minHeight: 44,
      },
      large: {
        paddingHorizontal: spacing.extraLarge,
        paddingVertical: spacing.large - 4,
        minHeight: 52,
      },
    };

    // Variant-specific styles
    const variantStyles: Record<string, ViewStyle> = {
      filled: {
        backgroundColor: colors.primary,
      },
      elevated: {
        backgroundColor: colors.primary,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      outlined: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.outline,
      },
      text: {
        backgroundColor: 'transparent',
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  // Get text styles based on variant
  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontWeight: '600',
    };

    const sizeStyles: Record<string, TextStyle> = {
      small: typography.labelMedium,
      medium: typography.labelLarge,
      large: typography.titleMedium,
    };

    const variantTextColor: Record<string, string> = {
      filled: colors.onPrimary,
      elevated: colors.onPrimary,
      outlined: colors.primary,
      text: colors.primary,
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      color: variantTextColor[variant],
    };
  };

  const buttonStyles = [getButtonStyle(), style];
  const textStyles = [getTextStyle(), textStyle];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{disabled: isDisabled}}
      testID={testID}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'filled' || variant === 'elevated' ? colors.onPrimary : colors.primary}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <View style={{marginRight: spacing.small}}>{icon}</View>
          )}
          <Text style={textStyles}>{children}</Text>
          {icon && iconPosition === 'right' && (
            <View style={{marginLeft: spacing.small}}>{icon}</View>
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

/**
 * Text Button variant (convenience wrapper)
 */
export const TextButton: React.FC<ButtonProps> = props => (
  <Button {...props} variant="text" />
);

/**
 * Outlined Button variant (convenience wrapper)
 */
export const OutlinedButton: React.FC<ButtonProps> = props => (
  <Button {...props} variant="outlined" />
);
