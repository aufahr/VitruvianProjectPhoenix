/**
 * Input Component
 * Custom text input with Material Design 3 styling
 * Migrated from Android Compose TextField/OutlinedTextField
 */

import React, {useState} from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps as RNTextInputProps,
} from 'react-native';
import {useColors, useTypography, useSpacing} from '../theme';

export interface InputProps extends Omit<RNTextInputProps, 'style'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'outlined' | 'filled';
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

/**
 * Input component with label, error states, and icons
 * Supports outlined and filled variants
 */
export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  variant = 'outlined',
  containerStyle,
  inputStyle,
  onFocus,
  onBlur,
  ...textInputProps
}) => {
  const colors = useColors();
  const typography = useTypography();
  const spacing = useSpacing();
  const [isFocused, setIsFocused] = useState(false);

  const hasError = !!error;

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  // Container styles based on variant
  const getContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      marginBottom: spacing.medium,
    };

    return baseStyle;
  };

  // Input wrapper styles
  const getInputWrapperStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 8,
      paddingHorizontal: spacing.medium,
    };

    if (variant === 'outlined') {
      return {
        ...baseStyle,
        borderWidth: isFocused ? 2 : 1,
        borderColor: hasError
          ? colors.error
          : isFocused
          ? colors.primary
          : colors.outline,
        backgroundColor: 'transparent',
      };
    }

    // Filled variant
    return {
      ...baseStyle,
      backgroundColor: colors.surfaceVariant,
      borderBottomWidth: isFocused ? 2 : 1,
      borderBottomColor: hasError
        ? colors.error
        : isFocused
        ? colors.primary
        : colors.outline,
      borderRadius: 8,
    };
  };

  const getTextInputStyle = (): TextStyle => {
    return {
      flex: 1,
      ...typography.bodyLarge,
      color: colors.onSurface,
      paddingVertical: spacing.medium,
      minHeight: 48,
    };
  };

  const getLabelStyle = (): TextStyle => {
    return {
      ...typography.bodyMedium,
      color: hasError
        ? colors.error
        : isFocused
        ? colors.primary
        : colors.onSurfaceVariant,
      marginBottom: spacing.extraSmall,
    };
  };

  const getHelperTextStyle = (): TextStyle => {
    return {
      ...typography.bodySmall,
      color: hasError ? colors.error : colors.onSurfaceVariant,
      marginTop: spacing.extraSmall,
      marginLeft: spacing.medium,
    };
  };

  return (
    <View style={[getContainerStyle(), containerStyle]}>
      {label && <Text style={getLabelStyle()}>{label}</Text>}
      <View style={getInputWrapperStyle()}>
        {leftIcon && <View style={{marginRight: spacing.small}}>{leftIcon}</View>}
        <TextInput
          {...textInputProps}
          style={[getTextInputStyle(), inputStyle]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={colors.onSurfaceVariant}
        />
        {rightIcon && <View style={{marginLeft: spacing.small}}>{rightIcon}</View>}
      </View>
      {(error || helperText) && (
        <Text style={getHelperTextStyle()}>{error || helperText}</Text>
      )}
    </View>
  );
};

/**
 * Search Input variant (convenience wrapper)
 */
export const SearchInput: React.FC<InputProps> = props => (
  <Input {...props} placeholder={props.placeholder || 'Search...'} />
);
