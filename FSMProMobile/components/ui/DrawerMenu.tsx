import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '@/constants/Theme';
import { useAuth } from '../../src/context/AuthContext';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.75;

interface DrawerMenuProps {
  visible: boolean;
  onClose: () => void;
}

export function DrawerMenu({ visible, onClose }: DrawerMenuProps) {
  const { user, logout } = useAuth();
  const slideAnim = React.useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -DRAWER_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleLogout = async () => {
    onClose();
    await logout();
    router.replace('/login');
  };

  const isCustomer = user?.role === 'customer';

  const menuItems = [
    {
      icon: 'document-text-outline',
      label: 'Work Orders',
      onPress: () => {
        onClose();
        router.push('/(tabs)');
      },
      showFor: 'technician',
    },
    {
      icon: 'cube-outline',
      label: 'My Equipment',
      onPress: () => {
        onClose();
        router.push('/(tabs)/customer-dashboard');
      },
      showFor: 'customer',
    },
    {
      icon: 'calendar-outline',
      label: 'Schedule',
      onPress: () => {
        onClose();
        router.push('/(tabs)/schedule');
      },
      showFor: 'technician',
    },
    {
      icon: 'cube-outline',
      label: 'Inventory',
      onPress: () => {
        onClose();
        router.push('/(tabs)/inventory');
      },
      showFor: 'technician',
    },
    {
      icon: 'location-outline',
      label: 'Tracking',
      onPress: () => {
        onClose();
        router.push('/(tabs)/tracking');
      },
      showFor: 'technician',
    },
    {
      icon: 'person-outline',
      label: 'Profile',
      onPress: () => {
        onClose();
        router.push('/(tabs)/profile');
      },
      showFor: 'both',
    },
  ].filter(item =>
    item.showFor === 'both' ||
    (item.showFor === 'customer' && isCustomer) ||
    (item.showFor === 'technician' && !isCustomer)
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.drawer,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.scrollView}>
              {/* Header */}
              <View style={styles.drawerHeader}>
                <View style={styles.profileSection}>
                  <View style={styles.avatar}>
                    <Ionicons name="person" size={32} color={Theme.colors.white} />
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user?.full_name || 'User'}</Text>
                    <Text style={styles.userEmail}>{user?.email || ''}</Text>
                    <Text style={styles.userRole}>
                      {user?.role === 'technician' ? 'Technician' : 'Customer'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Menu Items */}
              <View style={styles.menuItems}>
                {menuItems.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.menuItem}
                    onPress={item.onPress}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={24}
                      color={Theme.colors.text.secondary}
                    />
                    <Text style={styles.menuItemText}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Logout */}
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={24} color={Theme.colors.error.DEFAULT} />
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: Theme.colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 2,
  },
  backdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  drawerHeader: {
    backgroundColor: Theme.colors.primary.DEFAULT,
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Theme.colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.white,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: Theme.colors.primary[100],
    marginBottom: 4,
  },
  userRole: {
    fontSize: 12,
    color: Theme.colors.primary[200],
    textTransform: 'capitalize',
  },
  menuItems: {
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  menuItemText: {
    fontSize: 16,
    color: Theme.colors.text.primary,
    marginLeft: 16,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: Theme.colors.border.light,
    marginVertical: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  logoutText: {
    fontSize: 16,
    color: Theme.colors.error.DEFAULT,
    marginLeft: 16,
    fontWeight: '500',
  },
});

