import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { Theme, getStatusColor } from '@/constants/Theme';

interface BadgeProps {
  label: string;
  status?: 'In Progress' | 'Scheduled' | 'Urgent' | 'Completed' | 'Pending' | 'Cancelled';
  variant?: 'status' | 'default';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function Badge({ label, status, variant = 'default', style, textStyle }: BadgeProps) {
  const statusColors = status ? getStatusColor(status) : null;
  
  return (
    <View
      style={[
        styles.badge,
        statusColors && { backgroundColor: statusColors.bg },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          statusColors && { color: statusColors.text },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Theme.colors.gray[100],
  },
  text: {
    fontSize: Theme.typography.fontSizes.xs,
    fontWeight: Theme.typography.fontWeights.medium,
    color: Theme.colors.text.primary,
  },
});

