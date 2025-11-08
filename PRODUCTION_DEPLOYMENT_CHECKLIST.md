# Production Deployment Checklist

## Issue: Mobile App Gets "Internal Server Error" on Login

### Root Cause
The API health endpoint works (`https://fsmproapi.phishsimulator.com/api/health`) but login times out. This indicates:
- ✅ API server is running
- ✅ HTTPS/SSL is working
- ❌ Database connection is failing
- ❌ Database might not be initialized

## Steps to Fix Production Server

### 1. Check Current Server Status

SSH into your production server and run:

```bash
# Check if containers are running
docker ps

# Check API logs
docker logs fsm-api-coolify

# Check database logs
docker logs fsm-postgres-coolify
```

### 2. Verify Environment Variables

On your production server, check the `.env` file:

```bash
cat .env
```

It should have:

```env
# PostgreSQL Database Configuration
DATABASE_URL=postgresql://fsm_user:YOUR_PASSWORD@postgres:5432/fsm_db
DB_HOST=postgres
DB_PORT=5432
DB_NAME=fsm_db
DB_USER=fsm_user
DB_PASSWORD=YOUR_PASSWORD

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_2024
JWT_EXPIRES_IN=7d

# Redis Configuration
REDIS_URL=redis://redis:6379

# API Configuration
PORT=7001
NODE_ENV=production

# CORS Configuration
CORS_ORIGIN=https://fsmpro.phishsimulator.com

# Frontend Configuration
FRONTEND_URL=https://fsmpro.phishsimulator.com
REACT_APP_API_URL=https://fsmproapi.phishsimulator.com/api
```

### 3. Initialize Database

Run database migrations and seed data:

```bash
# Connect to the database container
docker exec -it fsm-postgres-coolify psql -U fsm_user -d fsm_db

# Check if tables exist
\dt

# If no tables, exit and run migrations
\q

# Run migrations
docker exec -i fsm-postgres-coolify psql -U fsm_user -d fsm_db < database/init.sql
```

### 4. Create Test User

If the database is empty, you need to seed it with test data:

```bash
# From your local machine, copy the init script to server
scp database/init.sql user@your-server:/path/to/fsm-pro/

# On the server, run the init script
docker exec -i fsm-postgres-coolify psql -U fsm_user -d fsm_db < database/init.sql
```

### 5. Restart Services

After making changes:

```bash
# Restart all services
docker-compose -f docker-compose.coolify.yml down
docker-compose -f docker-compose.coolify.yml up -d

# Or restart just the API
docker restart fsm-api-coolify
```

### 6. Test the API

From your local machine:

```bash
# Test health endpoint
curl https://fsmproapi.phishsimulator.com/api/health

# Test login endpoint
curl -X POST https://fsmproapi.phishsimulator.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"mobile.tech@fsm.com","password":"mobile123"}'
```

## Common Issues and Solutions

### Issue 1: Database Connection Refused

**Symptoms:** API logs show "ECONNREFUSED" or "connection refused"

**Solution:**
```bash
# Check if postgres container is running
docker ps | grep postgres

# If not running, start it
docker-compose -f docker-compose.coolify.yml up -d postgres

# Check postgres logs
docker logs fsm-postgres-coolify
```

### Issue 2: Database Tables Don't Exist

**Symptoms:** API logs show "relation does not exist" or "table not found"

**Solution:**
```bash
# Run the database initialization script
docker exec -i fsm-postgres-coolify psql -U fsm_user -d fsm_db < database/init.sql
```

### Issue 3: No Users in Database

**Symptoms:** Login returns "Invalid credentials" instead of timing out

**Solution:**
The database is connected but empty. The init.sql script should create default users.

### Issue 4: CORS Errors

**Symptoms:** Mobile app shows CORS errors in logs

**Solution:**
Update CORS_ORIGIN in .env to include your domains:
```env
CORS_ORIGIN=https://fsmpro.phishsimulator.com
```

## Quick Fix Commands (Run on Production Server)

```bash
# 1. Navigate to project directory
cd /path/to/fsm-pro

# 2. Update environment variables
nano .env
# Update CORS_ORIGIN and FRONTEND_URL to use https://fsmpro.phishsimulator.com

# 3. Restart services
docker-compose -f docker-compose.coolify.yml down
docker-compose -f docker-compose.coolify.yml up -d

# 4. Check if database is initialized
docker exec -it fsm-postgres-coolify psql -U fsm_user -d fsm_db -c "\dt"

# 5. If no tables, initialize database
docker exec -i fsm-postgres-coolify psql -U fsm_user -d fsm_db < database/init.sql

# 6. Check API logs
docker logs -f fsm-api-coolify
```

## Verification Steps

After fixing, verify everything works:

1. **Health Check:**
   ```bash
   curl https://fsmproapi.phishsimulator.com/api/health
   ```
   Should return: `{"success":true,"message":"FSM API is running",...}`

2. **Login Test:**
   ```bash
   curl -X POST https://fsmproapi.phishsimulator.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"mobile.tech@fsm.com","password":"mobile123"}'
   ```
   Should return: `{"success":true,"data":{"token":"...","user":{...}}}`

3. **Mobile App Test:**
   - Open the mobile app
   - Try to login with: mobile.tech@fsm.com / mobile123
   - Should successfully login and show the dashboard

## Environment Variables Reference

### Required for Production

```env
# Database - MUST match your actual database credentials
DATABASE_URL=postgresql://fsm_user:YOUR_PASSWORD@postgres:5432/fsm_db
DB_HOST=postgres
DB_PORT=5432
DB_NAME=fsm_db
DB_USER=fsm_user
DB_PASSWORD=YOUR_PASSWORD

# JWT - MUST be a strong secret
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_2024
JWT_EXPIRES_IN=7d

# Redis
REDIS_URL=redis://redis:6379

# API
PORT=7001
NODE_ENV=production

# CORS - MUST match your actual domains
CORS_ORIGIN=https://fsmpro.phishsimulator.com
FRONTEND_URL=https://fsmpro.phishsimulator.com
REACT_APP_API_URL=https://fsmproapi.phishsimulator.com/api
```

## Default Credentials

After database initialization, these accounts should exist:

**Admin:**
- Email: admin@fsm.com
- Password: admin123

**Technician:**
- Email: mobile.tech@fsm.com
- Password: mobile123

## Need Help?

If you're still having issues:

1. Check API logs: `docker logs fsm-api-coolify`
2. Check database logs: `docker logs fsm-postgres-coolify`
3. Verify database connection: `docker exec -it fsm-postgres-coolify psql -U fsm_user -d fsm_db`
4. Check if tables exist: `\dt` (inside psql)
5. Check if users exist: `SELECT * FROM users;` (inside psql)

