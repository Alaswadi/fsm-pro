# Notes Save Fix - Work Order Details

## Problem
The floating button to add notes in the work order details screen was showing and the popup dialog was working, but the notes were not being saved to the database.

## Root Cause
The backend API endpoint `PATCH /api/jobs/:id/status` was not handling the `notes` parameter. It only updated the status, started_at, and completed_at fields, completely ignoring any notes sent from the mobile app.

## Changes Made

### 1. Backend API Fix (`api/src/controllers/jobsController.ts`)
Updated the `updateJobStatus` function to:
- Accept `notes` parameter from the request body
- Retrieve existing `technician_notes` from the database
- Append new notes to existing notes (with proper formatting)
- Update the `technician_notes` field in the database

**Key changes:**
```typescript
// Extract notes from request
const { status, notes } = req.body;

// Retrieve existing notes
const existingJobResult = await query(
  'SELECT status, started_at, completed_at, technician_notes FROM jobs WHERE id = $1 AND company_id = $2',
  [id, companyId]
);

// Append new notes to existing notes
let technician_notes = existingJob.technician_notes || '';
if (notes && notes.trim()) {
  if (technician_notes) {
    technician_notes += '\n\n' + notes.trim();
  } else {
    technician_notes = notes.trim();
  }
}

// Update with notes
const updateQuery = `
  UPDATE jobs
  SET status = $1, started_at = $2, completed_at = $3, technician_notes = $4, updated_at = NOW()
  WHERE id = $5 AND company_id = $6
  RETURNING *
`;
```

### 2. Flutter Model Fix (`fsm_pro_flutter/lib/data/models/work_order.dart`)
Updated the `WorkOrder.fromJson` method to properly map the `technician_notes` field from the API response:

**Before:**
```dart
notes: json['notes'],
```

**After:**
```dart
notes: json['technician_notes'] ?? json['notes'],
```

This ensures the model checks for `technician_notes` first (which is what the database uses), then falls back to `notes` for backward compatibility.

## Testing Steps

1. **Restart the API server** (if running):
   ```bash
   # If using Docker
   docker-compose restart api
   
   # If running directly
   # Stop the current process and restart with:
   cd api
   npm start
   ```

2. **Rebuild and test the Flutter app**:
   ```bash
   cd fsm_pro_flutter
   flutter run
   ```

3. **Test the notes feature**:
   - Open a work order in "assigned" or "in_progress" status
   - Tap the "Add Notes" floating action button
   - Enter some notes in the dialog
   - Tap "Save Notes"
   - Verify the success message appears
   - Pull to refresh the work order details
   - Verify the notes appear in the "Notes" card
   - Add more notes and verify they are appended (not replaced)

## Expected Behavior

- Notes should be saved to the database when you tap "Save Notes"
- Notes should appear in the work order details after refreshing
- Multiple note additions should append to existing notes (separated by blank lines)
- Notes should persist across app restarts
- Notes should be visible in both the mobile app and admin panel

## Database Field
The notes are stored in the `technician_notes` TEXT field in the `jobs` table.

## API Endpoint
**PATCH** `/api/jobs/:id/status`

**Request Body:**
```json
{
  "status": "in_progress",
  "notes": "Customer reported strange noise. Inspected equipment and found loose belt."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "status": "in_progress",
    "technician_notes": "Customer reported strange noise. Inspected equipment and found loose belt.",
    ...
  }
}
```

## Notes
- The notes feature appends new notes to existing notes, so technicians can add multiple updates over time
- Notes are separated by double newlines (`\n\n`) for readability
- The same endpoint is used for both status updates and note additions
- When adding notes without changing status, the current status is sent back to the API
