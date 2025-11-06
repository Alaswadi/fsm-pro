import React from 'react';
import { Text, StyleSheet } from 'react-native';

interface TabIconProps {
  name: 'orders' | 'schedule' | 'inventory' | 'tracking' | 'profile';
  color: string;
  focused?: boolean;
}

export function TabIcon({ name, color, focused }: TabIconProps) {
  const getIcon = () => {
    switch (name) {
      case 'orders':
        return '📋';
      case 'schedule':
        return '📅';
      case 'inventory':
        return '📦';
      case 'tracking':
        return '📍';
      case 'profile':
        return '👤';
      default:
        return '•';
    }
  };

  return (
    <Text style={[styles.icon, { opacity: focused ? 1 : 0.6 }]}>
      {getIcon()}
    </Text>
  );
}

const styles = StyleSheet.create({
  icon: {
    fontSize: 24,
  },
});

