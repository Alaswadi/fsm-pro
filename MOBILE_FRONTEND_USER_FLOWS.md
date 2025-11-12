# FSM Pro Mobile - User Flows & Wireframes

**Version**: 1.0  
**Date**: January 2025  
**Purpose**: Visual guide for user journeys and screen interactions

---

## Table of Contents

1. [Technician User Flows](#technician-user-flows)
2. [Customer User Flows](#customer-user-flows)
3. [Common Flows](#common-flows)
4. [Screen Wireframes](#screen-wireframes)
5. [Interaction Patterns](#interaction-patterns)

---

## 1. Technician User Flows

### Flow 1: Daily Work Order Management

```
┌─────────────────────────────────────────────────────────────┐
│                    DAILY WORK FLOW                          │
└─────────────────────────────────────────────────────────────┘

START
  │
  ├─> Login Screen
  │     │
  │     ├─> Enter credentials
  │     │
  │     └─> Tap "Login"
  │           │
  │           ├─> [Success] → Work Orders List
  │           │                 │
  │           │                 ├─> View today's jobs
  │           │                 │
  │           │                 ├─> Filter by "Scheduled"
  │           │                 │
  │           │                 └─> Tap first job
  │           │                       │
  │           │                       └─> Work Order Details
  │           │                             │
  │           │                             ├─> Review job info
  │           │                             │
  │           │                             ├─> Tap "Navigate"
  │           │                             │     │
  │           │                             │     └─> Opens Maps
  │           │                             │
  │           │                             ├─> Arrive at site
  │           │                             │
  │           │                             ├─> Tap "Update Status"
  │           │                             │     │
  │           │                             │     └─> Select "In Progress"
  │           │                             │
  │           │                             ├─> Perform service
  │           │                             │
  │           │                             ├─> Tap "Add Photo"
  │           │                             │     │
  │           │                             │     └─> Capture equipment photo
  │           │                             │
  │           │                             ├─> Need parts?
  │           │                             │     │
  │           │                             │     ├─> [Yes] → Tap "Order Inventory"
  │           │                             │     │              │
  │           │                             │     │              ├─> Select parts
  │           │                             │     │              │
  │           │                             │     │              └─> Confirm order
  │           │                             │     │
  │           │                             │     └─> [No] → Continue
  │           │                             │
  │           │                             ├─> Add notes
  │           │                             │
  │           │                             ├─> Tap "Update Status"
  │           │                             │     │
  │           │                             │     └─> Select "Completed"
  │           │                             │
  │           │                             └─> Return to Work Orders List
  │           │                                   │
  │           │                                   └─> Move to next job
  │           │
  │           └─> [Failure] → Show error message
  │
END
```

---

### Flow 2: Workshop Job Processing

```
┌─────────────────────────────────────────────────────────────┐
│                  WORKSHOP JOB FLOW                          │
└─────────────────────────────────────────────────────────────┘

START (Logged in as Technician)
  │
  ├─> Work Orders Tab
  │     │
  │     └─> Tap "Workshop Queue" button
  │           │
  │           └─> Workshop Queue Screen
  │                 │
  │                 ├─> View unassigned jobs
  │                 │
  │                 ├─> Sort by priority
  │                 │
  │                 ├─> Select high-priority job
  │                 │
  │                 └─> Tap "Claim Job"
  │                       │
  │                       ├─> Job assigned to technician
  │                       │
  │                       └─> Navigate to Work Order Details
  │                             │
  │                             ├─> Review intake information
  │                             │     │
  │                             │     ├─> Reported issue
  │                             │     ├─> Visual condition
  │                             │     ├─> Intake photos
  │                             │     └─> Customer notes
  │                             │
  │                             ├─> Start repair
  │                             │
  │                             ├─> Update status to "In Repair"
  │                             │
  │                             ├─> Order parts if needed
  │                             │
  │                             ├─> Perform repair
  │                             │
  │                             ├─> Update status to "Repair Completed"
  │                             │
  │                             ├─> Add completion notes
  │                             │
  │                             ├─> Upload final photos
  │                             │
  │                             └─> Update status to "Ready for Pickup"
  │                                   │
  │                                   ├─> System sends notification to customer
  │                                   │
  │                                   └─> Job moved to pickup queue
  │
END
```

---

### Flow 3: Inventory Ordering

```
┌─────────────────────────────────────────────────────────────┐
│                  INVENTORY ORDER FLOW                       │
└─────────────────────────────────────────────────────────────┘

START (In Work Order Details)
  │
  ├─> Tap "Order Inventory" button
  │     │
  │     └─> Inventory Selection Modal
  │           │
  │           ├─> Search for part
  │           │     │
  │           │     └─> Type "toner"
  │           │
  │           ├─> View search results
  │           │
  │           ├─> Select "HP 26A Toner"
  │           │
  │           ├─> Enter quantity
  │           │
  │           ├─> Review:
  │           │     ├─> Part name
  │           │     ├─> Quantity
  │           │     ├─> Unit price
  │           │     └─> Total price
  │           │
  │           ├─> Tap "Confirm Order"
  │           │     │
  │           │     ├─> API call to order inventory
  │           │     │
  │           │     └─> [Success]
  │           │           │
  │           │           ├─> Show success toast
  │           │           │
  │           │           ├─> Close modal
  │           │           │
  │           │           └─> Update "Ordered Equipment" section
  │           │                 │
  │           │                 └─> Display ordered part
  │           │
  │           └─> [Cancel] → Close modal
  │
END
```

---

## 2. Customer User Flows

### Flow 1: Equipment Status Tracking

```
┌─────────────────────────────────────────────────────────────┐
│              CUSTOMER TRACKING FLOW                         │
└─────────────────────────────────────────────────────────────┘

START
  │
  ├─> Login Screen
  │     │
  │     ├─> Enter credentials
  │     │
  │     └─> Tap "Login"
  │           │
  │           └─> [Success] → Customer Dashboard
  │                 │
  │                 ├─> View equipment summary
  │                 │     │
  │                 │     ├─> Total equipment: 3
  │                 │     ├─> In repair: 1
  │                 │     └─> Completed: 2
  │                 │
  │                 ├─> View equipment list
  │                 │
  │                 ├─> Select "HP LaserJet Pro 4001"
  │                 │
  │                 └─> Tap "Track Status"
  │                       │
  │                       └─> Equipment Tracking Screen
  │                             │
  │                             ├─> View status timeline
  │                             │     │
  │                             │     ├─> ✓ Pending Intake
  │                             │     ├─> ✓ In Transit
  │                             │     ├─> ✓ Received
  │                             │     ├─> ● In Repair (Current)
  │                             │     ├─> ○ Repair Completed
  │                             │     ├─> ○ Ready for Pickup
  │                             │     └─> ○ Returned
  │                             │
  │                             ├─> View intake information
  │                             │     │
  │                             │     ├─> Reported issue
  │                             │     ├─> Visual condition
  │                             │     └─> Accessories included
  │                             │
  │                             ├─> View intake photos (4)
  │                             │     │
  │                             │     └─> Tap photo → Full screen view
  │                             │
  │                             ├─> View estimated completion
  │                             │     │
  │                             │     └─> "January 20, 2025"
  │                             │
  │                             └─> View notes
  │                                   │
  │                                   ├─> Customer notes
  │                                   └─> Technician notes
  │
END
```

---

### Flow 2: Receiving Notifications

```
┌─────────────────────────────────────────────────────────────┐
│              NOTIFICATION FLOW                              │
└─────────────────────────────────────────────────────────────┘

TRIGGER: Equipment status changes to "Ready for Pickup"
  │
  ├─> Backend sends push notification
  │     │
  │     └─> Customer's device receives notification
  │           │
  │           ├─> [App in Background]
  │           │     │
  │           │     ├─> Notification appears in notification center
  │           │     │
  │           │     └─> Customer taps notification
  │           │           │
  │           │           ├─> App opens
  │           │           │
  │           │           └─> Navigate to Equipment Tracking screen
  │           │                 │
  │           │                 └─> Show updated status
  │           │
  │           └─> [App in Foreground]
  │                 │
  │                 ├─> In-app notification banner
  │                 │
  │                 └─> Customer taps banner
  │                       │
  │                       └─> Navigate to Equipment Tracking screen
  │
END
```

---

## 3. Common Flows

### Flow 1: Authentication

```
┌─────────────────────────────────────────────────────────────┐
│                  AUTHENTICATION FLOW                        │
└─────────────────────────────────────────────────────────────┘

START
  │
  ├─> App Launch
  │     │
  │     ├─> Check for stored token
  │     │     │
  │     │     ├─> [Token exists]
  │     │     │     │
  │     │     │     ├─> Validate token with API
  │     │     │     │     │
  │     │     │     │     ├─> [Valid] → Navigate to main app
  │     │     │     │     │
  │     │     │     │     └─> [Invalid] → Show login screen
  │     │     │     │
  │     │     │     └─> [API error] → Use cached user data
  │     │     │
  │     │     └─> [No token] → Show login screen
  │     │
  │     └─> Login Screen
  │           │
  │           ├─> Enter email
  │           │
  │           ├─> Enter password
  │           │
  │           ├─> Tap "Login"
  │           │     │
  │           │     ├─> Validate inputs
  │           │     │     │
  │           │     │     ├─> [Invalid] → Show error
  │           │     │     │
  │           │     │     └─> [Valid] → Continue
  │           │     │
  │           │     ├─> Check API health
  │           │     │     │
  │           │     │     ├─> [Unhealthy] → Show connection error
  │           │     │     │
  │           │     │     └─> [Healthy] → Continue
  │           │     │
  │           │     ├─> Send login request
  │           │     │
  │           │     ├─> [Success]
  │           │     │     │
  │           │     │     ├─> Store token
  │           │     │     │
  │           │     │     ├─> Store user data
  │           │     │     │
  │           │     │     ├─> Check user role
  │           │     │     │     │
  │           │     │     │     ├─> [Technician] → Technician tabs
  │           │     │     │     │
  │           │     │     │     ├─> [Customer] → Customer tabs
  │           │     │     │     │
  │           │     │     │     └─> [Other] → Show error
  │           │     │     │
  │           │     │     └─> Navigate to main app
  │           │     │
  │           │     └─> [Failure] → Show error message
  │           │
  │           └─> Tap "Forgot Password"
  │                 │
  │                 └─> Password Reset Flow
  │
END
```

---

### Flow 2: Password Reset

```
┌─────────────────────────────────────────────────────────────┐
│                PASSWORD RESET FLOW                          │
└─────────────────────────────────────────────────────────────┘

START (From Login Screen)
  │
  ├─> Tap "Forgot Password?"
  │     │
  │     └─> Password Reset Screen
  │           │
  │           ├─> Enter email address
  │           │
  │           ├─> Tap "Send Reset Link"
  │           │     │
  │           │     ├─> Validate email format
  │           │     │
  │           │     ├─> Send API request
  │           │     │
  │           │     ├─> [Success]
  │           │     │     │
  │           │     │     ├─> Show success message
  │           │     │     │
  │           │     │     └─> "Check your email for reset instructions"
  │           │     │
  │           │     └─> [Failure] → Show error
  │           │
  │           └─> User checks email
  │                 │
  │                 ├─> Receives reset email
  │                 │
  │                 ├─> Copies reset token
  │                 │
  │                 └─> Returns to app
  │                       │
  │                       └─> Password Reset Confirm Screen
  │                             │
  │                             ├─> Enter reset token
  │                             │
  │                             ├─> Enter new password
  │                             │
  │                             ├─> Confirm new password
  │                             │
  │                             ├─> Tap "Reset Password"
  │                             │     │
  │                             │     ├─> Validate inputs
  │                             │     │
  │                             │     ├─> Send API request
  │                             │     │
  │                             │     ├─> [Success]
  │                             │     │     │
  │                             │     │     ├─> Show success message
  │                             │     │     │
  │                             │     │     └─> Navigate to login
  │                             │     │
  │                             │     └─> [Failure] → Show error
  │                             │
  │                             └─> Login with new password
  │
END
```

---


