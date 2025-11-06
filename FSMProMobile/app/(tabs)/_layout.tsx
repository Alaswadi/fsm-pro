import { Tabs, Redirect } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/HapticTab';
import { TabIcon } from '@/components/ui/TabIcon';
import { useAuth } from '../../src/context/AuthContext';
import { Theme } from '@/constants/Theme';

export default function TabLayout() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const insets = useSafeAreaInsets();

  // Redirect to login if not authenticated
  if (!isLoading && !isAuthenticated) {
    return <Redirect href="/login" />;
  }

  const isCustomer = user?.role === 'customer';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Theme.colors.primary.DEFAULT,
        tabBarInactiveTintColor: Theme.colors.gray[400],
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          display: 'none',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}>
      <Tabs.Screen
        name="customer-dashboard"
        options={{
          title: 'My Equipment',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="inventory" color={color} focused={focused} />
          ),
          href: isCustomer ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="orders" color={color} focused={focused} />
          ),
          href: !isCustomer ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="profile" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="schedule" color={color} focused={focused} />
          ),
          href: !isCustomer ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="tracking"
        options={{
          title: 'Tracking',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="tracking" color={color} focused={focused} />
          ),
          href: !isCustomer ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Inventory',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="inventory" color={color} focused={focused} />
          ),
          href: !isCustomer ? undefined : null,
        }}
      />
    </Tabs>
  );
}
