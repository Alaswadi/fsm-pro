# FSM Pro Mobile - Screen-by-Screen Improvement Guide

This document provides specific, actionable recommendations for each screen in the FSM Pro mobile app.

---

## 🔐 Login Screen (`app/login.tsx`)

### Current Issues
- Basic form layout
- No visual feedback during login
- Static logo
- Keyboard covers input fields

### Recommended Improvements

#### 1. Visual Enhancements
```typescript
// Add animated logo
import { MotiView } from 'moti';

<MotiView
  from={{ scale: 0.8, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{ type: 'spring', duration: 800 }}
>
  <Ionicons name="construct" size={64} color="#ea2a33" />
</MotiView>
```

#### 2. Better Keyboard Handling
```typescript
import { KeyboardAvoidingView, Platform } from 'react-native';

<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  className="flex-1"
  keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
>
```

#### 3. Loading State
```typescript
// Replace basic ActivityIndicator
<Button
  title="Sign In"
  onPress={handleLogin}
  loading={isLoading}
  icon="log-in-outline"
  fullWidth
/>
```

#### 4. Error Handling
```typescript
// Add animated error message
{error && (
  <MotiView
    from={{ opacity: 0, translateY: -10 }}
    animate={{ opacity: 1, translateY: 0 }}
    className="bg-red-50 p-3 rounded-lg mb-4"
  >
    <Text className="text-red-600 text-sm">{error}</Text>
  </MotiView>
)}
```

#### 5. Biometric Login (Future)
```typescript
import * as LocalAuthentication from 'expo-local-authentication';

const handleBiometricLogin = async () => {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  
  if (hasHardware && isEnrolled) {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Login with biometrics',
    });
    
    if (result.success) {
      // Auto-login
    }
  }
};
```

**Priority:** Medium | **Effort:** Low

---

## 📋 Work Orders Tab (`app/(tabs)/index.tsx`)

### Current Issues
- Basic list rendering
- No skeleton loader
- Filter buttons could be better
- No search functionality

### Recommended Improvements

#### 1. Skeleton Loader
```typescript
import { WorkOrderSkeleton } from '@/components/ui/SkeletonLoader';

if (isLoading) {
  return <WorkOrderSkeleton />;
}
```

#### 2. Enhanced Filter UI
```typescript
// Replace basic buttons with chips
import { Chip } from '@/components/ui/Chip';

<ScrollView horizontal showsHorizontalScrollIndicator={false}>
  {['all', 'scheduled', 'in_progress', 'completed'].map((filter) => (
    <Chip
      key={filter}
      label={filter.replace('_', ' ').toUpperCase()}
      selected={selectedFilter === filter}
      onPress={() => setSelectedFilter(filter)}
      icon={getFilterIcon(filter)}
    />
  ))}
</ScrollView>
```

#### 3. Search Bar
```typescript
import { SearchBar } from '@/components/ui/SearchBar';

<SearchBar
  placeholder="Search work orders..."
  value={searchQuery}
  onChangeText={setSearchQuery}
  onClear={() => setSearchQuery('')}
/>
```

#### 4. Animated List Items
```typescript
import { FlashList } from '@shopify/flash-list';
import { MotiView } from 'moti';

<FlashList
  data={filteredJobs}
  renderItem={({ item, index }) => (
    <MotiView
      from={{ opacity: 0, translateX: -20 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ delay: index * 50 }}
    >
      <JobCard job={item} />
    </MotiView>
  )}
  estimatedItemSize={120}
/>
```

#### 5. Swipe Actions
```typescript
import { Swipeable } from 'react-native-gesture-handler';

const renderRightActions = () => (
  <View className="flex-row">
    <TouchableOpacity className="bg-blue-500 justify-center px-6">
      <Ionicons name="eye-outline" size={24} color="white" />
    </TouchableOpacity>
    <TouchableOpacity className="bg-green-500 justify-center px-6">
      <Ionicons name="checkmark-outline" size={24} color="white" />
    </TouchableOpacity>
  </View>
);

<Swipeable renderRightActions={renderRightActions}>
  <JobCard job={item} />
</Swipeable>
```

#### 6. Pull-to-Refresh Enhancement
```typescript
import { RefreshControl } from 'react-native';

<RefreshControl
  refreshing={isRefreshing}
  onRefresh={onRefresh}
  tintColor="#ea2a33"
  colors={['#ea2a33']}
  progressBackgroundColor="#ffffff"
/>
```

**Priority:** High | **Effort:** Medium

---

## 📅 Schedule Tab (`app/(tabs)/schedule.tsx`)

### Current Issues
- Basic calendar styling
- No visual feedback on date selection
- Job cards could be more informative

### Recommended Improvements

#### 1. Enhanced Calendar Theme
```typescript
<Calendar
  theme={{
    backgroundColor: '#ffffff',
    calendarBackground: '#ffffff',
    textSectionTitleColor: '#6b7280',
    selectedDayBackgroundColor: '#ea2a33',
    selectedDayTextColor: '#ffffff',
    todayTextColor: '#ea2a33',
    dayTextColor: '#111827',
    textDisabledColor: '#d1d5db',
    dotColor: '#ea2a33',
    selectedDotColor: '#ffffff',
    arrowColor: '#ea2a33',
    monthTextColor: '#111827',
    textDayFontWeight: '500',
    textMonthFontWeight: 'bold',
    textDayHeaderFontWeight: '600',
  }}
/>
```

#### 2. Timeline View
```typescript
// Add timeline visualization for jobs
<View className="flex-row items-center mb-4">
  <View className="w-16">
    <Text className="text-sm font-semibold text-gray-900">
      {formatTime(job.scheduled_date)}
    </Text>
  </View>
  
  <View className="flex-1 ml-4">
    <View className="h-px bg-gray-200 absolute top-1/2 left-0 right-0" />
    <View className="w-3 h-3 rounded-full bg-primary-500 border-2 border-white" />
  </View>
  
  <Card className="flex-1 ml-4">
    <JobDetails job={job} />
  </Card>
</View>
```

#### 3. Day Summary
```typescript
// Add summary at top of day view
<Card className="mb-4 bg-primary-50">
  <View className="flex-row justify-between items-center">
    <View>
      <Text className="text-2xl font-bold text-gray-900">
        {jobs.length}
      </Text>
      <Text className="text-sm text-gray-600">
        {jobs.length === 1 ? 'Job' : 'Jobs'} Today
      </Text>
    </View>
    
    <View>
      <Text className="text-2xl font-bold text-gray-900">
        {totalHours}h
      </Text>
      <Text className="text-sm text-gray-600">
        Total Duration
      </Text>
    </View>
  </View>
</Card>
```

#### 4. Empty State for Selected Date
```typescript
{jobs.length === 0 && (
  <EmptyState
    icon="calendar-outline"
    title="No Jobs Scheduled"
    description={`No jobs scheduled for ${formatDate(selectedDate)}`}
    action={{
      label: 'View All Jobs',
      onPress: () => router.push('/(tabs)'),
    }}
  />
)}
```

**Priority:** Medium | **Effort:** Medium

---

## 📦 Inventory Tab (`app/(tabs)/inventory.tsx`)

### Current Issues
- List-only view
- Basic search
- No visual stock indicators
- No quick actions

### Recommended Improvements

#### 1. Grid/List Toggle
```typescript
const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

<View className="flex-row justify-between items-center mb-4">
  <SearchBar ... />
  
  <View className="flex-row gap-2">
    <IconButton
      icon="list-outline"
      selected={viewMode === 'list'}
      onPress={() => setViewMode('list')}
    />
    <IconButton
      icon="grid-outline"
      selected={viewMode === 'grid'}
      onPress={() => setViewMode('grid')}
    />
  </View>
</View>
```

#### 2. Stock Level Visualization
```typescript
// Add progress bar for stock levels
<View className="mt-2">
  <View className="flex-row justify-between mb-1">
    <Text className="text-xs text-gray-600">Stock Level</Text>
    <Text className="text-xs font-semibold text-gray-900">
      {item.current_stock} / {item.max_stock}
    </Text>
  </View>
  
  <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
    <View 
      className={`h-full ${getStockColor(item.current_stock, item.min_stock)}`}
      style={{ width: `${(item.current_stock / item.max_stock) * 100}%` }}
    />
  </View>
</View>
```

#### 3. Quick Actions
```typescript
// Add floating action button for quick add
<TouchableOpacity
  className="absolute bottom-6 right-6 w-14 h-14 bg-primary-500 rounded-full items-center justify-center shadow-lg"
  onPress={() => setShowAddModal(true)}
>
  <Ionicons name="add" size={28} color="white" />
</TouchableOpacity>
```

#### 4. Filter Bottom Sheet
```typescript
import BottomSheet from '@gorhom/bottom-sheet';

<BottomSheet
  ref={filterSheetRef}
  snapPoints={['50%', '75%']}
  enablePanDownToClose
>
  <BottomSheetView className="p-4">
    <Text className="text-xl font-bold mb-4">Filter Inventory</Text>
    
    <FilterSection title="Category">
      {categories.map(cat => (
        <Checkbox
          key={cat}
          label={cat}
          checked={selectedCategories.includes(cat)}
          onPress={() => toggleCategory(cat)}
        />
      ))}
    </FilterSection>
    
    <FilterSection title="Stock Status">
      <Checkbox label="Low Stock" checked={showLowStock} />
      <Checkbox label="Out of Stock" checked={showOutOfStock} />
    </FilterSection>
  </BottomSheetView>
</BottomSheet>
```

**Priority:** Medium | **Effort:** Medium

---

## 👤 Profile Tab (`app/(tabs)/profile.tsx`)

### Current Issues
- Static summary data
- No settings section
- Basic layout
- No theme toggle

### Recommended Improvements

#### 1. Avatar Upload
```typescript
import * as ImagePicker from 'expo-image-picker';

const pickImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });
  
  if (!result.canceled) {
    // Upload avatar
  }
};

<TouchableOpacity onPress={pickImage}>
  <Image source={{ uri: avatarUrl }} className="w-30 h-30 rounded-full" />
  <View className="absolute bottom-0 right-0 bg-primary-500 rounded-full p-2">
    <Ionicons name="camera" size={16} color="white" />
  </View>
</TouchableOpacity>
```

#### 2. Stats Visualization
```typescript
// Replace static stats with animated progress
import { CircularProgress } from '@/components/ui/CircularProgress';

<View className="flex-row justify-around">
  <CircularProgress
    value={95}
    label="Weekly"
    color="#10b981"
  />
  <CircularProgress
    value={98}
    label="Monthly"
    color="#3b82f6"
  />
</View>
```

#### 3. Settings Section
```typescript
<Card className="mt-4">
  <Text className="text-lg font-semibold mb-4">Settings</Text>
  
  <SettingRow
    icon="moon-outline"
    label="Dark Mode"
    value={
      <Switch
        value={isDarkMode}
        onValueChange={toggleDarkMode}
      />
    }
  />
  
  <SettingRow
    icon="notifications-outline"
    label="Notifications"
    onPress={() => router.push('/settings/notifications')}
  />
  
  <SettingRow
    icon="lock-closed-outline"
    label="Privacy"
    onPress={() => router.push('/settings/privacy')}
  />
</Card>
```

#### 4. Quick Actions
```typescript
<View className="flex-row gap-3 mt-4">
  <QuickActionButton
    icon="calendar-outline"
    label="My Schedule"
    onPress={() => router.push('/(tabs)/schedule')}
  />
  <QuickActionButton
    icon="stats-chart-outline"
    label="Performance"
    onPress={() => router.push('/performance')}
  />
  <QuickActionButton
    icon="help-circle-outline"
    label="Help"
    onPress={() => router.push('/help')}
  />
</View>
```

**Priority:** Medium | **Effort:** Low

---

## 📄 Work Order Details (`app/work-order-details.tsx`)

### Current Issues
- Long scrolling page
- Modals for updates
- No quick actions
- Heavy information density

### Recommended Improvements

#### 1. Sticky Header with Actions
```typescript
<View className="sticky top-0 bg-white z-10 shadow-sm">
  <View className="flex-row justify-between items-center p-4">
    <TouchableOpacity onPress={() => router.back()}>
      <Ionicons name="arrow-back" size={24} />
    </TouchableOpacity>
    
    <View className="flex-row gap-3">
      <IconButton icon="share-outline" onPress={handleShare} />
      <IconButton icon="bookmark-outline" onPress={handleBookmark} />
      <IconButton icon="ellipsis-vertical" onPress={showMenu} />
    </View>
  </View>
</View>
```

#### 2. Collapsible Sections
```typescript
import { Collapsible } from '@/components/ui/Collapsible';

<Collapsible title="Equipment Details" defaultExpanded>
  <EquipmentInfo job={job} />
</Collapsible>

<Collapsible title="Status History">
  <StatusTimeline history={statusHistory} />
</Collapsible>

<Collapsible title="Ordered Equipment">
  <OrderedEquipmentList items={orderedEquipment} />
</Collapsible>
```

#### 3. Bottom Sheet for Status Update
```typescript
// Replace modal with bottom sheet
<BottomSheet ref={statusSheetRef} snapPoints={['60%']}>
  <BottomSheetView className="p-4">
    <Text className="text-xl font-bold mb-4">Update Status</Text>
    
    <StatusOptions
      current={job.status}
      onSelect={handleStatusUpdate}
    />
  </BottomSheetView>
</BottomSheet>
```

#### 4. Photo Gallery
```typescript
import { ImageGallery } from '@/components/ui/ImageGallery';

<ImageGallery
  images={job.photos}
  onAdd={handleAddPhoto}
  onDelete={handleDeletePhoto}
  columns={3}
/>
```

**Priority:** High | **Effort:** High

---

## 🏭 Workshop Queue (`app/workshop-queue.tsx`)

### Current Issues
- Basic card layout
- No priority visualization
- Limited filtering

### Recommended Improvements

#### 1. Priority Indicators
```typescript
// Add visual priority indicators
<View className="absolute top-0 left-0 w-1 h-full bg-${getPriorityColor(job.priority)}" />
```

#### 2. Drag to Claim
```typescript
import { PanGestureHandler } from 'react-native-gesture-handler';

// Implement swipe-to-claim gesture
```

#### 3. Filter & Sort
```typescript
<View className="flex-row gap-2 mb-4">
  <FilterChip
    label="All"
    count={queueJobs.length}
    selected={filter === 'all'}
  />
  <FilterChip
    label="Urgent"
    count={urgentCount}
    selected={filter === 'urgent'}
  />
  <FilterChip
    label="High"
    count={highCount}
    selected={filter === 'high'}
  />
</View>
```

**Priority:** Medium | **Effort:** Medium

---

## 🔧 Equipment Tracking (`app/equipment-tracking.tsx`)

### Current Issues
- Basic timeline
- Static progress indicator
- No real-time updates

### Recommended Improvements

#### 1. Animated Timeline
```typescript
import { MotiView } from 'moti';

{statuses.map((status, index) => (
  <MotiView
    key={status.key}
    from={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: index * 100 }}
  >
    <TimelineItem status={status} />
  </MotiView>
))}
```

#### 2. Progress Percentage
```typescript
<View className="mb-6">
  <View className="flex-row justify-between mb-2">
    <Text className="font-semibold">Repair Progress</Text>
    <Text className="text-primary-500 font-bold">{progress}%</Text>
  </View>
  
  <ProgressBar value={progress} />
</View>
```

#### 3. Estimated Completion
```typescript
<Card className="bg-blue-50 border-l-4 border-blue-500">
  <View className="flex-row items-center">
    <Ionicons name="time-outline" size={24} color="#3b82f6" />
    <View className="ml-3">
      <Text className="text-sm text-gray-600">Estimated Completion</Text>
      <Text className="text-lg font-bold text-gray-900">
        {formatDate(estimatedCompletion)}
      </Text>
      <Text className="text-xs text-gray-500">
        {daysRemaining} days remaining
      </Text>
    </View>
  </View>
</Card>
```

**Priority:** Medium | **Effort:** Low

---

## 📊 Summary of Priorities

| Screen | Priority | Effort | Impact |
|--------|----------|--------|--------|
| Work Orders Tab | High | Medium | High |
| Work Order Details | High | High | High |
| Login Screen | Medium | Low | Medium |
| Schedule Tab | Medium | Medium | Medium |
| Inventory Tab | Medium | Medium | Medium |
| Profile Tab | Medium | Low | Medium |
| Workshop Queue | Medium | Medium | Medium |
| Equipment Tracking | Medium | Low | Medium |

---

**Next Steps:**
1. Start with Work Orders Tab (highest priority)
2. Implement design system components
3. Apply patterns to other screens
4. Test thoroughly
5. Gather user feedback

