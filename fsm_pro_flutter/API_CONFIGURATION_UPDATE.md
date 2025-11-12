# API Configuration Update

## Change Summary
Updated the Flutter app to connect to the correct API domain.

### Previous Configuration
```
Base URL: https://fsmpro.phishsimulator.com/api
```

### New Configuration
```
Base URL: https://fsmproapi.phishsimulator.com
```

## Files Modified
- `lib/core/constants/api_constants.dart` - Updated base URL constant

## API Endpoints
All API endpoints remain the same and are appended to the base URL:

### Authentication
- POST `/auth/login` - User login
- POST `/auth/logout` - User logout
- GET `/auth/profile` - Get user profile

### Work Orders
- GET `/jobs` - List work orders (with filters)
- GET `/jobs/:id` - Get work order details
- PATCH `/jobs/:id/status` - Update work order status

### Inventory
- GET `/inventory` - Get inventory items

### Workshop
- GET `/workshop/queue` - Get workshop queue
- POST `/workshop/jobs/:id/claim` - Claim workshop job
- GET `/workshop/status/:jobId` - Get equipment status
- PUT `/workshop/status/:jobId` - Update equipment status
- GET `/workshop/status/:jobId/history` - Get status history

### Customer
- GET `/workshop/customer/:customerId/jobs` - Get customer workshop jobs

### Technician
- PATCH `/technicians/:id/availability` - Update technician availability

## Verification Status
✅ Code analysis passed (no errors)
✅ All imports resolved
✅ API service properly configured
✅ All endpoints mapped correctly

## Testing Recommendations
1. Test login functionality with the new API endpoint
2. Verify work order listing and details
3. Test workshop queue and equipment tracking
4. Verify inventory management
5. Test customer dashboard features
6. Confirm profile and settings work correctly

## Notes
- The app uses Dio for HTTP requests with 30-second timeout
- Authentication tokens are automatically added to all requests
- Error handling includes network, auth, and server errors
- Offline mode support is built-in for better UX
