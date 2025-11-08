# Setup Wizard Fix - Database Schema Issue

## Problem

The setup wizard was failing with a 500 error when trying to complete the setup:

```
Error initializing setup: error: relation "company_settings" does not exist
```

## Root Cause

The `setupController.ts` was trying to insert configuration data (timezone, currency, date_format) into a `company_settings` table that doesn't exist in the database schema.

## Solution

The `companies` table already has columns for these settings:
- `timezone` (VARCHAR(50), default: 'UTC')
- `currency` (VARCHAR(3), default: 'USD')
- `date_format` (VARCHAR(20), default: 'MM/DD/YYYY')

**Fix:** Updated `api/src/controllers/setupController.ts` to insert these values directly into the `companies` table instead of trying to use a non-existent `company_settings` table.

## Changes Made

### File: `api/src/controllers/setupController.ts`

**Before:**
```typescript
// Create the company
const companyResult = await client.query(
  `INSERT INTO companies (name, address, phone, email, is_active, created_at, updated_at)
   VALUES ($1, $2, $3, $4, true, NOW(), NOW())
   RETURNING id, name, email`,
  [companyName, companyAddress || '', companyPhone || '', companyEmail || adminEmail]
);

// Later... try to insert into non-existent table
await client.query(
  `INSERT INTO company_settings (company_id, timezone, currency, date_format, ...)
   VALUES ($1, $2, $3, $4, ...)`,
  [company.id, timezone, currency, dateFormat]
);
```

**After:**
```typescript
// Create the company with configuration settings included
const companyResult = await client.query(
  `INSERT INTO companies (name, address, phone, email, timezone, currency, date_format, is_active, created_at, updated_at)
   VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW())
   RETURNING id, name, email, timezone, currency, date_format`,
  [
    companyName,
    companyAddress || '',
    companyPhone || '',
    companyEmail || adminEmail,
    timezone || 'America/New_York',
    currency || 'USD',
    dateFormat || 'MM/DD/YYYY'
  ]
);
```

## Deployment Steps for Coolify

### 1. Commit Changes
```bash
git add api/src/controllers/setupController.ts
git add admin-frontend/src/App.tsx
git add admin-frontend/src/pages/Setup/SetupWizard.tsx
git commit -m "Fix setup wizard: Use companies table for settings instead of non-existent company_settings table"
```

### 2. Push to GitHub
```bash
git push origin main
```

### 3. Redeploy on Coolify

**Option A: Auto-Deploy (if webhooks configured)**
- Coolify will automatically detect the push and redeploy

**Option B: Manual Deploy**
1. Log into your Coolify dashboard
2. Go to your FSM Pro project
3. Click on the `api` service
4. Click "Redeploy" or "Force Deploy"
5. Wait for the build to complete

### 4. Verify the Fix

After deployment, test the setup wizard:

1. **Reset database** (if needed):
   ```bash
   # SSH into your VPS
   docker exec fsm-postgres-coolify psql -U fsm_user -d fsm_db -c "TRUNCATE users, companies CASCADE;"
   ```

2. **Visit your site**:
   ```
   https://fsmpro.phishsimulator.com
   ```

3. **Complete the setup wizard**:
   - Step 1: Welcome
   - Step 2: Admin account details
   - Step 3: Company profile
   - Step 4: Configuration (timezone, currency, date format)
   - Step 5: Completion

4. **Verify data was created**:
   ```bash
   # Check users
   docker exec fsm-postgres-coolify psql -U fsm_user -d fsm_db -c "SELECT email, full_name, role FROM users;"
   
   # Check companies with settings
   docker exec fsm-postgres-coolify psql -U fsm_user -d fsm_db -c "SELECT name, email, timezone, currency, date_format FROM companies;"
   ```

## Database Schema Verification

All required tables exist in `database/init.sql`:

```sql
-- Companies table with built-in settings columns
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    logo_url TEXT,
    business_type VARCHAR(100),
    tax_id VARCHAR(50),
    license_number VARCHAR(100),
    timezone VARCHAR(50) DEFAULT 'UTC',           -- ✅ Settings column
    currency VARCHAR(3) DEFAULT 'USD',            -- ✅ Settings column
    date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY', -- ✅ Settings column
    time_format VARCHAR(10) DEFAULT '12h',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Testing Checklist

- [ ] Code changes committed and pushed to GitHub
- [ ] API service redeployed on Coolify
- [ ] Database is empty (no users or companies)
- [ ] Visit site and get redirected to `/setup`
- [ ] Complete all 5 steps of setup wizard
- [ ] No 500 errors in browser console
- [ ] Successfully redirected to `/login` after setup
- [ ] Can log in with created admin credentials
- [ ] Company settings (timezone, currency, date_format) saved correctly
- [ ] Setup wizard is blocked on subsequent visits

## Additional Notes

### TypeScript Fixes

Also fixed TypeScript compilation errors in the frontend:

1. **`admin-frontend/src/App.tsx`**: Fixed API response type handling for setup check
2. **`admin-frontend/src/pages/Setup/SetupWizard.tsx`**: Fixed API response type handling for setup initialization

These changes ensure proper type safety when calling the setup API endpoints.

### API Response Structure

The API service returns `ApiResponse<T>` which has this structure:
```typescript
{
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

Always access data via `response.data` and use optional chaining for safety.

## Files Modified

1. ✅ `api/src/controllers/setupController.ts` - Fixed company settings insertion
2. ✅ `admin-frontend/src/App.tsx` - Fixed TypeScript types for setup check
3. ✅ `admin-frontend/src/pages/Setup/SetupWizard.tsx` - Fixed TypeScript types for setup initialization

## No Database Changes Required

The database schema (`database/init.sql`) is already correct and doesn't need any changes. The `companies` table already has all the necessary columns for storing configuration settings.

When you start fresh Docker containers on Coolify, the `init.sql` script will automatically create all tables with the correct schema.

## Summary

✅ **Root cause identified**: Code was trying to use non-existent `company_settings` table  
✅ **Fix applied**: Use existing columns in `companies` table  
✅ **TypeScript errors fixed**: Proper type handling for API responses  
✅ **No schema changes needed**: Database structure is already correct  
✅ **Ready to deploy**: Commit, push, and redeploy on Coolify  

After deployment, the setup wizard will work correctly and save all configuration settings to the `companies` table.

