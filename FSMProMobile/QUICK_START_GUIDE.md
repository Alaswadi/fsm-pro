# FSM Pro Mobile - Quick Start Guide for UI/UX Improvements

## 🚀 Getting Started

### Prerequisites
```bash
# Ensure you have the latest dependencies
cd FSMProMobile
npm install

# Start the development server
npm start
```

---

## 📦 Phase 1: Install Essential Packages

### Step 1: Setup NativeWind (Tailwind CSS for React Native)

```bash
# Install NativeWind and Tailwind CSS
npm install nativewind
npm install --save-dev tailwindcss
```

**Create `tailwind.config.js`:**
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ea2a33',
          600: '#dc2626',
          700: '#b91c1c',
        },
        workshop: '#8b5cf6',
      },
    },
  },
  plugins: [],
}
```

**Update `babel.config.js`:**
```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }]
    ],
    plugins: ["nativewind/babel"],
  };
};
```

**Create `global.css`:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Import in `_layout.tsx`:**
```typescript
import "../global.css";
```

### Step 2: Install UI Enhancement Libraries

```bash
# Skeleton loaders
npm install react-native-skeleton-placeholder

# Bottom sheets
npm install @gorhom/bottom-sheet
npm install react-native-reanimated react-native-gesture-handler

# Better lists
npm install @shopify/flash-list

# Animations
npm install moti

# Better toasts
npm install react-native-toast-message
```

### Step 3: Install State Management

```bash
# React Query for data fetching
npm install @tanstack/react-query

# Optional: Zustand for global state
npm install zustand
```

---

## 🎨 Phase 2: Create Design System

### Create `src/theme/index.ts`

```typescript
export const theme = {
  colors: {
    // Brand
    primary: {
      50: '#fef2f2',
      100: '#fee2e2',
      500: '#ea2a33',
      600: '#dc2626',
      700: '#b91c1c',
    },
    
    // Neutrals
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    
    // Semantic
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    workshop: '#8b5cf6',
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 48,
  },
  
  borderRadius: {
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  
  typography: {
    h1: { fontSize: 32, fontWeight: 'bold', lineHeight: 40 },
    h2: { fontSize: 24, fontWeight: 'bold', lineHeight: 32 },
    h3: { fontSize: 20, fontWeight: '600', lineHeight: 28 },
    body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
    caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
  },
  
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 8,
    },
  },
};

export type Theme = typeof theme;
```

---

## 🧩 Phase 3: Create Reusable Components

### Create `src/components/ui/Button.tsx`

```typescript
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  fullWidth = false,
}: ButtonProps) {
  const baseClass = "flex-row items-center justify-center rounded-lg";
  
  const variantClasses = {
    primary: "bg-primary-500 active:bg-primary-600",
    secondary: "bg-gray-100 active:bg-gray-200",
    outline: "border-2 border-primary-500 bg-transparent",
    ghost: "bg-transparent",
  };
  
  const sizeClasses = {
    sm: "px-3 py-2",
    md: "px-4 py-3",
    lg: "px-6 py-4",
  };
  
  const textVariantClasses = {
    primary: "text-white font-semibold",
    secondary: "text-gray-900 font-semibold",
    outline: "text-primary-500 font-semibold",
    ghost: "text-primary-500 font-medium",
  };
  
  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <TouchableOpacity
      className={`
        ${baseClass}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled || loading ? 'opacity-50' : ''}
      `}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'primary' ? 'white' : '#ea2a33'} 
          size="small" 
        />
      ) : (
        <>
          {icon && (
            <Ionicons 
              name={icon} 
              size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20}
              color={variant === 'primary' ? 'white' : '#ea2a33'}
              style={{ marginRight: 8 }}
            />
          )}
          <Text className={`${textVariantClasses[variant]} ${textSizeClasses[size]}`}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
```

### Create `src/components/ui/Card.tsx`

```typescript
import React from 'react';
import { View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ 
  children, 
  variant = 'elevated',
  padding = 'md',
  className = '',
  ...props 
}: CardProps) {
  const variantClasses = {
    default: 'bg-white',
    elevated: 'bg-white shadow-md',
    outlined: 'bg-white border border-gray-200',
  };
  
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <View 
      className={`
        rounded-xl
        ${variantClasses[variant]}
        ${paddingClasses[padding]}
        ${className}
      `}
      {...props}
    >
      {children}
    </View>
  );
}
```

### Create `src/components/ui/SkeletonLoader.tsx`

```typescript
import React from 'react';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';

export function WorkOrderSkeleton() {
  return (
    <SkeletonPlaceholder>
      <SkeletonPlaceholder.Item padding={20}>
        <SkeletonPlaceholder.Item 
          width="100%" 
          height={120} 
          borderRadius={12} 
          marginBottom={16} 
        />
        <SkeletonPlaceholder.Item 
          width="100%" 
          height={120} 
          borderRadius={12} 
          marginBottom={16} 
        />
        <SkeletonPlaceholder.Item 
          width="100%" 
          height={120} 
          borderRadius={12} 
        />
      </SkeletonPlaceholder.Item>
    </SkeletonPlaceholder>
  );
}

export function ProfileSkeleton() {
  return (
    <SkeletonPlaceholder>
      <SkeletonPlaceholder.Item alignItems="center" paddingTop={60}>
        <SkeletonPlaceholder.Item 
          width={120} 
          height={120} 
          borderRadius={60} 
          marginBottom={16} 
        />
        <SkeletonPlaceholder.Item width={200} height={24} borderRadius={4} marginBottom={8} />
        <SkeletonPlaceholder.Item width={120} height={16} borderRadius={4} />
      </SkeletonPlaceholder.Item>
    </SkeletonPlaceholder>
  );
}
```

---

## 🌙 Phase 4: Implement Dark Mode

### Create `src/hooks/useTheme.ts`

```typescript
import { useColorScheme } from 'react-native';
import { theme } from '../theme';

export function useTheme() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  return {
    isDark,
    colors: {
      ...theme.colors,
      background: isDark ? theme.colors.gray[900] : theme.colors.gray[50],
      card: isDark ? theme.colors.gray[800] : '#ffffff',
      text: isDark ? theme.colors.gray[50] : theme.colors.gray[900],
      textSecondary: isDark ? theme.colors.gray[400] : theme.colors.gray[500],
      border: isDark ? theme.colors.gray[700] : theme.colors.gray[200],
    },
    spacing: theme.spacing,
    borderRadius: theme.borderRadius,
    typography: theme.typography,
    shadows: theme.shadows,
  };
}
```

### Usage Example

```typescript
import { useTheme } from '@/hooks/useTheme';

export function MyScreen() {
  const { colors, isDark } = useTheme();
  
  return (
    <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Text className={`${isDark ? 'text-white' : 'text-gray-900'}`}>
        Hello World
      </Text>
    </View>
  );
}
```

---

## 🔄 Phase 5: Setup React Query

### Create `src/providers/QueryProvider.tsx`

```typescript
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

### Update `app/_layout.tsx`

```typescript
import { QueryProvider } from '../src/providers/QueryProvider';

export default function RootLayout() {
  return (
    <QueryProvider>
      <AuthProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AppContent />
        </ThemeProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
```

### Create Custom Hook Example

```typescript
// src/hooks/useWorkOrders.ts
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';

export function useWorkOrders(filter?: string) {
  return useQuery({
    queryKey: ['workOrders', filter],
    queryFn: () => apiService.getJobs({ status: filter }),
    select: (response) => response.data || [],
  });
}

// Usage in component
function WorkOrdersScreen() {
  const { data: jobs, isLoading, refetch } = useWorkOrders('scheduled');
  
  if (isLoading) return <WorkOrderSkeleton />;
  
  return (
    <FlatList
      data={jobs}
      renderItem={({ item }) => <JobCard job={item} />}
      refreshControl={
        <RefreshControl refreshing={false} onRefresh={refetch} />
      }
    />
  );
}
```

---

## ✨ Phase 6: Add Animations

### Example: Animated Card Entry

```typescript
import { MotiView } from 'moti';

function JobCard({ job, index }: { job: Job; index: number }) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{
        type: 'timing',
        duration: 300,
        delay: index * 50, // Stagger animation
      }}
    >
      <Card>
        {/* Card content */}
      </Card>
    </MotiView>
  );
}
```

---

## 📱 Phase 7: Bottom Sheets

### Setup Bottom Sheet

```typescript
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useRef } from 'react';

function MyScreen() {
  const bottomSheetRef = useRef<BottomSheet>(null);
  
  return (
    <>
      <Button 
        title="Open Options" 
        onPress={() => bottomSheetRef.current?.expand()} 
      />
      
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={['25%', '50%', '90%']}
        enablePanDownToClose
      >
        <BottomSheetView>
          {/* Bottom sheet content */}
        </BottomSheetView>
      </BottomSheet>
    </>
  );
}
```

---

## 🎯 Quick Migration Checklist

### For Each Screen:

- [ ] Replace `StyleSheet` with NativeWind classes
- [ ] Replace `ActivityIndicator` with skeleton loaders
- [ ] Add animations for list items
- [ ] Implement dark mode support
- [ ] Replace modals with bottom sheets
- [ ] Use React Query for data fetching
- [ ] Add haptic feedback
- [ ] Enhance empty states
- [ ] Add error boundaries
- [ ] Test accessibility

---

## 📚 Additional Resources

- [NativeWind Docs](https://www.nativewind.dev/)
- [React Query Docs](https://tanstack.com/query/latest)
- [Moti Docs](https://moti.fyi/)
- [Bottom Sheet Docs](https://gorhom.github.io/react-native-bottom-sheet/)

---

**Happy Coding! 🚀**

