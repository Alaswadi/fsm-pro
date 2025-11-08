# Demo Data Feature for Setup Wizard

## Overview

The setup wizard now includes an **optional demo data seeding feature** that populates the system with sample data to help new users explore FSM Pro's features immediately after setup.

## What's Included

When users check the "Include demo data" checkbox during setup, the system automatically creates:

### 1. Equipment Types (10 items)
- HVAC System
- Furnace
- Air Conditioner
- Heat Pump
- Water Heater
- Boiler
- Thermostat
- Air Handler
- Ductwork
- Refrigeration Unit

### 2. Company Skills (8 items)
- HVAC Installation
- HVAC Repair
- Preventive Maintenance
- Electrical Work
- Plumbing
- Refrigeration
- Duct Cleaning
- Energy Audit

### 3. Company Certifications (5 items)
- EPA 608 Certification
- NATE Certification
- OSHA Safety Training
- Journeyman License
- Master HVAC License

### 4. Sample Customers (3 items)
- John Smith (Residential)
- Sarah Johnson (Residential)
- Acme Corporation (Commercial)

### 5. Inventory Items (8 items)
- Air Filter (16x20x1) - $12.99
- Air Filter (20x25x1) - $15.99
- Capacitor 45/5 MFD - $24.99
- Contactor 30A - $35.99
- Thermostat Wire 18/8 - $45.00
- Refrigerant R410A (25lb) - $350.00
- Condensate Pump - $89.99
- Blower Motor 1/2 HP - $275.00

## User Experience

### Setup Wizard Flow

**Step 4: Configuration**

The demo data option appears as a checkbox in the Configuration step:

```
┌─────────────────────────────────────────────────┐
│ ☑ Include demo data                             │
│                                                  │
│ Populate your system with sample data including │
│ equipment types, customers, inventory items,    │
│ and skills. This helps you explore the system   │
│ features immediately. You can delete this data  │
│ later.                                          │
│                                                  │
│ Demo data includes:                             │
│ • 10 Equipment Types                            │
│ • 8 Company Skills                              │
│ • 5 Certifications                              │
│ • 3 Sample Customers                            │
│ • 8 Inventory Items                             │
└─────────────────────────────────────────────────┘
```

### Default Behavior

- **Checkbox is checked by default** for better first-time user experience
- Users can uncheck it if they want to start with a clean slate
- The choice is sent to the backend as `includeDemoData: boolean`

## Technical Implementation

### Backend Changes

**File: `api/src/controllers/setupController.ts`**

1. **New Function: `seedDemoData()`**
   - Takes database client and company ID
   - Creates all demo data within the same transaction
   - Logs progress for debugging
   - All data is company-scoped (uses `company_id`)

2. **Updated: `initializeSetup()`**
   - Accepts new parameter: `includeDemoData: boolean`
   - Calls `seedDemoData()` if `includeDemoData === true`
   - Returns `demoDataSeeded` flag in response
   - All demo data creation happens in the same transaction as user/company creation

### Frontend Changes

**File: `admin-frontend/src/pages/Setup/SetupWizard.tsx`**

1. **Updated Interface: `SetupData`**
   - Added `includeDemoData: boolean` field
   - Default value: `true`

**File: `admin-frontend/src/pages/Setup/ConfigurationStep.tsx`**

1. **Updated Form**
   - Added checkbox for demo data option
   - Styled with blue info box
   - Lists all demo data items
   - Includes helpful description

## API Changes

### Request

**POST `/api/setup/initialize`**

```json
{
  "adminEmail": "admin@company.com",
  "adminPassword": "SecurePass123",
  "adminFullName": "John Doe",
  "adminPhone": "+1-555-0123",
  "companyName": "Acme Field Services",
  "companyAddress": "123 Main St",
  "companyPhone": "+1-555-0100",
  "companyEmail": "info@company.com",
  "timezone": "America/New_York",
  "currency": "USD",
  "dateFormat": "MM/DD/YYYY",
  "includeDemoData": true
}
```

### Response

```json
{
  "success": true,
  "message": "Setup completed successfully with demo data",
  "data": {
    "company": {
      "id": "uuid",
      "name": "Acme Field Services",
      "email": "info@company.com"
    },
    "user": {
      "id": "uuid",
      "email": "admin@company.com",
      "fullName": "John Doe",
      "role": "admin"
    },
    "demoDataSeeded": true
  }
}
```

## Database Impact

### Transaction Safety

All demo data is created within the same database transaction as the user and company:

```typescript
const result = await transaction(async (client) => {
  // 1. Create company
  // 2. Create admin user
  // 3. Seed demo data (if requested)
  // All or nothing - transaction ensures atomicity
});
```

### Data Cleanup

Users can delete demo data later through the normal UI:
- Equipment Types: Settings → Equipment Types
- Skills: Settings → Skills
- Certifications: Settings → Certifications
- Customers: Customers page
- Inventory: Inventory page

## Benefits

1. **Better Onboarding**: New users can immediately see how the system works
2. **Feature Discovery**: Sample data helps users explore all features
3. **Testing**: Provides realistic data for testing workflows
4. **Training**: Useful for training new staff members
5. **Optional**: Users who want a clean slate can uncheck the option

## Deployment

### Files Changed

**Backend:**
- `api/src/controllers/setupController.ts` - Added demo data seeding

**Frontend:**
- `admin-frontend/src/pages/Setup/SetupWizard.tsx` - Added includeDemoData field
- `admin-frontend/src/pages/Setup/ConfigurationStep.tsx` - Added checkbox UI

### Deployment Steps

1. **Commit changes:**
   ```bash
   git add api/src/controllers/setupController.ts
   git add admin-frontend/src/pages/Setup/SetupWizard.tsx
   git add admin-frontend/src/pages/Setup/ConfigurationStep.tsx
   git commit -m "Add demo data option to setup wizard"
   ```

2. **Push to repository:**
   ```bash
   git push origin main
   ```

3. **Deploy on Coolify:**
   - Coolify will auto-deploy if webhooks are configured
   - Or manually trigger deployment in Coolify dashboard

4. **Test:**
   - Reset database (if testing)
   - Go through setup wizard
   - Verify demo data is created when checkbox is checked
   - Verify no demo data when checkbox is unchecked

## Testing

### Test Case 1: With Demo Data

1. Reset database
2. Go to `/setup`
3. Complete wizard with "Include demo data" **checked**
4. Login
5. Verify:
   - Equipment Types page shows 10 items
   - Skills page shows 8 items
   - Certifications page shows 5 items
   - Customers page shows 3 items
   - Inventory page shows 8 items

### Test Case 2: Without Demo Data

1. Reset database
2. Go to `/setup`
3. **Uncheck** "Include demo data"
4. Complete wizard
5. Login
6. Verify:
   - All pages are empty
   - No demo data exists

### Test Case 3: Transaction Rollback

1. Temporarily break the demo data seeding (e.g., invalid SQL)
2. Try to complete setup with demo data
3. Verify:
   - Setup fails
   - No user is created
   - No company is created
   - Database remains clean (transaction rolled back)

## Future Enhancements

Potential improvements for future versions:

1. **More Demo Data**
   - Sample jobs (scheduled, in-progress, completed)
   - Sample technicians
   - Sample invoices
   - Job photos

2. **Customizable Demo Data**
   - Let users choose which types of demo data to include
   - Industry-specific demo data (HVAC, Plumbing, Electrical, etc.)

3. **Demo Data Indicator**
   - Visual indicator on demo data items
   - Bulk delete option for all demo data

4. **Demo Mode**
   - Separate "demo mode" that can be toggled on/off
   - Automatically resets demo data periodically

## Troubleshooting

### Demo data not appearing

1. Check API logs for seeding errors:
   ```bash
   docker logs fsm-api-coolify | grep "Setup"
   ```

2. Verify the request included `includeDemoData: true`:
   ```bash
   docker logs fsm-api-coolify | grep "includeDemoData"
   ```

3. Check for database errors during seeding:
   ```bash
   docker logs fsm-api-coolify | grep "error"
   ```

### Partial demo data

If only some demo data appears:
1. Check which tables are missing data
2. Review API logs for specific errors
3. Verify all required tables exist in database
4. Check foreign key constraints

### Transaction timeout

If setup times out with demo data:
1. Increase transaction timeout in database config
2. Reduce amount of demo data
3. Check database performance

