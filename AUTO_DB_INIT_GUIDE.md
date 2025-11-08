# 🚀 Automatic Database Initialization

## ✅ How It Works

Your PostgreSQL database is configured to **automatically initialize on first startup**!

### Configuration

In `docker-compose.coolify.yml`, line 14:
```yaml
volumes:
  - postgres_data:/var/lib/postgresql/data
  - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
```

**What this does:**
- PostgreSQL automatically runs any `.sql` files in `/docker-entrypoint-initdb.d/` on **first startup only**
- The `init.sql` file is mounted to this directory
- When the database starts for the first time (empty volume), it runs `init.sql`
- Creates all tables, enums, and inserts default users

---

## 🔧 What I Fixed

### 1. Updated Password Hashes

Changed from `Admin@123` and `Tech@123` to your preferred passwords:

| User | Email | Password | Role |
|------|-------|----------|------|
| **Admin** | admin@fsm.com | `admin123` | admin |
| **Mobile Tech** | mobile.tech@fsm.com | `mobile123` | technician |
| Sample Techs | michael.rodriguez@fsm.com, etc. | `mobile123` | technician |

### 2. Generated Correct Bcrypt Hashes

Used bcryptjs (same library as your API) to generate proper password hashes:
- `admin123` → `$2a$10$jtBDOrOS2vRDSKrsqz5kXOJVJMEYq2LGf.jy/fw/tYNtSO94KVwXO`
- `mobile123` → `$2a$10$m1PZUGl580roPfqvDTuu2ecLibc7ciRfWnksWxP32vYumPVvy.hKy`

### 3. Fixed Comment Syntax

Changed the header comment to avoid parsing issues.

---

## 🎯 How to Use

### First Time Setup (Fresh Database)

If you're starting fresh or want to reinitialize:

```bash
# 1. Stop all services
docker-compose -f docker-compose.coolify.yml down

# 2. Remove the old database volume (THIS DELETES ALL DATA!)
docker volume rm fsm-pro-copy_postgres_data

# 3. Start services - database will auto-initialize
docker-compose -f docker-compose.coolify.yml up -d

# 4. Wait for initialization (about 10-15 seconds)
sleep 15

# 5. Check logs to confirm initialization
docker logs fsm-postgres-coolify
```

You should see in the logs:
```
PostgreSQL init process complete; ready for start up.
```

### Verify Initialization

```bash
# Check that tables were created
docker exec -it fsm-postgres-coolify psql -U fsm_user -d fsm_db -c "\dt"

# Check that users were created
docker exec -it fsm-postgres-coolify psql -U fsm_user -d fsm_db -c "SELECT email, full_name, role FROM users;"
```

Expected output:
```
              email              |     full_name      |    role
---------------------------------+--------------------+-------------
 admin@fsm.com                   | Admin User         | admin
 mobile.tech@fsm.com             | Mobile Technician  | technician
 michael.rodriguez@fsm.com       | Michael Rodriguez  | technician
 sarah.chen@fsm.com              | Sarah Chen         | technician
 ...
```

### Test Login

```bash
# Test admin login
curl -X POST https://fsmpro.phishsimulator.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fsm.com","password":"admin123"}'

# Test mobile tech login
curl -X POST https://fsmpro.phishsimulator.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"mobile.tech@fsm.com","password":"mobile123"}'
```

---

## ⚠️ Important Notes

### 1. **Only Runs on First Startup**

The init script **only runs when the database volume is empty**. If you already have data:

**Option A: Keep existing data** - The init script won't run. You'll need to manually add users.

**Option B: Start fresh** - Delete the volume (see commands above) and restart.

### 2. **Production Deployment**

When deploying to production (Coolify):

1. **First deployment**: Database will auto-initialize ✅
2. **Subsequent deployments**: Database keeps existing data ✅
3. **To reset database**: Delete the volume in Coolify dashboard

### 3. **Updating init.sql**

If you modify `database/init.sql`:
- Changes **won't** affect existing databases
- Only affects **new** database installations
- To apply changes to existing DB, you need to:
  - Delete the volume and restart (loses all data), OR
  - Manually run the new SQL commands

---

## 🔄 Production Deployment Steps

### On Coolify (or any Docker host):

1. **Push your code** (including updated `database/init.sql`):
   ```bash
   git add database/init.sql docker-compose.coolify.yml
   git commit -m "Add auto database initialization"
   git push origin main
   ```

2. **On production server**, pull and restart:
   ```bash
   cd /path/to/fsm-pro
   git pull origin main
   
   # If database is empty (first time):
   docker-compose -f docker-compose.coolify.yml up -d
   
   # If you want to reset database (DELETES ALL DATA):
   docker-compose -f docker-compose.coolify.yml down
   docker volume rm fsm-pro_postgres_data  # Adjust volume name
   docker-compose -f docker-compose.coolify.yml up -d
   ```

3. **Wait for initialization**:
   ```bash
   sleep 15
   docker logs fsm-postgres-coolify --tail 50
   ```

4. **Verify**:
   ```bash
   docker exec -it fsm-postgres-coolify psql -U fsm_user -d fsm_db -c "SELECT email, role FROM users;"
   ```

---

## 🎉 Benefits

✅ **No manual SQL execution needed**  
✅ **Consistent database setup across environments**  
✅ **Works on first startup automatically**  
✅ **Proper password hashing with bcryptjs**  
✅ **Default users ready to use**  
✅ **Sample data for testing**  

---

## 📋 Default Credentials

After auto-initialization, you can login with:

### Admin Account
- **URL**: https://fsmpro.phishsimulator.com/
- **Email**: admin@fsm.com
- **Password**: admin123
- **Role**: admin

### Mobile Technician Account
- **Email**: mobile.tech@fsm.com
- **Password**: mobile123
- **Role**: technician

### Sample Technicians (all use password: mobile123)
- michael.rodriguez@fsm.com
- sarah.chen@fsm.com
- david.thompson@fsm.com
- lisa.martinez@fsm.com
- james.wilson@fsm.com

⚠️ **IMPORTANT**: Change these passwords after first login in production!

---

## 🐛 Troubleshooting

### Problem: "relation 'users' does not exist"

**Cause**: Init script didn't run or failed.

**Solution**:
```bash
# Check if volume is empty
docker volume inspect fsm-pro-copy_postgres_data

# Check PostgreSQL logs for errors
docker logs fsm-postgres-coolify

# If init failed, delete volume and restart
docker-compose -f docker-compose.coolify.yml down
docker volume rm fsm-pro-copy_postgres_data
docker-compose -f docker-compose.coolify.yml up -d
```

### Problem: "function uuid_generate_v4() does not exist"

**Cause**: UUID extension not created.

**Solution**: This should be fixed now. The init.sql creates the extension first. If still failing:
```bash
docker exec -it fsm-postgres-coolify psql -U fsm_user -d fsm_db -c 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
```

### Problem: Login fails with "Invalid credentials"

**Cause**: Password hashes might be wrong.

**Solution**: Verify the user exists and hash is correct:
```bash
docker exec -it fsm-postgres-coolify psql -U fsm_user -d fsm_db -c "SELECT email, substring(password_hash, 1, 20) FROM users WHERE email='admin@fsm.com';"
```

Should show: `$2a$10$jtBDOrOS2vRD`

---

## 🔐 Changing Default Passwords

After first login, change passwords through:

1. **Admin Web App**: Settings → Profile → Change Password
2. **API Endpoint**:
   ```bash
   curl -X POST https://fsmpro.phishsimulator.com/api/auth/change-password \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"currentPassword":"admin123","newPassword":"YourNewSecurePassword123!"}'
   ```

---

## ✅ Summary

Your database is now configured to **automatically initialize on first startup** with:

✅ All tables and schemas  
✅ Default admin user (admin@fsm.com / admin123)  
✅ Mobile tech user (mobile.tech@fsm.com / mobile123)  
✅ Sample technician users  
✅ Proper bcrypt password hashing  
✅ Ready to use immediately  

**Just start the containers and everything works!** 🚀

