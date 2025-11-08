# 🗄️ Database Initialization Guide

## 🎯 Problem
Your production database is **empty** - it has no tables or data. That's why you're getting the error:
```
error: relation "users" does not exist
```

## ✅ Solution
Initialize the database by running the `init.sql` script to create all tables and seed data.

---

## 🚀 Quick Fix (On Production Server)

### Option 1: Using the Initialization Script (Recommended)

**On Linux/Mac:**
```bash
# Make script executable
chmod +x init-production-db.sh

# Run the script
./init-production-db.sh
```

**On Windows:**
```bash
# Just run the batch file
init-production-db.bat
```

### Option 2: Manual Initialization

```bash
# 1. Make sure services are running
docker-compose -f docker-compose.coolify.yml up -d

# 2. Wait for PostgreSQL to be ready (about 10 seconds)
sleep 10

# 3. Initialize the database
docker exec -i fsm-postgres-coolify psql -U fsm_user -d fsm_db < database/init.sql

# 4. Verify tables were created
docker exec -i fsm-postgres-coolify psql -U fsm_user -d fsm_db -c "\dt"

# 5. Check if users were created
docker exec -i fsm-postgres-coolify psql -U fsm_user -d fsm_db -c "SELECT email, role FROM users;"

# 6. Restart API to clear any cached connections
docker-compose -f docker-compose.coolify.yml restart api
```

---

## 📋 Step-by-Step Manual Process

### Step 1: Access Production Server
```bash
ssh your-server
cd /path/to/fsm-pro
```

### Step 2: Check PostgreSQL Container
```bash
docker ps | grep postgres
```

You should see: `fsm-postgres-coolify`

### Step 3: Test Database Connection
```bash
docker exec -i fsm-postgres-coolify psql -U fsm_user -d fsm_db -c "SELECT 1;"
```

Should return: `1`

### Step 4: Check Current Tables
```bash
docker exec -i fsm-postgres-coolify psql -U fsm_user -d fsm_db -c "\dt"
```

If empty, you'll see: `Did not find any relations.`

### Step 5: Run Initialization Script
```bash
docker exec -i fsm-postgres-coolify psql -U fsm_user -d fsm_db < database/init.sql
```

You should see output like:
```
CREATE EXTENSION
CREATE TYPE
CREATE TYPE
CREATE TABLE
CREATE TABLE
...
INSERT 0 1
INSERT 0 1
```

### Step 6: Verify Tables Created
```bash
docker exec -i fsm-postgres-coolify psql -U fsm_user -d fsm_db -c "\dt"
```

Should show many tables including:
- users
- companies
- customers
- jobs
- technicians
- equipment
- etc.

### Step 7: Verify Default Users
```bash
docker exec -i fsm-postgres-coolify psql -U fsm_user -d fsm_db -c "SELECT email, full_name, role FROM users;"
```

Should show:
```
        email         |    full_name     |    role
----------------------+------------------+-------------
 admin@fsm.com        | Admin User       | admin
 mobile.tech@fsm.com  | Mobile Technician| technician
```

### Step 8: Restart API Service
```bash
docker-compose -f docker-compose.coolify.yml restart api
```

Wait about 10 seconds for the API to restart.

### Step 9: Test API
```bash
curl https://fsmpro.phishsimulator.com/api/health
```

Should return:
```json
{"success":true,"message":"FSM API is running","timestamp":"..."}
```

### Step 10: Test Login
```bash
curl -X POST https://fsmpro.phishsimulator.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fsm.com","password":"admin123"}'
```

Should return a token and user data (not an error).

---

## 🔍 Troubleshooting

### Issue: "psql: error: connection to server failed"
**Solution**: PostgreSQL container is not running
```bash
docker-compose -f docker-compose.coolify.yml up -d postgres
sleep 10  # Wait for it to start
```

### Issue: "database 'fsm_db' does not exist"
**Solution**: Create the database first
```bash
docker exec -i fsm-postgres-coolify psql -U fsm_user -c "CREATE DATABASE fsm_db;"
```

### Issue: "role 'fsm_user' does not exist"
**Solution**: Check your .env file for correct credentials
```bash
cat .env | grep DB_
```

### Issue: "permission denied for schema public"
**Solution**: Grant permissions
```bash
docker exec -i fsm-postgres-coolify psql -U postgres -d fsm_db -c "GRANT ALL ON SCHEMA public TO fsm_user;"
```

### Issue: Tables created but no users
**Solution**: Check if init.sql has seed data at the end
```bash
tail -100 database/init.sql
```

Look for INSERT statements. If missing, users weren't seeded.

---

## 📊 What Gets Created

### Tables (20+):
- **users** - User accounts
- **companies** - Company/organization data
- **customers** - Customer information
- **technicians** - Technician profiles
- **jobs** - Service jobs/work orders
- **equipment** - Equipment/devices
- **equipment_intake** - Equipment intake records
- **inventory_items** - Parts/inventory
- **job_assignments** - Job-technician assignments
- **job_notes** - Job notes/comments
- **job_attachments** - File attachments
- **notifications** - System notifications
- **audit_logs** - Activity logs
- And more...

### Default Users:
1. **Admin User**
   - Email: admin@fsm.com
   - Password: admin123
   - Role: admin

2. **Mobile Technician**
   - Email: mobile.tech@fsm.com
   - Password: mobile123
   - Role: technician

### Sample Data:
- Sample company
- Sample customers
- Sample equipment
- Sample jobs

---

## ✅ Verification Checklist

After initialization:

- [ ] PostgreSQL container is running
- [ ] Database `fsm_db` exists
- [ ] All tables created (20+ tables)
- [ ] Default users exist (admin, technician)
- [ ] API service restarted
- [ ] Health endpoint works
- [ ] Login endpoint works (no "relation does not exist" error)
- [ ] Can login to admin app
- [ ] Can login to mobile app

---

## 🎉 After Successful Initialization

1. **Test Admin App**:
   - Go to: https://fsmpro.phishsimulator.com/
   - Login with: admin@fsm.com / admin123
   - Should work without errors!

2. **Test Mobile App**:
   - Open Expo Go
   - Login with: mobile.tech@fsm.com / mobile123
   - Should work without errors!

3. **Change Default Passwords**:
   - Login to admin app
   - Go to Settings → Change password
   - Update both admin and technician passwords

---

## 🔐 Security Note

**⚠️ IMPORTANT**: The default passwords (admin123, mobile123) are for initial setup only. 

**Change them immediately** after first login!

---

## 📞 Need Help?

If you encounter issues:

1. **Check API logs**:
   ```bash
   docker logs fsm-api-coolify --tail 50
   ```

2. **Check PostgreSQL logs**:
   ```bash
   docker logs fsm-postgres-coolify --tail 50
   ```

3. **Restart all services**:
   ```bash
   docker-compose -f docker-compose.coolify.yml restart
   ```

---

**Ready to initialize? Run the script or follow the manual steps above!** 🚀

