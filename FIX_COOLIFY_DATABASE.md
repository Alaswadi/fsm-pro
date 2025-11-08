# Fix Database Issues on Coolify VPS

## Problem
After setup, you can login but get 403 errors when accessing `/api/settings/company` because:
- The database tables weren't created properly
- The `technicians` table is missing or incomplete
- The middleware can't find the company context

## Solution

### Option 1: Quick Fix (Recommended)
Run this command on your Coolify VPS to verify and fix missing tables:

```bash
# SSH into your VPS
ssh your-vps

# Navigate to your project directory
cd /path/to/fsm-pro

# Run the verification and fix script
docker exec -i fsm-postgres-coolify psql -U fsm_user -d fsm_db < database/verify-and-fix.sql

# Restart the API to pick up the changes
docker restart fsm-api-coolify
```

### Option 2: Complete Database Reset
If the quick fix doesn't work, reset the database completely:

```bash
# SSH into your VPS
ssh your-vps

# Navigate to your project directory
cd /path/to/fsm-pro

# Stop all services
docker-compose -f docker-compose.coolify.yml down

# Remove the database volume (THIS WILL DELETE ALL DATA!)
docker volume rm fsm-pro_postgres_data
# Or if the volume has a different name:
docker volume ls | grep postgres
docker volume rm <volume_name>

# Start services again (database will auto-initialize)
docker-compose -f docker-compose.coolify.yml up -d

# Wait for database to initialize (30 seconds)
sleep 30

# Check database logs
docker logs fsm-postgres-coolify --tail 50

# Verify tables were created
docker exec -i fsm-postgres-coolify psql -U fsm_user -d fsm_db -c "\dt"
```

After the reset, you'll need to:
1. Go to `https://fsmpro.phishsimulator.com/setup`
2. Complete the setup wizard again
3. Login with your new credentials

### Option 3: Manual Table Creation
If you want to keep existing data but add missing tables:

```bash
# SSH into your VPS
ssh your-vps

# Navigate to your project directory
cd /path/to/fsm-pro

# Run the full init.sql (it will skip existing tables and show errors, that's OK)
docker exec -i fsm-postgres-coolify psql -U fsm_user -d fsm_db < database/init.sql 2>&1 | grep -v "already exists"

# Restart API
docker restart fsm-api-coolify
```

## Verification

After applying any fix, verify it worked:

```bash
# Check that all tables exist
docker exec -i fsm-postgres-coolify psql -U fsm_user -d fsm_db -c "\dt" | wc -l

# Should show around 30+ tables

# Check users and companies
docker exec -i fsm-postgres-coolify psql -U fsm_user -d fsm_db -c "SELECT email, role FROM users;"
docker exec -i fsm-postgres-coolify psql -U fsm_user -d fsm_db -c "SELECT name FROM companies;"

# Check API logs for company middleware
docker logs fsm-api-coolify --tail 100 | grep "Company Middleware"
```

## Expected Output

After the fix, when you login, you should see in the API logs:
```
[Company Middleware] User ID: <uuid>
[Company Middleware] User role check: admin
[Company Middleware] Company query result: 1
[Company Middleware] Set company from admin: { id: '<uuid>', name: 'Your Company Name' }
[Company Middleware] Final company context: { id: '<uuid>', name: 'Your Company Name' }
```

And the frontend should load without 403 errors.

## Prevention

To prevent this in the future:

1. **Always use fresh database volumes** when deploying
2. **Verify database initialization** after first deployment:
   ```bash
   docker logs fsm-postgres-coolify | grep "database system is ready"
   docker exec -i fsm-postgres-coolify psql -U fsm_user -d fsm_db -c "\dt"
   ```
3. **Check table count** - should be 30+ tables
4. **Run setup wizard** immediately after first deployment

## Troubleshooting

### Still getting 403 errors?

Check the API logs:
```bash
docker logs fsm-api-coolify --tail 200 | grep -A 5 "Company Middleware"
```

Look for:
- "No company context found" - means no companies in database
- "column t.company_id does not exist" - means technicians table is missing
- "Company query result: 0" - means no companies found

### Database connection issues?

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check PostgreSQL logs
docker logs fsm-postgres-coolify --tail 100

# Test connection
docker exec -i fsm-postgres-coolify psql -U fsm_user -d fsm_db -c "SELECT version();"
```

### API not connecting to database?

Check environment variables:
```bash
docker exec fsm-api-coolify env | grep DB_
```

Should show:
```
DB_HOST=postgres
DB_PORT=5432
DB_NAME=fsm_db
DB_USER=fsm_user
DB_PASSWORD=<your_password>
```

## Need More Help?

If none of these solutions work, provide:
1. Output of `docker logs fsm-postgres-coolify --tail 100`
2. Output of `docker logs fsm-api-coolify --tail 100`
3. Output of `docker exec -i fsm-postgres-coolify psql -U fsm_user -d fsm_db -c "\dt"`
4. Screenshot of the browser console errors

