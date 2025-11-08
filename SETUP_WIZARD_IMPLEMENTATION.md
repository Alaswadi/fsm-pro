# FSM Pro Setup Wizard Implementation

## Overview

A WordPress-style setup wizard has been successfully implemented for FSM Pro. This allows new installations to be configured through a user-friendly web interface instead of requiring pre-seeded database data.

## What Was Implemented

### 1. Database Schema Changes ✅

**File Modified:** `database/init.sql`

- **Removed all seed data** (INSERT statements for users, companies, technicians, etc.)
- **Kept only schema creation** (tables, enums, extensions, triggers, indexes)
- Database now initializes with empty tables, ready for the setup wizard

### 2. Backend API Endpoints ✅

**New Files Created:**
- `api/src/controllers/setupController.ts` - Setup logic
- `api/src/routes/setup.ts` - Setup routes
- `api/src/middleware/setupCheck.ts` - Setup protection middleware

**API Endpoints:**

#### `GET /api/setup/check`
- **Purpose:** Check if setup is needed
- **Returns:** `{ setupNeeded: boolean, userCount: number, companyCount: number }`
- **Access:** Public (no authentication required)

#### `POST /api/setup/initialize`
- **Purpose:** Create first admin user and company
- **Request Body:**
```json
{
  "adminEmail": "admin@company.com",
  "adminPassword": "SecurePass123",
  "adminFullName": "John Doe",
  "adminPhone": "+1-555-0123",
  "companyName": "Acme Field Services",
  "companyAddress": "123 Main St, City, State 12345",
  "companyPhone": "+1-555-0100",
  "companyEmail": "info@company.com",
  "timezone": "America/New_York",
  "currency": "USD",
  "dateFormat": "MM/DD/YYYY"
}
```
- **Returns:** Created user and company details
- **Access:** Public (only works if no users exist)
- **Security:** Automatically blocked if users already exist

### 3. Frontend Setup Wizard ✅

**New Files Created:**
- `admin-frontend/src/pages/Setup/SetupWizard.tsx` - Main wizard container
- `admin-frontend/src/pages/Setup/WelcomeStep.tsx` - Step 1: Welcome screen
- `admin-frontend/src/pages/Setup/AdminUserStep.tsx` - Step 2: Create admin user
- `admin-frontend/src/pages/Setup/CompanyProfileStep.tsx` - Step 3: Company info
- `admin-frontend/src/pages/Setup/ConfigurationStep.tsx` - Step 4: System config
- `admin-frontend/src/pages/Setup/CompletionStep.tsx` - Step 5: Success screen

**File Modified:**
- `admin-frontend/src/App.tsx` - Added setup detection and routing

**Features:**
- **5-step wizard** with progress bar
- **Form validation** on all inputs
- **Password strength requirements** (min 8 chars, uppercase, lowercase, number)
- **Responsive design** matching FSM Pro's existing UI
- **Error handling** with user-friendly messages
- **Auto-redirect** to setup if database is empty
- **Setup blocking** after completion

### 4. Setup Detection & Security ✅

**Frontend Protection:**
- App checks `/api/setup/check` on load
- If `setupNeeded = true`, redirects all routes to `/setup`
- If `setupNeeded = false`, blocks access to `/setup` (redirects to `/login`)

**Backend Protection:**
- Middleware checks if users exist before allowing setup initialization
- Returns 403 error if trying to run setup when users already exist
- Prevents accidental re-initialization

## How It Works

### Fresh Installation Flow

1. **Database Initialization**
   - PostgreSQL container starts
   - `init.sql` runs automatically (creates schema only, no data)
   - Database has empty tables

2. **First Visit**
   - User visits `https://fsmpro.phishsimulator.com`
   - Frontend calls `/api/setup/check`
   - API returns `setupNeeded: true`
   - User is redirected to `/setup`

3. **Setup Wizard**
   - **Step 1:** Welcome screen explaining the process
   - **Step 2:** User creates admin account (email, password, name, phone)
   - **Step 3:** User enters company information
   - **Step 4:** User configures timezone, currency, date format
   - **Step 5:** System creates user & company, shows success screen

4. **Post-Setup**
   - User clicks "Go to Login"
   - Redirected to `/login`
   - Can log in with created credentials
   - `/setup` is now blocked (redirects to `/login`)

### Existing Installation Flow

1. **User visits site**
2. Frontend calls `/api/setup/check`
3. API returns `setupNeeded: false` (users exist)
4. Normal login flow proceeds
5. Any attempt to access `/setup` redirects to `/login`

## Testing Instructions

### Test 1: Fresh Installation

```bash
# 1. Stop and remove existing containers and volumes
docker-compose -f docker-compose.coolify.yml down
docker volume rm fsm-pro-copy_postgres_data

# 2. Start fresh
docker-compose -f docker-compose.coolify.yml up -d

# 3. Wait for database to initialize (check logs)
docker-compose -f docker-compose.coolify.yml logs -f postgres

# 4. Visit the site
# Open browser: https://fsmpro.phishsimulator.com
# Should automatically redirect to /setup

# 5. Complete the wizard
# - Fill in admin details
# - Fill in company details
# - Configure settings
# - Click "Complete Setup"

# 6. Verify database
docker exec -it fsm-postgres-coolify psql -U fsm_user -d fsm_db
SELECT email, full_name, role FROM users;
SELECT name, email FROM companies;
\q

# 7. Test login
# Should redirect to /login
# Log in with created credentials
# Should successfully access dashboard
```

### Test 2: Setup Protection

```bash
# After completing setup, try to access setup again
# Visit: https://fsmpro.phishsimulator.com/setup
# Should redirect to /login

# Try to call API directly
curl -X POST https://fsmpro.phishsimulator.com/api/setup/initialize \
  -H "Content-Type: application/json" \
  -d '{"adminEmail":"test@test.com","adminPassword":"Test123","adminFullName":"Test","companyName":"Test"}'

# Should return: {"success":false,"error":"Setup has already been completed. Cannot reinitialize."}
```

### Test 3: Validation

```bash
# Test password validation
# - Try password < 8 characters → Should show error
# - Try password without uppercase → Should show error
# - Try password without number → Should show error
# - Try mismatched passwords → Should show error

# Test email validation
# - Try invalid email format → Should show error

# Test required fields
# - Leave admin name empty → Should show error
# - Leave company name empty → Should show error
```

## Configuration Options

### Supported Timezones
- Eastern Time (America/New_York)
- Central Time (America/Chicago)
- Mountain Time (America/Denver)
- Arizona Time (America/Phoenix)
- Pacific Time (America/Los_Angeles)
- Alaska Time (America/Anchorage)
- Hawaii Time (Pacific/Honolulu)
- London (Europe/London)
- Paris (Europe/Paris)
- Tokyo (Asia/Tokyo)
- Sydney (Australia/Sydney)

### Supported Currencies
- USD (US Dollar)
- EUR (Euro)
- GBP (British Pound)
- CAD (Canadian Dollar)
- AUD (Australian Dollar)
- JPY (Japanese Yen)
- INR (Indian Rupee)

### Supported Date Formats
- MM/DD/YYYY (12/31/2024)
- DD/MM/YYYY (31/12/2024)
- YYYY-MM-DD (2024-12-31)
- DD-MMM-YYYY (31-Dec-2024)

## Security Features

1. **Password Hashing:** Uses bcryptjs with 10 salt rounds
2. **Password Requirements:** Minimum 8 characters, must contain uppercase, lowercase, and number
3. **Email Validation:** Regex pattern validation
4. **Setup Protection:** Cannot run setup if users already exist
5. **Transaction Safety:** Uses database transactions to ensure atomicity
6. **Error Handling:** Proper error messages without exposing sensitive details

## Files Changed Summary

### Backend
- ✅ `database/init.sql` - Removed seed data
- ✅ `api/src/controllers/setupController.ts` - New
- ✅ `api/src/routes/setup.ts` - New
- ✅ `api/src/routes/index.ts` - Added setup routes
- ✅ `api/src/middleware/setupCheck.ts` - New

### Frontend
- ✅ `admin-frontend/src/App.tsx` - Added setup detection
- ✅ `admin-frontend/src/pages/Setup/SetupWizard.tsx` - New
- ✅ `admin-frontend/src/pages/Setup/WelcomeStep.tsx` - New
- ✅ `admin-frontend/src/pages/Setup/AdminUserStep.tsx` - New
- ✅ `admin-frontend/src/pages/Setup/CompanyProfileStep.tsx` - New
- ✅ `admin-frontend/src/pages/Setup/ConfigurationStep.tsx` - New
- ✅ `admin-frontend/src/pages/Setup/CompletionStep.tsx` - New

## Next Steps

1. **Test the setup wizard** using the instructions above
2. **Verify all validations** work correctly
3. **Test the complete flow** from fresh install to login
4. **Customize branding** if needed (logo, colors, text)
5. **Add additional configuration options** if required

## Troubleshooting

### Setup page not showing
- Check if database has existing users: `SELECT COUNT(*) FROM users;`
- Check browser console for errors
- Check API logs: `docker-compose -f docker-compose.coolify.yml logs -f api`

### Setup fails with error
- Check API logs for detailed error messages
- Verify database connection
- Check if all required fields are provided

### Can't access setup after completion
- This is expected behavior - setup is blocked after first use
- To reset: Drop database volume and restart containers

## Support

For issues or questions, check:
1. Browser console (F12)
2. API logs: `docker-compose -f docker-compose.coolify.yml logs -f api`
3. Database logs: `docker-compose -f docker-compose.coolify.yml logs -f postgres`

