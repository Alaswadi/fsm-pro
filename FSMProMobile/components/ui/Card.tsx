import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Pressable } from 'react-native';
import { Theme } from '@/constants/Theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  variant?: 'default' | 'elevated';
}

export function Card({ children, style, onPress, variant = 'default' }: CardProps) {
  const Component = onPress ? Pressable : View;
  
  return (
    <Component
      onPress={onPress}
      style={[
        styles.card,
        variant === 'elevated' && styles.elevated,
        style,
      ]}
    >
      {children}
    </Component>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.colors.white,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.layout.cardPadding,
    ...Theme.shadows.sm,
  },
  elevated: {
    ...Theme.shadows.md,
  },
});

