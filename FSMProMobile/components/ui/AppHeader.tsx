import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '@/constants/Theme';
import { ThemedText } from '@/components/ThemedText';
import { DrawerMenu } from './DrawerMenu';

interface AppHeaderProps {
  title: string;
  showNotifications?: boolean;
  showProfile?: boolean;
}

export function AppHeader({
  title,
  showNotifications = true,
  showProfile = true
}: AppHeaderProps) {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <>
      <DrawerMenu visible={drawerVisible} onClose={() => setDrawerVisible(false)} />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setDrawerVisible(true)}
          >
            <Ionicons name="menu-outline" size={24} color={Theme.colors.text.primary} />
          </TouchableOpacity>
          <ThemedText type="heading" style={styles.headerTitle}>{title}</ThemedText>
        </View>
        <View style={styles.headerRight}>
          {showNotifications && (
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={24} color={Theme.colors.text.primary} />
            </TouchableOpacity>
          )}
          {showProfile && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <Ionicons name="person-outline" size={24} color={Theme.colors.text.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Theme.colors.white,
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: Theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border.light,
    ...Theme.shadows.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    padding: Theme.spacing.sm,
  },
  headerTitle: {
    marginLeft: Theme.spacing.sm,
    fontSize: 20,
  },
});

