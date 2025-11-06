# Error Handling Guide

This document outlines the error handling strategy implemented in the FSM Pro admin frontend, with a focus on the Workshop/Depot Repair system.

## Overview

The application uses a multi-layered error handling approach:

1. **API Layer**: Backend validation and error responses
2. **Service Layer**: API error handling and transformation
3. **Component Layer**: User-facing error messages and validation
4. **Error Boundary**: React error boundary for uncaught errors

## Error Handling Utilities

### Location: `src/utils/errorHandler.ts`

This utility provides comprehensive error handling and validation functions:

#### API Error Handling

```typescript
import { handleApiError } from '../utils/errorHandler';

try {
  const response = await apiService.someEndpoint();
  // Handle success
} catch (error) {
  handleApiError(error, 'Failed to perform action');
}
```

#### Form Validation

```typescript
import { validateIntakeForm, handleValidationErrors } from '../utils/errorHandler';

const errors = validateIntakeForm(formData);
if (errors.length > 0) {
  handleValidationErrors(errors);
  return;
}
```

#### Available Validators

- `validateRequired(value, fieldName)` - Check required fields
- `validateEmail(email)` - Validate email format
- `validatePhone(phone)` - Validate phone number format
- `validateNumberRange(value, min, max, fieldName)` - Validate number ranges
- `validateDate(date, fieldName, minDate?, maxDate?)` - Validate dates
- `validateStatusTransition(currentStatus, newStatus)` - Validate equipment status transitions

#### Workshop-Specific Validators

- `validateIntakeForm(data)` - Validate equipment intake form
- `validateDeliveryForm(data)` - Validate delivery scheduling form
- `validateReturnForm(data)` - Validate equipment return form
- `validateWorkshopSettings(data)` - Validate workshop settings

#### Capacity Checks

```typescript
import { checkCapacityExceeded, getCapacityWarningMessage } from '../utils/errorHandler';

const isExceeded = checkCapacityExceeded(currentJobs, maxJobs);
const warningMessage = getCapacityWarningMessage(currentJobs, maxJobs);

if (warningMessage) {
  toast.warning(warningMessage);
}
```

## Error Boundary

### Location: `src/components/ErrorBoundary.tsx`

Wrap components with ErrorBoundary to catch and handle React errors gracefully:

```typescript
import ErrorBoundary from './components/ErrorBoundary';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

The Error Boundary provides:
- User-friendly error UI
- Error details in development mode
- Options to retry or refresh
- Automatic error logging

## API Error Responses

All API endpoints return consistent error responses:

```typescript
{
  success: false,
  error: "Human-readable error message",
  code?: "ERROR_CODE",
  details?: { /* Additional error details */ }
}
```

### Common Error Codes

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

## Workshop-Specific Error Handling

### Equipment Intake

**Validation:**
- Job ID is required
- Reported issue is required
- Job must be a workshop job
- No duplicate intake records

**Error Messages:**
- "Job ID is required"
- "Reported issue is required"
- "Can only create intake records for workshop jobs"
- "Intake record already exists for this job"

### Status Transitions

**Valid Transitions:**
```
pending_intake → in_transit, received
in_transit → received
received → in_repair
in_repair → repair_completed, received (can go back)
repair_completed → ready_for_pickup, out_for_delivery
ready_for_pickup → returned
out_for_delivery → returned
returned → (terminal state)
```

**Error Messages:**
- "Cannot transition from {current} to {new}. Valid transitions: {allowed}"

### Capacity Management

**Validation:**
- Check workshop capacity before creating jobs
- Check technician capacity before claiming jobs
- Warn when approaching 80% capacity

**Error Messages:**
- "Workshop is at full capacity. Cannot accept new jobs."
- "Workshop is approaching capacity ({current}/{max} jobs)"
- "Technician has reached maximum job capacity"

### Delivery Scheduling

**Validation:**
- Delivery date is required
- Delivery technician is required
- Delivery date cannot be in the past
- Technician must belong to the company

**Error Messages:**
- "Delivery date and technician are required"
- "Delivery Date cannot be before {today}"
- "Technician not found or does not belong to your company"

### Equipment Return

**Validation:**
- Customer signature is required
- Job must have an intake record
- Job must be a workshop job

**Error Messages:**
- "Customer signature is required"
- "No intake record found for this job"
- "Job is not a workshop job"

## Best Practices

### 1. Always Validate User Input

```typescript
// Before submitting
const errors = validateIntakeForm(formData);
if (errors.length > 0) {
  handleValidationErrors(errors);
  return;
}
```

### 2. Provide Specific Error Messages

```typescript
// Bad
toast.error('Error occurred');

// Good
toast.error('Failed to create intake record: Job not found');
```

### 3. Handle Edge Cases

```typescript
// Check for capacity before allowing actions
if (checkCapacityExceeded(currentJobs, maxJobs)) {
  toast.error('Workshop is at full capacity');
  return;
}
```

### 4. Log Errors for Debugging

```typescript
try {
  // Operation
} catch (error) {
  console.error('Detailed error context:', error);
  handleApiError(error, 'User-friendly message');
}
```

### 5. Use Try-Catch for Async Operations

```typescript
const handleSubmit = async () => {
  try {
    await apiService.createIntake(data);
    toast.success('Intake created successfully');
  } catch (error) {
    handleApiError(error, 'Failed to create intake');
  }
};
```

### 6. Validate Status Transitions

```typescript
const error = validateStatusTransition(currentStatus, newStatus);
if (error) {
  toast.error(error.message);
  return;
}
```

## Testing Error Handling

### Manual Testing Checklist

- [ ] Submit forms with missing required fields
- [ ] Submit forms with invalid data formats
- [ ] Try invalid status transitions
- [ ] Attempt to exceed capacity limits
- [ ] Schedule delivery in the past
- [ ] Create duplicate intake records
- [ ] Test with network errors (offline mode)
- [ ] Test with slow network (throttling)

### Error Scenarios to Test

1. **Network Errors**: Disconnect network and attempt operations
2. **Validation Errors**: Submit invalid form data
3. **Permission Errors**: Access restricted resources
4. **Capacity Errors**: Exceed workshop/technician limits
5. **Conflict Errors**: Create duplicate resources
6. **Not Found Errors**: Access non-existent resources

## Future Improvements

1. **Error Reporting Service**: Integrate with Sentry or similar service
2. **Retry Logic**: Implement automatic retry for transient errors
3. **Offline Support**: Queue operations when offline
4. **Error Analytics**: Track common errors for UX improvements
5. **Localization**: Translate error messages to multiple languages
