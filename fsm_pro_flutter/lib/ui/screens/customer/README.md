# Customer Screens

This directory contains screens specific to customer users.

## CustomerDashboardScreen

The main dashboard for customer users, providing an overview of their service requests and equipment status.

### Features

- **Welcome Header**: Personalized greeting with customer name
- **Active Work Orders Section**: 
  - Displays up to 5 active (non-completed) work orders
  - Shows job title, scheduled date, status badge, and equipment info
  - Priority indicator via left border color
  - Tap to view full work order details
  - Link to view all work orders if more than 5
  
- **Workshop Jobs Section**:
  - Shows equipment currently in the workshop
  - Displays equipment type and current repair status
  - Tap to view detailed work order and equipment tracking
  
- **Pull-to-Refresh**: Swipe down to reload data
- **Error Handling**: Displays error messages with retry option
- **Loading States**: Shows loading indicator while fetching data

### Integration

The screen uses:
- `CustomerProvider` for state management
- `AuthProvider` to get current user information
- `CustomerRepository` to fetch data from API

### API Endpoints Used

- `GET /api/jobs?customer_id={id}` - Fetch customer's work orders
- `GET /api/workshop/customer/{id}/jobs` - Fetch customer's workshop jobs

### Navigation

The screen supports navigation to:
- Work Order Details screen (when tapping on any work order)
- Work Orders list screen (via "View all" button or bottom navigation)

### Usage

```dart
// Add to your navigation/routing
CustomerDashboardScreen()

// Or with named routes
Navigator.pushNamed(context, '/customer-dashboard');
```

### Requirements Satisfied

- Requirement 9.1: Customer login and dashboard navigation
- Requirement 9.2: Display active work orders and equipment list
- Requirement 9.3: Navigate to work order details
- Requirement 9.4: Display equipment status for workshop jobs
- Requirement 9.5: Access to profile (via bottom navigation)
