# Fix for 403 Errors After Setup on Coolify VPS

## Problem Summary
After completing the setup wizard on your Coolify VPS, you can login successfully but get **403 Forbidden** errors when accessing `/api/settings/company` and other endpoints.

### Root Cause
The error logs show:
```
Database query error: error: column t.company_id does not exist
```

This indicates that the **database schema wasn't fully initialized**. The `technicians` table either:
1. Doesn't exist at all
2. Exists but is missing the `company_id` column
3. Was created from an older schema version

## What Was Fixed

### 1. **Improved Company Middleware** (`api/src/middleware/company.ts`)
- ✅ Now checks user role FIRST before querying technicians table
- ✅ Wraps technician query in try-catch to prevent crashes
- ✅ Falls back gracefully to admin company lookup
- ✅ Better error logging for debugging

### 2. **Added Diagnostic Endpoints**
New endpoints to help troubleshoot database issues:

#### `/api/diagnostics/health` (Public - No Auth Required)
Returns comprehensive database health information:
- Database connection status
- PostgreSQL version
- List of all existing tables
- List of missing required tables
- Record counts for users, companies, technicians
- Overall health status
- Recommendations for fixes

#### `/api/diagnostics/company-context` (Protected - Requires Auth)
Returns detailed company context for the logged-in user:
- User ID and role
- Whether user is a technician
- Technician's company ID (if applicable)
- List of all available companies
- Current company context from middleware

### 3. **Database Verification Script** (`database/verify-and-fix.sql`)
SQL script that:
- Checks if critical tables exist
- Creates missing tables (technicians, company_skills, company_certifications)
- Verifies all required tables
- Shows current data counts

## How to Fix on Your VPS

### Quick Diagnostic (Do This First)

```bash
# SSH into your VPS
ssh your-vps

# Check the diagnostic endpoint (no auth needed)
curl https://fsmpro.phishsimulator.com/api/diagnostics/health | jq
```

This will tell you exactly what's wrong with your database.

### Fix Option 1: Run Verification Script (Recommended)

```bash
# Navigate to your project
cd /path/to/fsm-pro

# Run the verification and fix script
docker exec -i fsm-postgres-coolify psql -U fsm_user -d fsm_db < database/verify-and-fix.sql

# Restart API to pick up changes
docker restart fsm-api-coolify

# Wait 10 seconds
sleep 10

# Test the fix
curl https://fsmpro.phishsimulator.com/api/diagnostics/health | jq
```

### Fix Option 2: Complete Database Reset

If Option 1 doesn't work, reset everything:

```bash
# Stop services
docker-compose -f docker-compose.coolify.yml down

# Remove database volume (DELETES ALL DATA!)
docker volume ls | grep postgres
docker volume rm <volume_name>

# Start services (database will auto-initialize)
docker-compose -f docker-compose.coolify.yml up -d

# Wait for initialization
sleep 30

# Verify tables were created
docker exec -i fsm-postgres-coolify psql -U fsm_user -d fsm_db -c "\dt" | wc -l
# Should show 30+ tables

# Go to setup wizard
# https://fsmpro.phishsimulator.com/setup
```

### Fix Option 3: Manual Table Creation

```bash
# Run the full init.sql (will skip existing tables)
docker exec -i fsm-postgres-coolify psql -U fsm_user -d fsm_db < database/init.sql

# Restart API
docker restart fsm-api-coolify
```

## Verification Steps

After applying any fix:

### 1. Check Database Health
```bash
curl https://fsmpro.phishsimulator.com/api/diagnostics/health | jq
```

Expected output:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "database": {
      "connected": true,
      "version": "PostgreSQL 15.x..."
    },
    "tables": {
      "total": 30,
      "missing": [],
      "existing": ["users", "companies", "technicians", ...]
    },
    "data": {
      "users": 1,
      "companies": 1,
      "technicians": 0
    },
    "recommendations": []
  }
}
```

### 2. Check Company Context (After Login)
```bash
# Login first to get token
TOKEN=$(curl -X POST https://fsmpro.phishsimulator.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}' \
  | jq -r '.data.token')

# Check company context
curl https://fsmpro.phishsimulator.com/api/diagnostics/company-context \
  -H "Authorization: Bearer $TOKEN" | jq
```

Expected output:
```json
{
  "success": true,
  "data": {
    "userId": "...",
    "userRole": "admin",
    "isTechnician": false,
    "technicianCompanyId": null,
    "availableCompanies": [
      {
        "id": "...",
        "name": "Your Company Name",
        "is_active": true
      }
    ],
    "currentCompany": {
      "id": "...",
      "name": "Your Company Name"
    }
  }
}
```

### 3. Test Settings Endpoint
```bash
curl https://fsmpro.phishsimulator.com/api/settings/company \
  -H "Authorization: Bearer $TOKEN" | jq
```

Should return company data without 403 error.

### 4. Check API Logs
```bash
docker logs fsm-api-coolify --tail 50 | grep "Company Middleware"
```

Should show:
```
[Company Middleware] User ID: <uuid>
[Company Middleware] User role check: admin
[Company Middleware] Company query result: 1
[Company Middleware] Set company from admin: { id: '...', name: '...' }
[Company Middleware] Final company context: { id: '...', name: '...' }
```

## Files Changed

1. **api/src/middleware/company.ts** - Improved error handling
2. **api/src/controllers/diagnosticsController.ts** - NEW diagnostic endpoints
3. **api/src/routes/diagnostics.ts** - NEW diagnostic routes
4. **api/src/routes/index.ts** - Added diagnostics routes
5. **database/verify-and-fix.sql** - NEW verification script
6. **FIX_COOLIFY_DATABASE.md** - Detailed fix guide
7. **COOLIFY_403_FIX_SUMMARY.md** - This file

## Deployment Steps

### 1. Pull Latest Changes
```bash
cd /path/to/fsm-pro
git pull origin main
```

### 2. Rebuild API Container
```bash
docker-compose -f docker-compose.coolify.yml build api
docker-compose -f docker-compose.coolify.yml up -d api
```

### 3. Run Database Fix
```bash
docker exec -i fsm-postgres-coolify psql -U fsm_user -d fsm_db < database/verify-and-fix.sql
docker restart fsm-api-coolify
```

### 4. Verify
```bash
curl https://fsmpro.phishsimulator.com/api/diagnostics/health | jq
```

## Prevention for Future Deployments

1. **Always verify database initialization:**
   ```bash
   docker logs fsm-postgres-coolify | grep "database system is ready"
   docker exec -i fsm-postgres-coolify psql -U fsm_user -d fsm_db -c "\dt" | wc -l
   ```

2. **Use the diagnostic endpoint after deployment:**
   ```bash
   curl https://your-domain.com/api/diagnostics/health | jq
   ```

3. **Check for 30+ tables** - If less, database didn't initialize properly

4. **Run setup wizard immediately** after first deployment

## Support

If you still have issues after trying all fixes:

1. Run diagnostics:
   ```bash
   curl https://fsmpro.phishsimulator.com/api/diagnostics/health | jq > diagnostics.json
   ```

2. Collect logs:
   ```bash
   docker logs fsm-postgres-coolify --tail 200 > postgres.log
   docker logs fsm-api-coolify --tail 200 > api.log
   ```

3. Check tables:
   ```bash
   docker exec -i fsm-postgres-coolify psql -U fsm_user -d fsm_db -c "\dt" > tables.txt
   ```

4. Share these files for further assistance

