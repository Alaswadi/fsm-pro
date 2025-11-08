# FSM Pro - Quick Start Guide for Coolify Deployment

## Current Situation

You have two issues to fix:

1. ❌ **Database tables are missing** - causing "relation does not exist" errors
2. ✅ **Demo data feature is ready** - just needs to be deployed after database is fixed

## Step-by-Step Fix

### Step 1: Fix the Database (REQUIRED FIRST)

SSH into your Coolify VPS and run these commands:

```bash
# Navigate to your project
cd /path/to/fsm-pro

# Stop all services
docker-compose -f docker-compose.coolify.yml down

# Remove the database volume (this will delete all data)
docker volume ls | grep postgres
docker volume rm fsm-pro_postgres_data
# Or whatever the volume name is from the list above

# Start services again - this will trigger init.sql
docker-compose -f docker-compose.coolify.yml up -d

# Wait for database to initialize
sleep 30

# Verify tables were created (should show 30+ tables)
docker exec -i fsm-postgres-coolify psql -U fsm_user -d fsm_db -c "\dt" | wc -l

# Check specific tables
docker exec -i fsm-postgres-coolify psql -U fsm_user -d fsm_db -c "\dt" | grep -E "equipment_types|customers|parts|jobs"
```

**Expected output:**
```
equipment_types
customers
parts
jobs
technicians
companies
users
... (and many more)
```

### Step 2: Deploy Demo Data Feature

On your **local machine**:

```bash
# Make sure you're in the project directory
cd /path/to/fsm-pro

# Check what files changed
git status

# Add all changes
git add .

# Commit with descriptive message
git commit -m "Add demo data option to setup wizard and fix database issues"

# Push to GitHub
git push origin main
```

On your **Coolify VPS**:

```bash
# Navigate to project
cd /path/to/fsm-pro

# Pull latest changes
git pull origin main

# Rebuild containers
docker-compose -f docker-compose.coolify.yml build api admin

# Restart services
docker-compose -f docker-compose.coolify.yml up -d

# Wait for services to start
sleep 10

# Check if services are running
docker-compose -f docker-compose.coolify.yml ps
```

### Step 3: Complete Setup Wizard

1. **Open your browser** and go to:
   ```
   https://fsmpro.phishsimulator.com/setup
   ```

2. **Complete the wizard:**
   - Step 1: Welcome - Click "Get Started"
   - Step 2: Admin User - Enter your details
   - Step 3: Company Profile - Enter company details
   - Step 4: Configuration - **Make sure "Include demo data" is CHECKED**
   - Click "Complete Setup"

3. **Login** with your admin credentials

4. **Verify demo data** was created:
   - Go to Settings → Equipment Types (should show 10 items)
   - Go to Settings → Skills (should show 8 items)
   - Go to Settings → Certifications (should show 5 items)
   - Go to Customers (should show 3 customers)
   - Go to Inventory (should show 8 items)

### Step 4: Verify Everything Works

```bash
# Check API logs for demo data creation
docker logs fsm-api-coolify --tail 100 | grep "Setup"

# Should see:
# [Setup] Demo data requested, seeding...
# [Setup] Created 10 equipment types
# [Setup] Created 8 company skills
# [Setup] Created 5 certifications
# [Setup] Created 3 sample customers
# [Setup] Created 8 inventory items
# [Setup] Demo data seeding completed successfully

# Check for any errors
docker logs fsm-api-coolify --tail 100 | grep -i error

# Test the diagnostic endpoint
curl https://fsmpro.phishsimulator.com/api/diagnostics/health | jq
```

**Expected diagnostic output:**
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
    }
  }
}
```

## What You'll Have After Setup

### With Demo Data (Recommended for First Time)

✅ **10 Equipment Types** - Ready to assign to customer equipment
✅ **8 Skills** - Ready to assign to technicians
✅ **5 Certifications** - Ready to track technician certifications
✅ **3 Sample Customers** - Ready to create jobs for
✅ **8 Inventory Items** - Ready to use in jobs

### Without Demo Data

- Empty database
- You'll need to manually create all equipment types, skills, etc.
- Good for production deployments where you want full control

## Troubleshooting

### Issue: "relation does not exist" errors

**Cause:** Database tables weren't created

**Fix:**
```bash
# Reset database volume (Step 1 above)
docker-compose -f docker-compose.coolify.yml down
docker volume rm fsm-pro_postgres_data
docker-compose -f docker-compose.coolify.yml up -d
```

### Issue: Demo data not appearing

**Cause:** Checkbox wasn't checked or seeding failed

**Fix:**
```bash
# Check logs
docker logs fsm-api-coolify | grep "Demo data"

# If you see "Demo data not requested", you need to:
# 1. Reset database
# 2. Go through setup again
# 3. Make sure checkbox is CHECKED
```

### Issue: Setup wizard not accessible

**Cause:** Setup already completed

**Fix:**
```bash
# Reset database to start over
docker-compose -f docker-compose.coolify.yml down
docker volume rm fsm-pro_postgres_data
docker-compose -f docker-compose.coolify.yml up -d
```

### Issue: Can't login after setup

**Cause:** Wrong credentials or user not created

**Fix:**
```bash
# Check if user was created
docker exec -i fsm-postgres-coolify psql -U fsm_user -d fsm_db -c "SELECT email, role FROM users;"

# If no users, reset and try setup again
```

### Issue: 403 Forbidden errors after login

**Cause:** Company context middleware issue

**Fix:**
```bash
# Check company middleware logs
docker logs fsm-api-coolify | grep "Company Middleware"

# Should see:
# [Company Middleware] Set company from admin: { id: '...', name: '...' }

# If not, check if company exists
docker exec -i fsm-postgres-coolify psql -U fsm_user -d fsm_db -c "SELECT id, name FROM companies;"
```

## Quick Commands Reference

```bash
# View API logs
docker logs fsm-api-coolify --tail 100

# View PostgreSQL logs
docker logs fsm-postgres-coolify --tail 100

# Check running containers
docker-compose -f docker-compose.coolify.yml ps

# Restart API only
docker restart fsm-api-coolify

# Restart all services
docker-compose -f docker-compose.coolify.yml restart

# Check database tables
docker exec -i fsm-postgres-coolify psql -U fsm_user -d fsm_db -c "\dt"

# Count records in a table
docker exec -i fsm-postgres-coolify psql -U fsm_user -d fsm_db -c "SELECT COUNT(*) FROM equipment_types;"

# Check diagnostic endpoint
curl https://fsmpro.phishsimulator.com/api/diagnostics/health | jq
```

## Files Changed in This Update

### Backend
- ✅ `api/src/controllers/setupController.ts` - Demo data seeding
- ✅ `api/src/controllers/diagnosticsController.ts` - NEW diagnostic endpoints
- ✅ `api/src/routes/diagnostics.ts` - NEW diagnostic routes
- ✅ `api/src/routes/index.ts` - Added diagnostics routes
- ✅ `api/src/middleware/company.ts` - Improved error handling

### Frontend
- ✅ `admin-frontend/src/pages/Setup/SetupWizard.tsx` - Added includeDemoData
- ✅ `admin-frontend/src/pages/Setup/ConfigurationStep.tsx` - Added checkbox UI

### Database
- ✅ `database/verify-and-fix.sql` - NEW verification script

### Documentation
- ✅ `DEMO_DATA_FEATURE.md` - Complete feature documentation
- ✅ `SETUP_WITH_DEMO_DATA_SUMMARY.md` - Implementation summary
- ✅ `COOLIFY_403_FIX_SUMMARY.md` - Database fix guide
- ✅ `FIX_COOLIFY_DATABASE.md` - Detailed fix instructions
- ✅ `QUICK_FIX_COMMANDS.sh` - Automated fix script
- ✅ `QUICK_START_GUIDE.md` - This file

## Success Checklist

After completing all steps, you should have:

- ✅ Database with 30+ tables
- ✅ Admin user created
- ✅ Company created
- ✅ Demo data populated (if checkbox was checked)
- ✅ Able to login without errors
- ✅ No 403 errors when accessing pages
- ✅ Equipment Types, Skills, Certifications, Customers, and Inventory visible

## Next Steps After Setup

1. **Explore the system** with demo data
2. **Create your first technician** (Settings → Technicians)
3. **Create a real job** using demo customers and equipment
4. **Customize settings** (Settings → Company Settings)
5. **Delete demo data** when ready (optional)
6. **Add real customers** and equipment

## Support

If you encounter any issues not covered here:

1. Check the logs (commands above)
2. Review the detailed documentation files
3. Use the diagnostic endpoint to check system health
4. Verify all tables exist in the database

Good luck! 🚀

