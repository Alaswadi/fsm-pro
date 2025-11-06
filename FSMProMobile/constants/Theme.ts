/**
 * Centralized Theme Configuration
 * Matches the design system from mobdesign HTML files
 */

export const Theme = {
  colors: {
    // Primary Colors (matching #3B82F6)
    primary: {
      DEFAULT: '#3B82F6',
      50: '#EFF6FF',
      100: '#DBEAFE',
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#60A5FA',
      500: '#3B82F6',
      600: '#2563EB',
      700: '#1D4ED8',
      800: '#1E40AF',
      900: '#1E3A8A',
    },
    
    // Secondary Colors
    secondary: {
      DEFAULT: '#1E40AF',
      50: '#EFF6FF',
      100: '#DBEAFE',
      500: '#1E40AF',
      700: '#1E3A8A',
    },
    
    // Neutral/Gray Colors
    gray: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },
    
    // Semantic Colors
    success: {
      DEFAULT: '#10B981',
      50: '#ECFDF5',
      100: '#D1FAE5',
      600: '#059669',
      800: '#065F46',
    },
    
    warning: {
      DEFAULT: '#F59E0B',
      50: '#FFFBEB',
      100: '#FEF3C7',
      600: '#D97706',
      800: '#92400E',
    },
    
    error: {
      DEFAULT: '#EF4444',
      50: '#FEF2F2',
      100: '#FEE2E2',
      600: '#DC2626',
      800: '#991B1B',
    },
    
    info: {
      DEFAULT: '#3B82F6',
      50: '#EFF6FF',
      100: '#DBEAFE',
      600: '#2563EB',
      800: '#1E40AF',
    },
    
    // Status Colors (matching HTML designs)
    status: {
      inProgress: {
        bg: '#DBEAFE',
        text: '#1E40AF',
      },
      scheduled: {
        bg: '#FEF3C7',
        text: '#92400E',
      },
      urgent: {
        bg: '#FEE2E2',
        text: '#991B1B',
      },
      completed: {
        bg: '#D1FAE5',
        text: '#065F46',
      },
    },
    
    // Base Colors
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
    
    // Background Colors
    background: {
      primary: '#F9FAFB',
      secondary: '#FFFFFF',
      tertiary: '#F3F4F6',
    },
    
    // Text Colors
    text: {
      primary: '#111827',
      secondary: '#6B7280',
      tertiary: '#9CA3AF',
      inverse: '#FFFFFF',
    },
    
    // Border Colors
    border: {
      light: '#E5E7EB',
      DEFAULT: '#D1D5DB',
      dark: '#9CA3AF',
    },
  },
  
  // Spacing (in pixels)
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 48,
    '5xl': 64,
  },
  
  // Border Radius (matching HTML designs)
  borderRadius: {
    none: 0,
    sm: 4,
    DEFAULT: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    full: 9999,
    button: 8,
  },
  
  // Typography
  typography: {
    fontSizes: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
    },
    
    lineHeights: {
      xs: 16,
      sm: 20,
      base: 24,
      lg: 28,
      xl: 28,
      '2xl': 32,
      '3xl': 36,
      '4xl': 40,
    },
    
    fontWeights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  
  // Shadows (matching HTML shadow-sm)
  shadows: {
    none: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.15,
      shadowRadius: 15,
      elevation: 8,
    },
  },
  
  // Layout
  layout: {
    headerHeight: 64,
    tabBarHeight: 64,
    containerPadding: 16,
    cardPadding: 16,
  },
  
  // Animations
  animations: {
    duration: {
      fast: 150,
      normal: 300,
      slow: 500,
    },
  },
};

// Helper function to get status colors
export const getStatusColor = (status: string) => {
  const statusMap: { [key: string]: { bg: string; text: string } } = {
    'In Progress': Theme.colors.status.inProgress,
    'Scheduled': Theme.colors.status.scheduled,
    'Urgent': Theme.colors.status.urgent,
    'Completed': Theme.colors.status.completed,
    'Pending': Theme.colors.status.scheduled,
    'Cancelled': Theme.colors.status.error,
  };
  
  return statusMap[status] || Theme.colors.status.inProgress;
};

// Helper function to get priority colors
export const getPriorityColor = (priority: string) => {
  const priorityMap: { [key: string]: string } = {
    'Critical': Theme.colors.error.DEFAULT,
    'High': Theme.colors.warning.DEFAULT,
    'Medium': Theme.colors.primary.DEFAULT,
    'Low': Theme.colors.success.DEFAULT,
  };
  
  return priorityMap[priority] || Theme.colors.gray[500];
};

export default Theme;

