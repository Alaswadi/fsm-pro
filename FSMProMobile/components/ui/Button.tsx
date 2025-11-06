import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle, StyleProp, ActivityIndicator } from 'react-native';
import { Theme } from '@/constants/Theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        styles[size],
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? Theme.colors.white : Theme.colors.primary.DEFAULT}
        />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              styles[`${variant}Text`],
              styles[`${size}Text`],
              (disabled || loading) && styles.disabledText,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Theme.borderRadius.button,
    gap: Theme.spacing.sm,
  },
  
  // Variants
  primary: {
    backgroundColor: Theme.colors.primary.DEFAULT,
  },
  secondary: {
    backgroundColor: Theme.colors.gray[100],
  },
  outline: {
    backgroundColor: Theme.colors.white,
    borderWidth: 1,
    borderColor: Theme.colors.border.light,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  
  // Sizes
  sm: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
  },
  md: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
  },
  lg: {
    paddingHorizontal: Theme.spacing.xl,
    paddingVertical: Theme.spacing.lg,
  },
  
  // Text styles
  text: {
    fontWeight: Theme.typography.fontWeights.medium,
  },
  primaryText: {
    color: Theme.colors.white,
    fontSize: Theme.typography.fontSizes.sm,
  },
  secondaryText: {
    color: Theme.colors.text.primary,
    fontSize: Theme.typography.fontSizes.sm,
  },
  outlineText: {
    color: Theme.colors.text.secondary,
    fontSize: Theme.typography.fontSizes.sm,
  },
  ghostText: {
    color: Theme.colors.primary.DEFAULT,
    fontSize: Theme.typography.fontSizes.sm,
  },
  
  smText: {
    fontSize: Theme.typography.fontSizes.xs,
  },
  mdText: {
    fontSize: Theme.typography.fontSizes.sm,
  },
  lgText: {
    fontSize: Theme.typography.fontSizes.base,
  },
  
  // States
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.8,
  },
});

