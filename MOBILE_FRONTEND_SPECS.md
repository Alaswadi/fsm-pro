  # FSM Pro - Mobile Frontend Specification
  **Version:** 2.0  
  **Date:** January 2025  
  **Platform:** React Native (Expo) - iOS & Android  
  **Target Users:** Field Technicians & Customers

  ---

  ## 📋 Table of Contents

  1. [Executive Summary](#executive-summary)
  2. [Application Overview](#application-overview)
  3. [User Roles & Personas](#user-roles--personas)
  4. [Core Features & Functionality](#core-features--functionality)
  5. [API Integration](#api-integration)
  6. [Screen Specifications](#screen-specifications)
  7. [UI/UX Design System](#uiux-design-system)
  8. [Technical Architecture](#technical-architecture)
  9. [Performance & Optimization](#performance--optimization)
  10. [Security & Authentication](#security--authentication)
  11. [Offline Capabilities](#offline-capabilities)
  12. [Push Notifications](#push-notifications)
  13. [Development Roadmap](#development-roadmap)

  ---

  ## 1. Executive Summary

  FSM Pro Mobile is a comprehensive field service management application designed to empower technicians and customers with real-time access to work orders, equipment tracking, inventory management, and workshop operations. Built with React Native and Expo, the app provides a native mobile experience for both iOS and Android platforms.

  ### Key Objectives
  - **Technician Productivity**: Enable technicians to manage work orders, track time, order parts, and update job status from the field
  - **Customer Transparency**: Provide customers with real-time visibility into their equipment repair status
  - **Workshop Efficiency**: Streamline workshop/depot repair workflows with intake, queue management, and status tracking
  - **Offline-First**: Ensure technicians can work without constant internet connectivity
  - **Modern UX**: Deliver a polished, intuitive mobile experience with 2025 design standards

  ### Current Status
  - ✅ **MVP Complete**: Basic functionality implemented
  - 🎨 **Design Phase**: Modernization and UX enhancement in progress
  - 🚀 **Production Ready**: Core features stable and tested

  ---

  ## 2. Application Overview

  ### 2.1 Platform & Technology

  | Component | Technology | Version |
  |-----------|-----------|---------|
  | Framework | React Native | 0.79.6 |
  | Platform | Expo | ~53.0.22 |
  | Language | TypeScript | ~5.8.3 |
  | Navigation | Expo Router | ~5.1.5 |
  | State Management | Context API + React Query (planned) | - |
  | API Client | Axios | Latest |
  | Storage | AsyncStorage | Latest |

  ### 2.2 Supported Platforms
  - **iOS**: 13.0+
  - **Android**: 6.0+ (API Level 23+)
  - **Web**: Progressive Web App (PWA) support via Expo

  ### 2.3 Backend API
  - **Base URL**: `https://fsmpro.phishsimulator.com/api`
  - **Authentication**: JWT Bearer Token
  - **API Version**: v1
  - **Documentation**: RESTful API with standardized response format

  ---

  ## 3. User Roles & Personas

  ### 3.1 Technician Role

  **Primary User**: Field service technicians performing on-site and workshop repairs

  **Key Needs**:
  - Quick access to daily work orders
  - Ability to update job status in real-time
  - Order parts/inventory while on the job
  - Capture photos and signatures
  - View customer equipment history
  - Manage workshop repair queue
  - Track time and expenses

  **User Journey**:
  1. Login → View today's schedule
  2. Navigate to job site
  3. Check in to work order
  4. Perform service/repair
  5. Order parts if needed
  6. Update status and add notes
  7. Capture customer signature
  8. Mark job complete
  9. Move to next job

  ### 3.2 Customer Role

  **Primary User**: Business customers tracking their equipment repairs

  **Key Needs**:
  - Real-time equipment repair status
  - Estimated completion dates
  - Intake photos and condition reports
  - Communication with service team
  - Repair history

  **User Journey**:
  1. Login → View equipment dashboard
  2. Select equipment to track
  3. View detailed status timeline
  4. See intake photos and notes
  5. Receive notifications on status changes
  6. Approve completed repairs

  ---

  ## 4. Core Features & Functionality

  ### 4.1 Authentication & Authorization

  #### Features
  - ✅ Email/password login
  - ✅ JWT token-based authentication
  - ✅ Role-based access control (Technician/Customer)
  - ✅ Password reset flow
  - 🔄 Biometric authentication (Face ID/Touch ID) - Planned
  - 🔄 Remember me / Auto-login - Planned

  #### Security
  - Secure token storage in AsyncStorage
  - Automatic token refresh
  - Session timeout handling
  - Role validation on login

  ### 4.2 Technician Features

  #### 4.2.1 Work Orders Management
  **Screen**: Work Orders Tab (`/(tabs)/index.tsx`)

  **Features**:
  - ✅ List all assigned work orders
  - ✅ Filter by status (All, Scheduled, In Progress, Completed)
  - ✅ Status badges with color coding
  - ✅ Workshop job indicators
  - ✅ Pull-to-refresh
  - ✅ Search functionality
  - 🔄 Sort options (date, priority, customer)
  - 🔄 Swipe actions (quick status update, call customer)

  **Data Displayed**:
  - Job number
  - Customer name
  - Equipment type
  - Priority level
  - Status
  - Scheduled date/time
  - Location type (on-site/workshop)
  - Estimated duration

  #### 4.2.2 Work Order Details
  **Screen**: Work Order Details (`/work-order-details.tsx`)

  **Features**:
  - ✅ Comprehensive job information
  - ✅ Status update modal
  - ✅ Notes editing
  - ✅ Photo upload
  - ✅ Equipment status tracking (workshop jobs)
  - ✅ Status history timeline
  - ✅ Inventory ordering
  - ✅ Ordered equipment tracking
  - 🔄 Customer signature capture
  - 🔄 Time tracking (start/stop timer)
  - 🔄 Expense logging
  - 🔄 Navigation to job site

  **Sections**:
  1. **Job Header**: Title, job number, priority, status
  2. **Customer Info**: Name, contact, address
  3. **Equipment Info**: Type, model, serial number
  4. **Job Details**: Description, scheduled date, duration
  5. **Status Management**: Update status, add notes
  6. **Photos**: Upload and view job photos
  7. **Inventory**: Order parts, view ordered items
  8. **History**: Status change timeline
  9. **Actions**: Call customer, navigate, complete job

  #### 4.2.3 Schedule/Calendar
  **Screen**: Schedule Tab (`/(tabs)/schedule.tsx`)

  **Features**:
  - ✅ Calendar view with marked dates
  - ✅ Date selection
  - ✅ Job list filtered by date
  - ✅ Time-based job display
  - 🔄 Week view option
  - 🔄 Drag-and-drop rescheduling
  - 🔄 Availability management

  **Data Displayed**:
  - Jobs per day (marked on calendar)
  - Time slots
  - Job duration
  - Travel time estimates
  - Daily summary (total jobs, hours)

  #### 4.2.4 Inventory Management
  **Screen**: Inventory Tab (`/(tabs)/inventory.tsx`)

  **Features**:
  - ✅ Inventory item listing
  - ✅ Search functionality
  - ✅ Stock level indicators
  - ✅ Low stock warnings
  - 🔄 Barcode scanning
  - 🔄 Request inventory
  - 🔄 Inventory usage history

  **Data Displayed**:
  - Part name and description
  - SKU/Part number
  - Current stock level
  - Unit price
  - Category
  - Compatible equipment

  #### 4.2.5 Workshop Queue
  **Screen**: Workshop Queue (`/workshop-queue.tsx`)

  **Features**:
  - ✅ Unassigned workshop jobs
  - ✅ Priority-based sorting
  - ✅ Job claiming functionality
  - ✅ Days waiting indicator
  - ✅ Equipment status display
  - 🔄 Filter by equipment type
  - 🔄 Filter by priority

  **Data Displayed**:
  - Job number
  - Customer name
  - Equipment type
  - Reported issue
  - Priority
  - Days in queue
  - Estimated repair time

  #### 4.2.6 Profile & Settings
  **Screen**: Profile Tab (`/(tabs)/profile.tsx`)

  **Features**:
  - ✅ User information display
  - ✅ Availability status toggle
  - ✅ Skills and certifications
  - ✅ Contact information
  - ✅ Logout functionality
  - 🔄 Today's summary (dynamic)
  - 🔄 Performance metrics
  - 🔄 Settings (notifications, theme)
  - 🔄 Help & support

  ### 4.3 Customer Features

  #### 4.3.1 Equipment Dashboard
  **Screen**: Customer Dashboard (`/(tabs)/customer-dashboard.tsx`)

  **Features**:
  - ✅ Equipment tracking list
  - ✅ Workshop job status overview
  - ✅ Summary statistics
  - ✅ Equipment status badges
  - 🔄 Filter by status
  - 🔄 Search equipment

  **Data Displayed**:
  - Equipment type and model
  - Current status
  - Location (workshop/on-site)
  - Estimated completion date
  - Assigned technician

  #### 4.3.2 Equipment Tracking
  **Screen**: Equipment Tracking (`/equipment-tracking.tsx`)

  **Features**:
  - ✅ Detailed status timeline
  - ✅ Visual progress indicator
  - ✅ Intake information display
  - ✅ Equipment photos gallery
  - ✅ Customer notes display
  - ✅ Estimated completion date
  - 🔄 Push notifications on status change
  - 🔄 Direct messaging with technician
  - 🔄 Approval workflow

  **Status Timeline**:
  1. Pending Intake
  2. In Transit
  3. Received
  4. In Repair
  5. Repair Completed
  6. Ready for Pickup
  7. Out for Delivery
  8. Returned

  ---

  ## 6. Screen Specifications

  ### 6.1 Authentication Screens

  #### Login Screen
  **Route**: `/login`

  **Layout**:
  ```
  ┌─────────────────────────┐
  │                         │
  │    [FSM Pro Logo]       │
  │                         │
  │  ┌───────────────────┐  │
  │  │ Email             │  │
  │  └───────────────────┘  │
  │                         │
  │  ┌───────────────────┐  │
  │  │ Password          │  │
  │  └───────────────────┘  │
  │                         │
  │  [ Forgot Password? ]   │
  │                         │
  │  ┌───────────────────┐  │
  │  │   LOGIN BUTTON    │  │
  │  └───────────────────┘  │
  │                         │
  │  Health Check Status    │
  └─────────────────────────┘
  ```

  **Features**:
  - Email and password input fields
  - Form validation
  - Show/hide password toggle
  - Forgot password link
  - API health check before login
  - Loading state during authentication
  - Error message display
  - Auto-focus on email field

  **Validation**:
  - Email format validation
  - Required field validation
  - Minimum password length

  **Navigation**:
  - Success → `/(tabs)` (role-based tabs)
  - Forgot Password → `/reset-password`

  ---

  #### Password Reset Flow
  **Routes**: `/reset-password`, `/reset-password-confirm`

  **Step 1 - Request Reset**:
  - Email input
  - Submit button
  - Back to login link

  **Step 2 - Confirm Reset**:
  - Reset token input (from email)
  - New password input
  - Confirm password input
  - Submit button

  ---

  ### 6.2 Technician Screens

  #### Work Orders List
  **Route**: `/(tabs)/index`

  **Layout**:
  ```
  ┌─────────────────────────────┐
  │ Work Orders          [🔔]   │
  ├─────────────────────────────┤
  │ [All][Scheduled][In Prog]   │
  │ [Completed]                 │
  ├─────────────────────────────┤
  │ 🔍 Search work orders...    │
  ├─────────────────────────────┤
  │ ┌─────────────────────────┐ │
  │ │ #WO-001  [HIGH] [🏭]    │ │
  │ │ Printer Repair          │ │
  │ │ Acme Corp               │ │
  │ │ 📅 Today, 2:00 PM       │ │
  │ │ [In Progress]           │ │
  │ └─────────────────────────┘ │
  │                             │
  │ ┌─────────────────────────┐ │
  │ │ #WO-002  [MEDIUM]       │ │
  │ │ Scanner Maintenance     │ │
  │ │ Tech Solutions          │ │
  │ │ 📅 Tomorrow, 10:00 AM   │ │
  │ │ [Scheduled]             │ │
  │ └─────────────────────────┘ │
  │                             │
  │ [Workshop Queue Button]     │
  └─────────────────────────────┘
  ```

  **Components**:
  - **Header**: Title + notification bell
  - **Filter Tabs**: All, Scheduled, In Progress, Completed
  - **Search Bar**: Real-time search
  - **Job Cards**:
    - Job number + priority badge
    - Workshop indicator (🏭)
    - Job title
    - Customer name
    - Scheduled date/time
    - Status badge
  - **Workshop Queue Button**: Access unassigned workshop jobs
  - **Pull-to-Refresh**: Refresh job list

  **Interactions**:
  - Tap card → Navigate to work order details
  - Pull down → Refresh list
  - Tap filter → Filter jobs by status
  - Type in search → Filter by job number, customer, equipment

  ---

  #### Work Order Details
  **Route**: `/work-order-details?id={jobId}`

  **Layout**:
  ```
  ┌─────────────────────────────┐
  │ ← Work Order #WO-001        │
  ├─────────────────────────────┤
  │ [HIGH] [In Progress] [🏭]   │
  │                             │
  │ Printer Repair & Service    │
  │                             │
  │ 👤 Customer                 │
  │ Acme Corporation            │
  │ John Doe                    │
  │ 📞 (555) 123-4567          │
  │ 📧 john@acme.com           │
  │ 📍 123 Main St, City       │
  │                             │
  │ 🔧 Equipment                │
  │ HP LaserJet Pro 4001        │
  │ Serial: ABC123XYZ           │
  │                             │
  │ 📋 Description              │
  │ Printer not responding...   │
  │                             │
  │ 📅 Schedule                 │
  │ Scheduled: Jan 15, 2:00 PM  │
  │ Duration: 2 hours           │
  │                             │
  │ ━━━ Workshop Status ━━━     │
  │ Current: In Repair          │
  │ Est. Completion: Jan 20     │
  │                             │
  │ 📝 Notes                    │
  │ [Add/Edit Notes]            │
  │                             │
  │ 📸 Photos (3)               │
  │ [Photo Grid]                │
  │                             │
  │ 📦 Ordered Equipment        │
  │ [List of ordered parts]     │
  │                             │
  │ 📊 Status History           │
  │ [Timeline]                  │
  │                             │
  │ ┌─────────────────────────┐ │
  │ │  UPDATE STATUS          │ │
  │ └─────────────────────────┘ │
  │ ┌─────────────────────────┐ │
  │ │  ORDER INVENTORY        │ │
  │ └─────────────────────────┘ │
  └─────────────────────────────┘
  ```

  **Sections**:
  1. **Header**: Back button, job number
  2. **Status Bar**: Priority, status, workshop indicator
  3. **Title**: Job title
  4. **Customer Info**: Name, contact, address with action buttons (call, email, navigate)
  5. **Equipment Info**: Type, model, serial number
  6. **Description**: Job description
  7. **Schedule**: Scheduled date/time, duration
  8. **Workshop Status** (if workshop job): Current status, estimated completion
  9. **Notes**: Editable technician notes
  10. **Photos**: Photo gallery with upload capability
  11. **Ordered Equipment**: List of parts ordered for this job
  12. **Status History**: Timeline of status changes
  13. **Action Buttons**: Update status, order inventory

  **Interactions**:
  - Tap "Update Status" → Open status update modal
  - Tap "Order Inventory" → Open inventory selection modal
  - Tap phone number → Call customer
  - Tap email → Email customer
  - Tap address → Open maps navigation
  - Tap photo → View full screen
  - Tap "Add Photo" → Camera/gallery picker
  - Tap notes → Edit notes

  ---

  #### Schedule/Calendar
  **Route**: `/(tabs)/schedule`

  **Layout**:
  ```
  ┌─────────────────────────────┐
  │ Schedule                    │
  ├─────────────────────────────┤
  │ ┌─────────────────────────┐ │
  │ │   January 2025          │ │
  │ │ Su Mo Tu We Th Fr Sa    │ │
  │ │        1  2  3  4  5    │ │
  │ │  6  7  8  9 10 11 12    │ │
  │ │ 13 14 ●15 16 17 18 19   │ │
  │ │ 20 21 22 23 24 25 26    │ │
  │ │ 27 28 29 30 31          │ │
  │ └─────────────────────────┘ │
  │                             │
  │ Jobs for January 15, 2025   │
  │                             │
  │ ┌─────────────────────────┐ │
  │ │ 9:00 AM - 11:00 AM      │ │
  │ │ Scanner Maintenance     │ │
  │ │ Tech Solutions          │ │
  │ └─────────────────────────┘ │
  │                             │
  │ ┌─────────────────────────┐ │
  │ │ 2:00 PM - 4:00 PM       │ │
  │ │ Printer Repair          │ │
  │ │ Acme Corp               │ │
  │ └─────────────────────────┘ │
  │                             │
  │ Total: 2 jobs, 4 hours      │
  └─────────────────────────────┘
  ```

  **Features**:
  - Calendar widget with marked dates (dots for jobs)
  - Date selection
  - Job list filtered by selected date
  - Time-based job cards
  - Daily summary (total jobs, hours)
  - Pull-to-refresh

  **Interactions**:
  - Tap date → Show jobs for that date
  - Tap job card → Navigate to work order details
  - Swipe calendar → Change month

  ---

  #### Inventory List
  **Route**: `/(tabs)/inventory`

  **Layout**:
  ```
  ┌─────────────────────────────┐
  │ Inventory                   │
  ├─────────────────────────────┤
  │ 🔍 Search inventory...      │
  ├─────────────────────────────┤
  │ ┌─────────────────────────┐ │
  │ │ Toner Cartridge HP 26A  │ │
  │ │ SKU: HP-26A-BLK         │ │
  │ │ Stock: 15 units         │ │
  │ │ Price: $45.99           │ │
  │ │ [●●●●●●●●○○] 80%        │ │
  │ └─────────────────────────┘ │
  │                             │
  │ ┌─────────────────────────┐ │
  │ │ Printer Drum Unit       │ │
  │ │ SKU: HP-DRUM-001        │ │
  │ │ Stock: 3 units ⚠️       │ │
  │ │ Price: $89.99           │ │
  │ │ [●●○○○○○○○○] 30%        │ │
  │ └─────────────────────────┘ │
  └─────────────────────────────┘
  ```

  **Features**:
  - Search bar
  - Inventory item cards
  - Stock level indicators (progress bar)
  - Low stock warnings (⚠️)
  - Price display
  - Pull-to-refresh

  **Future Enhancements**:
  - Barcode scanner
  - Filter by category
  - Request inventory
  - Usage history

  ---

  #### Workshop Queue
  **Route**: `/workshop-queue`

  **Layout**:
  ```
  ┌─────────────────────────────┐
  │ ← Workshop Queue            │
  ├─────────────────────────────┤
  │ Unassigned Jobs (5)         │
  ├─────────────────────────────┤
  │ ┌─────────────────────────┐ │
  │ │ [URGENT] #WO-105        │ │
  │ │ HP Printer - Paper Jam  │ │
  │ │ Acme Corp               │ │
  │ │ ⏱️ Waiting: 3 days      │ │
  │ │ Est. Time: 2 hours      │ │
  │ │ ┌─────────────────────┐ │ │
  │ │ │   CLAIM JOB         │ │ │
  │ │ └─────────────────────┘ │ │
  │ └─────────────────────────┘ │
  │                             │
  │ ┌─────────────────────────┐ │
  │ │ [HIGH] #WO-103          │ │
  │ │ Canon Scanner Issue     │ │
  │ │ Tech Solutions          │ │
  │ │ ⏱️ Waiting: 1 day       │ │
  │ │ Est. Time: 3 hours      │ │
  │ │ ┌─────────────────────┐ │ │
  │ │ │   CLAIM JOB         │ │ │
  │ │ └─────────────────────┘ │ │
  │ └─────────────────────────┘ │
  └─────────────────────────────┘
  ```

  **Features**:
  - List of unassigned workshop jobs
  - Priority badges
  - Days waiting indicator
  - Estimated repair time
  - Claim button
  - Sort by priority (default)
  - Pull-to-refresh

  **Interactions**:
  - Tap "Claim Job" → Assign job to current technician
  - Tap card → View job details (read-only until claimed)

  ---

  #### Profile
  **Route**: `/(tabs)/profile`

  **Layout**:
  ```
  ┌─────────────────────────────┐
  │ Profile                     │
  ├─────────────────────────────┤
  │      [Avatar]               │
  │   John Technician           │
  │   john.tech@fsm.com         │
  │   (555) 987-6543            │
  │                             │
  │ ┌─────────────────────────┐ │
  │ │ Status: Available ✓     │ │
  │ │ [Toggle Switch]         │ │
  │ └─────────────────────────┘ │
  │                             │
  │ Today's Summary             │
  │ ┌─────────────────────────┐ │
  │ │ Jobs: 3 | Hours: 6      │ │
  │ │ Completed: 2            │ │
  │ └─────────────────────────┘ │
  │                             │
  │ Skills & Certifications     │
  │ • Printer Repair            │
  │ • Scanner Maintenance       │
  │ • Network Setup             │
  │                             │
  │ ┌─────────────────────────┐ │
  │ │   SETTINGS              │ │
  │ └─────────────────────────┘ │
  │ ┌─────────────────────────┐ │
  │ │   LOGOUT                │ │
  │ └─────────────────────────┘ │
  └─────────────────────────────┘
  ```

  **Features**:
  - User avatar and info
  - Availability toggle
  - Today's summary (dynamic)
  - Skills and certifications list
  - Settings button (future)
  - Logout button

  ---

  ### 6.3 Customer Screens

  #### Equipment Dashboard
  **Route**: `/(tabs)/customer-dashboard`

  **Layout**:
  ```
  ┌─────────────────────────────┐
  │ My Equipment                │
  ├─────────────────────────────┤
  │ Summary                     │
  │ Total: 3 | In Repair: 1     │
  ├─────────────────────────────┤
  │ ┌─────────────────────────┐ │
  │ │ HP LaserJet Pro 4001    │ │
  │ │ Serial: ABC123          │ │
  │ │ [In Repair] 🏭          │ │
  │ │ Est. Completion: Jan 20 │ │
  │ │ ┌─────────────────────┐ │ │
  │ │ │   TRACK STATUS      │ │ │
  │ │ └─────────────────────┘ │ │
  │ └─────────────────────────┘ │
  │                             │
  │ ┌─────────────────────────┐ │
  │ │ Canon Scanner MX920     │ │
  │ │ Serial: XYZ789          │ │
  │ │ [Completed] ✓           │ │
  │ │ Completed: Jan 10       │ │
  │ └─────────────────────────┘ │
  └─────────────────────────────┘
  ```

  **Features**:
  - Summary statistics
  - Equipment cards with status
  - Workshop indicator
  - Estimated completion date
  - Track status button
  - Pull-to-refresh

  ---

  #### Equipment Tracking
  **Route**: `/equipment-tracking?jobId={jobId}`

  **Layout**:
  ```
  ┌─────────────────────────────┐
  │ ← Equipment Status          │
  ├─────────────────────────────┤
  │ HP LaserJet Pro 4001        │
  │ Serial: ABC123XYZ           │
  │                             │
  │ ━━━ Status Timeline ━━━     │
  │                             │
  │ ✓ Pending Intake            │
  │   Jan 10, 9:00 AM           │
  │                             │
  │ ✓ In Transit                │
  │   Jan 10, 10:30 AM          │
  │                             │
  │ ✓ Received                  │
  │   Jan 11, 2:00 PM           │
  │                             │
  │ ● In Repair (Current)       │
  │   Jan 12, 9:00 AM           │
  │                             │
  │ ○ Repair Completed          │
  │   Est. Jan 20               │
  │                             │
  │ ○ Ready for Pickup          │
  │                             │
  │ ━━━ Intake Information ━━━  │
  │                             │
  │ Reported Issue:             │
  │ Paper jam, not printing     │
  │                             │
  │ Visual Condition:           │
  │ Good, minor wear            │
  │                             │
  │ Accessories:                │
  │ Power cable, manual         │
  │                             │
  │ ━━━ Photos (4) ━━━          │
  │ [Photo Grid]                │
  │                             │
  │ ━━━ Notes ━━━               │
  │ Customer: Please handle...  │
  │ Technician: Diagnosed...    │
  └─────────────────────────────┘
  ```

  **Features**:
  - Equipment details
  - Visual status timeline with progress indicator
  - Intake information
  - Photo gallery
  - Customer and technician notes
  - Estimated completion date
  - Real-time status updates

  ---

  ## 7. UI/UX Design System

  ### 7.1 Color Palette

  #### Brand Colors
  ```typescript
  primary: {
    50: '#fef2f2',
    100: '#fee2e2',
    500: '#ea2a33',  // Main brand color
    600: '#dc2626',
    700: '#b91c1c',
  }
  ```

  #### Neutral Colors
  ```typescript
  gray: {
    50: '#f9fafb',   // Background
    100: '#f3f4f6',  // Card background
    200: '#e5e7eb',  // Border
    300: '#d1d5db',  // Disabled
    400: '#9ca3af',  // Placeholder
    500: '#6b7280',  // Secondary text
    600: '#4b5563',  // Body text
    700: '#374151',  // Heading
    800: '#1f2937',  // Dark heading
    900: '#111827',  // Primary text
  }
  ```

  #### Semantic Colors
  ```typescript
  success: '#10b981',  // Green
  warning: '#f59e0b',  // Amber
  error: '#ef4444',    // Red
  info: '#3b82f6',     // Blue
  workshop: '#8b5cf6', // Purple
  ```

  #### Status Colors
  ```typescript
  scheduled: '#3b82f6',    // Blue
  in_progress: '#f59e0b',  // Amber
  completed: '#10b981',    // Green
  cancelled: '#ef4444',    // Red
  on_hold: '#6b7280',      // Gray
  ```

  #### Priority Colors
  ```typescript
  low: '#6b7280',      // Gray
  medium: '#3b82f6',   // Blue
  high: '#f59e0b',     // Amber
  urgent: '#ef4444',   // Red
  ```

  ### 7.2 Typography

  #### Font Family
  - **Primary**: System default (San Francisco on iOS, Roboto on Android)
  - **Monospace**: SpaceMono (for codes, numbers)

  #### Font Scale
  ```typescript
  fontSize: {
    xs: 12,    // Captions, labels
    sm: 14,    // Secondary text
    base: 16,  // Body text
    lg: 18,    // Section titles
    xl: 20,    // Card titles
    '2xl': 24, // Page titles
    '3xl': 30, // Hero text
  }
  ```

  #### Font Weights
  ```typescript
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  }
  ```

  #### Line Heights
  ```typescript
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  }
  ```

  ### 7.3 Spacing System

  **Base Unit**: 4px

  ```typescript
  spacing: {
    0: 0,
    1: 4,    // 4px
    2: 8,    // 8px
    3: 12,   // 12px
    4: 16,   // 16px
    5: 20,   // 20px
    6: 24,   // 24px
    8: 32,   // 32px
    10: 40,  // 40px
    12: 48,  // 48px
    16: 64,  // 64px
  }
  ```

  ### 7.4 Border Radius

  ```typescript
  borderRadius: {
    none: 0,
    sm: 4,
    base: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  }
  ```

  ### 7.5 Shadows & Elevation

  ```typescript
  shadow: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    base: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 5,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 8,
    },
  }
  ```

  ### 7.6 Component Patterns

  #### Buttons

  **Primary Button**:
  ```typescript
  {
    backgroundColor: '#ea2a33',
    color: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    fontWeight: '600',
  }
  ```

  **Secondary Button**:
  ```typescript
  {
    backgroundColor: '#f3f4f6',
    color: '#374151',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    fontWeight: '600',
  }
  ```

  **Outline Button**:
  ```typescript
  {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ea2a33',
    color: '#ea2a33',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    fontWeight: '600',
  }
  ```

  #### Cards

  **Standard Card**:
  ```typescript
  {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  }
  ```

  #### Badges

  **Status Badge**:
  ```typescript
  {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
  }
  ```

  #### Input Fields

  **Text Input**:
  ```typescript
  {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  }
  ```

  ### 7.7 Dark Mode Support

  **Planned Implementation**:
  - Automatic detection of system theme
  - Manual toggle in settings
  - Dark color palette:
    - Background: `#111827`
    - Card: `#1f2937`
    - Text: `#f9fafb`
    - Border: `#374151`

  ### 7.8 Accessibility

  #### Contrast Ratios
  - Normal text: 4.5:1 minimum
  - Large text: 3:1 minimum
  - UI components: 3:1 minimum

  #### Touch Targets
  - Minimum size: 44x44 points (iOS), 48x48 dp (Android)
  - Spacing between targets: 8px minimum

  #### Screen Reader Support
  - Meaningful labels for all interactive elements
  - Proper heading hierarchy
  - Descriptive button text

  ---

  ## 8. Technical Architecture

  ### 8.1 Project Structure

  ```
  FSMProMobile/
  ├── app/                      # Expo Router screens
  │   ├── (tabs)/              # Tab navigation screens
  │   │   ├── index.tsx        # Work Orders (Technician)
  │   │   ├── schedule.tsx     # Schedule (Technician)
  │   │   ├── inventory.tsx    # Inventory (Technician)
  │   │   ├── profile.tsx      # Profile (Both)
  │   │   └── customer-dashboard.tsx # Equipment (Customer)
  │   ├── _layout.tsx          # Root layout
  │   ├── login.tsx            # Login screen
  │   ├── work-order-details.tsx # Work order details modal
  │   ├── workshop-queue.tsx   # Workshop queue modal
  │   └── equipment-tracking.tsx # Equipment tracking modal
  ├── src/
  │   ├── components/          # Reusable components
  │   │   └── ui/             # UI components
  │   ├── context/            # React Context providers
  │   │   └── AuthContext.tsx # Authentication context
  │   ├── services/           # API and business logic
  │   │   └── api.ts          # API service
  │   ├── types/              # TypeScript types
  │   │   └── index.ts        # Type definitions
  │   ├── hooks/              # Custom React hooks
  │   └── utils/              # Utility functions
  ├── assets/                 # Images, fonts, etc.
  ├── constants/              # App constants
  │   ├── Colors.ts           # Color definitions
  │   └── Theme.ts            # Theme configuration
  └── package.json
  ```

  ### 8.2 State Management

  #### Current Implementation
  - **Context API**: Authentication state (`AuthContext`)
  - **Local State**: Component-level state with `useState`
  - **AsyncStorage**: Persistent storage for tokens and user data

  #### Planned Enhancements
  - **React Query**: Server state management, caching, and synchronization
  - **Zustand** (optional): Global client state management

  ### 8.3 Navigation

  **Expo Router** (File-based routing):
  - Automatic route generation from file structure
  - Type-safe navigation
  - Deep linking support
  - Tab navigation for main screens
  - Modal presentation for details

  ### 8.4 Data Flow

  ```
  User Action
      ↓
  Component Event Handler
      ↓
  API Service Call
      ↓
  Backend API
      ↓
  Response Processing
      ↓
  State Update (Context/Local)
      ↓
  UI Re-render
  ```

  ### 8.5 Error Handling

  **Levels**:
  1. **Network Errors**: Retry logic, offline detection
  2. **API Errors**: User-friendly error messages
  3. **Validation Errors**: Form-level validation feedback
  4. **Unexpected Errors**: Error boundary with fallback UI

  **Implementation**:
  ```typescript
  try {
    const response = await apiService.getJobs();
    if (response.success) {
      setJobs(response.data);
    } else {
      showToast(response.error || 'Failed to load jobs');
    }
  } catch (error) {
    if (error.code === 'NETWORK_ERROR') {
      showToast('No internet connection');
    } else {
      showToast('An unexpected error occurred');
    }
  }
  ```

  ### 8.6 Performance Optimization

  #### Current Optimizations
  - Image optimization with `expo-image`
  - List virtualization with `FlatList`
  - Memoization with `useMemo` and `useCallback`

  #### Planned Optimizations
  - **FlashList**: Replace `FlatList` for better performance
  - **Code Splitting**: Lazy load screens and heavy components
  - **Image Caching**: Implement aggressive image caching
  - **Bundle Size**: Analyze and reduce bundle size

  ---

  ## 9. Performance & Optimization

  ### 9.1 Performance Targets

  | Metric | Target | Current |
  |--------|--------|---------|
  | App Launch Time | < 2s | ~2.5s |
  | Screen Transition | < 300ms | ~400ms |
  | API Response Time | < 1s | ~800ms |
  | List Scroll FPS | 60 FPS | ~55 FPS |
  | Bundle Size (iOS) | < 50MB | ~45MB |
  | Bundle Size (Android) | < 30MB | ~28MB |

  ### 9.2 Optimization Strategies

  #### Image Optimization
  - Use `expo-image` for all images
  - Implement lazy loading for image galleries
  - Compress images before upload
  - Use appropriate image formats (WebP where supported)
  - Implement placeholder images

  #### List Performance
  - Migrate to `@shopify/flash-list`
  - Implement pagination (20 items per page)
  - Use `getItemLayout` for fixed-height items
  - Implement `keyExtractor` properly
  - Avoid inline functions in `renderItem`

  #### Network Optimization
  - Implement request debouncing for search
  - Use HTTP caching headers
  - Implement request cancellation
  - Batch API requests where possible
  - Compress API responses (gzip)

  #### Code Optimization
  - Use React.memo for expensive components
  - Implement useMemo for expensive calculations
  - Use useCallback for event handlers
  - Avoid unnecessary re-renders
  - Code splitting with dynamic imports

  ### 9.3 Caching Strategy

  **Planned Implementation with React Query**:

  ```typescript
  // Cache configuration
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,      // 5 minutes
        cacheTime: 10 * 60 * 1000,     // 10 minutes
        retry: 2,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
    },
  });

  // Usage example
  const { data, isLoading, error } = useQuery(
    ['jobs', filters],
    () => apiService.getJobs(filters),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes for jobs
    }
  );
  ```

  **Cache Invalidation**:
  - Automatic invalidation on mutations
  - Manual invalidation on pull-to-refresh
  - Time-based invalidation (stale time)

  ---

  ## 10. Security & Authentication

  ### 10.1 Authentication Flow

  ```
  1. User enters credentials
  2. App sends POST /api/auth/login
  3. Backend validates credentials
  4. Backend returns JWT token + user data
  5. App stores token in AsyncStorage
  6. App stores user data in AuthContext
  7. All subsequent requests include token in Authorization header
  ```

  ### 10.2 Token Management

  **Storage**:
  - JWT token stored in AsyncStorage
  - User data stored in AsyncStorage
  - Automatic token injection via Axios interceptor

  **Refresh**:
  - Token expiry: 7 days (configurable)
  - Auto-refresh on app launch
  - Logout on token expiration

  **Security**:
  - Tokens never logged or exposed
  - Secure storage on device
  - HTTPS-only communication

  ### 10.3 Role-Based Access Control

  **Roles**:
  - `technician`: Access to work orders, schedule, inventory, workshop
  - `customer`: Access to equipment tracking only

  **Implementation**:
  ```typescript
  // In AuthContext
  if (user.role !== 'technician' && user.role !== 'customer') {
    return { success: false, error: 'Unauthorized role' };
  }

  // In navigation
  {user.role === 'technician' ? (
    <TechnicianTabs />
  ) : (
    <CustomerTabs />
  )}
  ```

  ### 10.4 Data Security

  **Best Practices**:
  - No sensitive data in logs
  - Sanitize user inputs
  - Validate all API responses
  - Implement rate limiting awareness
  - Handle errors gracefully without exposing internals

  ### 10.5 Biometric Authentication (Planned)

  **Implementation**:
  ```typescript
  import * as LocalAuthentication from 'expo-local-authentication';

  // Check if biometric is available
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();

  // Authenticate
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Authenticate to access FSM Pro',
    fallbackLabel: 'Use passcode',
  });

  if (result.success) {
    // Auto-login with stored credentials
  }
  ```

  ---

  ## 11. Offline Capabilities

  ### 11.1 Offline Strategy

  **Goals**:
  - Allow technicians to work without internet
  - Queue actions for later sync
  - Display cached data
  - Indicate offline status clearly

  ### 11.2 Offline Features

  #### Read Operations (Cached Data)
  - ✅ View work orders (last fetched)
  - ✅ View job details
  - ✅ View schedule
  - ✅ View inventory
  - 🔄 View customer information

  #### Write Operations (Queued)
  - 🔄 Update job status
  - 🔄 Add notes
  - 🔄 Upload photos (stored locally, uploaded when online)
  - 🔄 Order inventory

  ### 11.3 Implementation Plan

  **Offline Detection**:
  ```typescript
  import NetInfo from '@react-native-community/netinfo';

  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);
    });
    return () => unsubscribe();
  }, []);
  ```

  **Offline Indicator**:
  ```typescript
  {!isOnline && (
    <View style={styles.offlineBanner}>
      <Text>You are offline. Changes will sync when online.</Text>
    </View>
  )}
  ```

  **Queue Management**:
  ```typescript
  // Store pending actions
  const queueAction = async (action) => {
    const queue = await AsyncStorage.getItem('action_queue');
    const actions = queue ? JSON.parse(queue) : [];
    actions.push(action);
    await AsyncStorage.setItem('action_queue', JSON.stringify(actions));
  };

  // Process queue when online
  const processQueue = async () => {
    const queue = await AsyncStorage.getItem('action_queue');
    if (!queue) return;

    const actions = JSON.parse(queue);
    for (const action of actions) {
      try {
        await executeAction(action);
      } catch (error) {
        console.error('Failed to sync action:', error);
      }
    }
    await AsyncStorage.removeItem('action_queue');
  };
  ```

  ### 11.4 Data Persistence

  **AsyncStorage Keys**:
  - `fsm_token`: JWT authentication token
  - `fsm_user`: User profile data
  - `fsm_jobs_cache`: Cached work orders
  - `fsm_inventory_cache`: Cached inventory items
  - `fsm_action_queue`: Pending actions
  - `fsm_photos_pending`: Photos pending upload

  ---

  ## 12. Push Notifications

  ### 12.1 Notification Types

  #### For Technicians
  - **Job Assigned**: New work order assigned
  - **Job Updated**: Customer updated job details
  - **Schedule Change**: Job rescheduled
  - **Workshop Alert**: New job in workshop queue
  - **Inventory Alert**: Low stock warning
  - **Message**: Customer or admin message

  #### For Customers
  - **Status Update**: Equipment status changed
  - **Ready for Pickup**: Equipment ready
  - **Delivery Scheduled**: Delivery date set
  - **Job Completed**: Service completed
  - **Message**: Technician or admin message

  ### 12.2 Implementation

  **Setup** (using Expo Notifications):
  ```typescript
  import * as Notifications from 'expo-notifications';
  import * as Device from 'expo-device';

  // Request permissions
  const { status } = await Notifications.requestPermissionsAsync();

  // Get push token
  const token = (await Notifications.getExpoPushTokenAsync()).data;

  // Send token to backend
  await apiService.registerPushToken(token);

  // Handle notifications
  Notifications.addNotificationReceivedListener(notification => {
    // Handle foreground notification
  });

  Notifications.addNotificationResponseReceivedListener(response => {
    // Handle notification tap
    const { jobId } = response.notification.request.content.data;
    router.push(`/work-order-details?id=${jobId}`);
  });
  ```

  ### 12.3 Notification Preferences

  **Settings** (planned):
  - Enable/disable notifications
  - Notification sound
  - Vibration
  - Notification types (job updates, messages, etc.)
  - Quiet hours

  ---

  ## 13. Development Roadmap

  ### Phase 1: Foundation & Polish (Weeks 1-4) ✅ COMPLETE

  **Goals**: Establish core functionality and basic UX

  - [x] Authentication system
  - [x] Work order list and details
  - [x] Schedule/calendar view
  - [x] Inventory list
  - [x] Workshop queue
  - [x] Equipment tracking (customer)
  - [x] Basic API integration
  - [x] Role-based navigation

  ### Phase 2: UX Enhancement (Weeks 5-8) 🔄 IN PROGRESS

  **Goals**: Modernize UI/UX and improve user experience

  - [ ] Implement design system (NativeWind/Tailwind)
  - [ ] Add skeleton loaders
  - [ ] Enhance empty states
  - [ ] Implement dark mode
  - [ ] Add animations and transitions
  - [ ] Replace modals with bottom sheets
  - [ ] Improve search and filtering
  - [ ] Add haptic feedback throughout
  - [ ] Optimize images and performance

  **Deliverables**:
  - Modern, polished UI
  - Smooth animations
  - Dark mode support
  - Better loading states

  ### Phase 3: Advanced Features (Weeks 9-12) 📋 PLANNED

  **Goals**: Add advanced functionality and offline support

  - [ ] Implement React Query for state management
  - [ ] Add offline support
  - [ ] Implement push notifications
  - [ ] Add biometric authentication
  - [ ] Implement photo capture and upload
  - [ ] Add signature capture
  - [ ] Implement time tracking
  - [ ] Add expense logging
  - [ ] Implement barcode scanning (inventory)
  - [ ] Add voice notes

  **Deliverables**:
  - Offline-first functionality
  - Push notifications
  - Advanced technician tools
  - Better data synchronization

  ### Phase 4: Optimization & Testing (Weeks 13-16) 📋 PLANNED

  **Goals**: Optimize performance and ensure quality

  - [ ] Performance optimization (FlashList, code splitting)
  - [ ] Comprehensive testing (unit, integration, E2E)
  - [ ] Accessibility audit and improvements
  - [ ] Error tracking (Sentry)
  - [ ] Analytics integration (Firebase/Mixpanel)
  - [ ] User onboarding flow
  - [ ] In-app help and documentation
  - [ ] Beta testing with real users

  **Deliverables**:
  - Production-ready app
  - Comprehensive test coverage
  - Analytics and monitoring
  - User documentation

  ### Phase 5: Launch & Iteration (Week 17+) 📋 PLANNED

  **Goals**: Launch to app stores and iterate based on feedback

  - [ ] App Store submission (iOS)
  - [ ] Google Play submission (Android)
  - [ ] Marketing materials (screenshots, descriptions)
  - [ ] User feedback collection
  - [ ] Bug fixes and improvements
  - [ ] Feature requests prioritization
  - [ ] Continuous deployment setup

  **Deliverables**:
  - Published apps on both stores
  - User feedback loop
  - Continuous improvement process

  ---

  ## 14. Testing Strategy

  ### 14.1 Testing Levels

  #### Unit Testing
  **Tool**: Jest + React Native Testing Library

  **Coverage**:
  - Utility functions
  - Custom hooks
  - API service methods
  - Business logic

  **Example**:
  ```typescript
  describe('apiService', () => {
    it('should login successfully', async () => {
      const credentials = { email: 'test@test.com', password: 'password' };
      const response = await apiService.login(credentials);
      expect(response.success).toBe(true);
      expect(response.data.token).toBeDefined();
    });
  });
  ```

  #### Integration Testing
  **Tool**: React Native Testing Library

  **Coverage**:
  - Component interactions
  - Navigation flows
  - Context providers
  - API integration

  **Example**:
  ```typescript
  describe('Work Orders Screen', () => {
    it('should display work orders', async () => {
      const { getByText } = render(<WorkOrdersScreen />);
      await waitFor(() => {
        expect(getByText('WO-001')).toBeTruthy();
      });
    });
  });
  ```

  #### End-to-End Testing
  **Tool**: Detox or Maestro

  **Coverage**:
  - Complete user flows
  - Cross-screen navigation
  - Real API interactions
  - Platform-specific behaviors

  **Example**:
  ```typescript
  describe('Technician Flow', () => {
    it('should complete a work order', async () => {
      await element(by.id('login-email')).typeText('tech@test.com');
      await element(by.id('login-password')).typeText('password');
      await element(by.id('login-button')).tap();
      await element(by.id('work-order-WO-001')).tap();
      await element(by.id('update-status-button')).tap();
      await element(by.text('Completed')).tap();
      await expect(element(by.text('Status updated'))).toBeVisible();
    });
  });
  ```

  ### 14.2 Testing Checklist

  **Before Each Release**:
  - [ ] All unit tests passing
  - [ ] All integration tests passing
  - [ ] E2E tests for critical flows passing
  - [ ] Manual testing on iOS device
  - [ ] Manual testing on Android device
  - [ ] Accessibility testing
  - [ ] Performance testing
  - [ ] Security audit

  ---

  ## 15. Deployment & Distribution

  ### 15.1 Build Configuration

  **Development**:
  ```bash
  # Start development server
  npm start

  # Run on iOS simulator
  npm run ios

  # Run on Android emulator
  npm run android
  ```

  **Production**:
  ```bash
  # Build for iOS (using EAS)
  eas build --platform ios --profile production

  # Build for Android (using EAS)
  eas build --platform android --profile production
  ```

  ### 15.2 App Store Submission

  #### iOS (App Store)
  **Requirements**:
  - Apple Developer Account ($99/year)
  - App icons (all sizes)
  - Screenshots (all device sizes)
  - Privacy policy
  - App description
  - Keywords
  - Support URL

  **Process**:
  1. Create app in App Store Connect
  2. Upload build via EAS
  3. Fill in app information
  4. Submit for review
  5. Wait for approval (1-3 days)

  #### Android (Google Play)
  **Requirements**:
  - Google Play Developer Account ($25 one-time)
  - App icons
  - Screenshots
  - Feature graphic
  - Privacy policy
  - App description
  - Content rating

  **Process**:
  1. Create app in Google Play Console
  2. Upload APK/AAB via EAS
  3. Fill in store listing
  4. Complete content rating questionnaire
  5. Submit for review
  6. Wait for approval (1-3 days)

  ### 15.3 Continuous Deployment

  **EAS Update** (Over-the-Air Updates):
  ```bash
  # Publish update
  eas update --branch production --message "Bug fixes"
  ```

  **Benefits**:
  - Instant updates without app store review
  - Rollback capability
  - Staged rollouts
  - A/B testing support

  ---

  ## 16. Analytics & Monitoring

  ### 16.1 Analytics Events

  **User Events**:
  - `login_success`
  - `login_failure`
  - `logout`
  - `screen_view`
  - `job_viewed`
  - `job_status_updated`
  - `photo_uploaded`
  - `inventory_ordered`
  - `workshop_job_claimed`

  **Performance Events**:
  - `api_request_duration`
  - `screen_load_time`
  - `app_crash`
  - `network_error`

  ### 16.2 Error Tracking

  **Sentry Integration** (planned):
  ```typescript
  import * as Sentry from '@sentry/react-native';

  Sentry.init({
    dsn: 'YOUR_SENTRY_DSN',
    environment: __DEV__ ? 'development' : 'production',
    tracesSampleRate: 1.0,
  });

  // Capture errors
  try {
    // Code
  } catch (error) {
    Sentry.captureException(error);
  }
  ```

  ### 16.3 User Analytics

  **Firebase Analytics** (planned):
  ```typescript
  import analytics from '@react-native-firebase/analytics';

  // Track screen view
  await analytics().logScreenView({
    screen_name: 'WorkOrders',
    screen_class: 'WorkOrdersScreen',
  });

  // Track event
  await analytics().logEvent('job_completed', {
    job_id: 'WO-001',
    duration: 120,
  });
  ```

  ---

  ## 17. Accessibility

  ### 17.1 Accessibility Features

  **Current**:
  - Semantic HTML/components
  - Sufficient color contrast
  - Touch target sizes (44x44 minimum)

  **Planned**:
  - Screen reader support (VoiceOver, TalkBack)
  - Dynamic type support
  - Reduced motion support
  - Keyboard navigation (web)
  - Focus management
  - ARIA labels

  ### 17.2 Implementation

  **Screen Reader Labels**:
  ```typescript
  <TouchableOpacity
    accessible={true}
    accessibilityLabel="Update job status"
    accessibilityHint="Opens status selection modal"
    accessibilityRole="button"
  >
    <Text>Update Status</Text>
  </TouchableOpacity>
  ```

  **Dynamic Type**:
  ```typescript
  import { useAccessibilityInfo } from 'react-native';

  const { isScreenReaderEnabled } = useAccessibilityInfo();
  const fontSize = isScreenReaderEnabled ? 18 : 16;
  ```

  **Reduced Motion**:
  ```typescript
  import { AccessibilityInfo } from 'react-native';

  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  // Disable animations if reduce motion is enabled
  const animationDuration = reduceMotion ? 0 : 300;
  ```

  ---

  ## 18. Internationalization (i18n)

  ### 18.1 Supported Languages (Planned)

  **Phase 1**:
  - English (US) - Default

  **Phase 2**:
  - Spanish (ES)
  - French (FR)
  - German (DE)

  ### 18.2 Implementation

  **Library**: `react-i18next`

  ```typescript
  import i18n from 'i18next';
  import { initReactI18next } from 'react-i18next';

  i18n.use(initReactI18next).init({
    resources: {
      en: {
        translation: {
          'work_orders': 'Work Orders',
          'schedule': 'Schedule',
          'inventory': 'Inventory',
        }
      },
      es: {
        translation: {
          'work_orders': 'Órdenes de Trabajo',
          'schedule': 'Horario',
          'inventory': 'Inventario',
        }
      }
    },
    lng: 'en',
    fallbackLng: 'en',
  });

  // Usage
  import { useTranslation } from 'react-i18next';

  const { t } = useTranslation();
  <Text>{t('work_orders')}</Text>
  ```

  ---

  ## 19. API Documentation Reference

  ### 19.1 Base Configuration

  **Base URL**: `https://fsmpro.phishsimulator.com/api`
  **Authentication**: Bearer Token (JWT)
  **Content-Type**: `application/json`

  ### 19.2 Request Headers

  ```typescript
  {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer {token}'
  }
  ```

  ### 19.3 Response Format

  All API responses follow this structure:

  **Success**:
  ```json
  {
    "success": true,
    "data": { ... },
    "message": "Optional success message"
  }
  ```

  **Error**:
  ```json
  {
    "success": false,
    "error": "Error message",
    "message": "Optional additional context"
  }
  ```

  ### 19.4 Pagination

  **Request**:
  ```
  GET /api/jobs?page=1&limit=20
  ```

  **Response**:
  ```json
  {
    "success": true,
    "data": {
      "jobs": [...],
      "total": 100,
      "page": 1,
      "totalPages": 5
    }
  }
  ```

  ### 19.5 Filtering & Sorting

  **Jobs Filtering**:
  ```
  GET /api/jobs?status=in_progress&priority=high&technician_id={id}
  ```

  **Sorting**:
  ```
  GET /api/jobs?sort_by=scheduled_date&order=asc
  ```

  ---

  ## 20. Appendices

  ### Appendix A: Technology Stack Summary

  | Category | Technology | Purpose |
  |----------|-----------|---------|
  | **Framework** | React Native 0.79.6 | Mobile app framework |
  | **Platform** | Expo ~53.0.22 | Development platform |
  | **Language** | TypeScript ~5.8.3 | Type-safe JavaScript |
  | **Navigation** | Expo Router ~5.1.5 | File-based routing |
  | **HTTP Client** | Axios | API requests |
  | **Storage** | AsyncStorage | Local data persistence |
  | **Forms** | React Hook Form | Form management |
  | **Validation** | Yup | Schema validation |
  | **Icons** | @expo/vector-icons | Icon library |
  | **Calendar** | react-native-calendars | Calendar widget |
  | **Images** | expo-image | Optimized images |
  | **Camera** | expo-image-picker | Photo capture |
  | **Notifications** | expo-notifications | Push notifications |
  | **Haptics** | expo-haptics | Haptic feedback |

  ### Appendix B: Design Resources

  **Design Tools**:
  - Figma (UI/UX design)
  - Adobe XD (alternative)
  - Sketch (alternative)

  **Icon Resources**:
  - Ionicons (included with Expo)
  - Material Icons
  - Font Awesome

  **Illustration Resources**:
  - unDraw
  - Storyset
  - Illustrations.co

  ### Appendix C: Learning Resources

  **React Native**:
  - [React Native Docs](https://reactnative.dev/)
  - [Expo Docs](https://docs.expo.dev/)

  **TypeScript**:
  - [TypeScript Handbook](https://www.typescriptlang.org/docs/)

  **Best Practices**:
  - [React Native Best Practices](https://github.com/react-native-community/discussions-and-proposals)
  - [Mobile Design Patterns](https://mobbin.com/)

  ### Appendix D: Glossary

  - **FSM**: Field Service Management
  - **JWT**: JSON Web Token
  - **API**: Application Programming Interface
  - **UX**: User Experience
  - **UI**: User Interface
  - **MVP**: Minimum Viable Product
  - **OTA**: Over-The-Air (updates)
  - **E2E**: End-to-End (testing)
  - **PWA**: Progressive Web App
  - **WCAG**: Web Content Accessibility Guidelines

  ---

  ## Document Control

  **Version**: 2.0
  **Last Updated**: January 2025
  **Author**: FSM Pro Development Team
  **Status**: Living Document
  **Next Review**: February 2025

  **Change Log**:
  - v2.0 (Jan 2025): Complete specification rewrite with comprehensive details
  - v1.0 (Dec 2024): Initial MVP specification

  ---

  **End of Document**

  ## 5. API Integration

  ### 5.1 API Service Architecture

  **File**: `src/services/api.ts`

  **Features**:
  - Centralized API client using Axios
  - Automatic JWT token injection
  - Request/response interceptors
  - Error handling and retry logic
  - Response type safety with TypeScript

  ### 5.2 Core API Endpoints

  #### Authentication
  ```typescript
  POST /api/auth/login
  POST /api/auth/logout
  GET  /api/auth/profile
  POST /api/auth/reset-password
  POST /api/auth/reset-password/confirm
  ```

  #### Jobs/Work Orders
  ```typescript
  GET    /api/jobs                    // List jobs with filters
  GET    /api/jobs/:id                // Get single job
  POST   /api/jobs                    // Create job (admin)
  PUT    /api/jobs/:id                // Update job
  PATCH  /api/jobs/:id/status         // Update job status
  GET    /api/jobs/options            // Get form options
  ```

  #### Workshop
  ```typescript
  GET    /api/workshop/jobs           // List workshop jobs
  GET    /api/workshop/queue          // Get repair queue
  POST   /api/workshop/jobs/:id/claim // Claim job from queue
  POST   /api/workshop/jobs/:id/ready-for-pickup
  POST   /api/workshop/jobs/:id/schedule-delivery
  POST   /api/workshop/jobs/:id/mark-returned
  GET    /api/workshop/metrics        // Workshop metrics
  ```

  #### Equipment Intake
  ```typescript
  POST   /api/workshop/intake         // Create intake record
  GET    /api/workshop/intake/:jobId  // Get intake by job
  PUT    /api/workshop/intake/:id     // Update intake
  POST   /api/workshop/intake/:id/photos // Upload photos
  ```

  #### Equipment Status
  ```typescript
  GET    /api/workshop/status/:jobId  // Get equipment status
  PATCH  /api/workshop/status/:jobId  // Update status
  GET    /api/workshop/status/:jobId/history // Status history
  ```

  #### Inventory
  ```typescript
  GET    /api/inventory               // List inventory items
  GET    /api/inventory/:id           // Get single item
  POST   /api/inventory/order         // Order inventory for job
  GET    /api/inventory/work-orders/:id/orders // Get ordered items
  GET    /api/inventory/alerts        // Low stock alerts
  ```

  #### Customers
  ```typescript
  GET    /api/customers               // List customers
  GET    /api/customers/:id           // Get customer details
  ```

  #### Technicians
  ```typescript
  GET    /api/technicians             // List technicians
  GET    /api/technicians/:id         // Get technician details
  PATCH  /api/technicians/:id/availability // Toggle availability
  ```

  #### File Upload
  ```typescript
  POST   /api/upload/equipment-image  // Upload equipment photo
  DELETE /api/upload/equipment-image/:filename
  GET    /api/upload/equipment-image/:filename
  ```

  #### Invoices
  ```typescript
  GET    /api/invoices/ready          // Jobs ready for invoicing
  GET    /api/invoices/job/:id        // Get job invoice
  POST   /api/invoices/job/:id/calculate // Calculate job total
  ```

  ### 5.3 API Response Format

  **Success Response**:
  ```typescript
  {
    success: true,
    data: { ... },
    message?: string
  }
  ```

  **Error Response**:
  ```typescript
  {
    success: false,
    error: string,
    message?: string
  }
  ```

  ### 5.4 Data Models

  See `src/types/index.ts` for complete TypeScript interfaces:
  - `User`, `AuthResponse`
  - `Technician`, `Customer`
  - `Job`, `JobStatus`, `JobPriority`
  - `EquipmentIntake`, `EquipmentStatus`
  - `InventoryItem`, `InventoryOrder`
  - `WorkshopSettings`, `WorkshopMetrics`

  ---


