# 🚀 FSM Pro - Auto Database Initialization

## ✅ What's Configured

Your PostgreSQL database now **automatically initializes on first startup**!

---

## 🎯 Quick Start

### First Time Setup

```bash
# Start all services
docker-compose -f docker-compose.coolify.yml up -d

# Wait for initialization
sleep 15

# Verify
docker exec -it fsm-postgres-coolify psql -U fsm_user -d fsm_db -c "SELECT email, role FROM users;"
```

**That's it!** Database is ready with default users.

---

## 🔑 Default Credentials

| User | Email | Password | Role |
|------|-------|----------|------|
| **Admin** | admin@fsm.com | admin123 | admin |
| **Mobile Tech** | mobile.tech@fsm.com | mobile123 | technician |

⚠️ **Change these passwords after first login!**

---

## 🔄 Reset Database (Delete All Data)

### Quick Reset

**Linux/Mac:**
```bash
chmod +x RESET_DATABASE.sh
./RESET_DATABASE.sh
```

**Windows:**
```cmd
RESET_DATABASE.bat
```

### Manual Reset

```bash
# Stop services
docker-compose -f docker-compose.coolify.yml down

# Delete database volume (DELETES ALL DATA!)
docker volume rm fsm-pro-copy_postgres_data

# Start services (auto-initializes)
docker-compose -f docker-compose.coolify.yml up -d

# Wait
sleep 15
```

---

## 📋 What Gets Created

### Tables
- ✅ users
- ✅ companies
- ✅ customers
- ✅ technicians
- ✅ jobs
- ✅ job_assignments
- ✅ parts
- ✅ equipment
- ✅ time_entries
- ✅ invoices
- ✅ And many more...

### Default Users
- ✅ 1 Admin user
- ✅ 1 Mobile technician
- ✅ 5 Sample technicians
- ✅ All with proper bcrypt password hashes

### Sample Data
- ✅ Default company
- ✅ Skills and certifications
- ✅ Technician profiles

---

## 🔧 How It Works

1. **PostgreSQL Container** starts for the first time
2. **Detects empty database** volume
3. **Automatically runs** `/docker-entrypoint-initdb.d/init.sql`
4. **Creates all tables** and inserts default data
5. **Ready to use!**

### Configuration

In `docker-compose.coolify.yml`:
```yaml
postgres:
  volumes:
    - postgres_data:/var/lib/postgresql/data
    - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
```

---

## ✅ Verification

### Check Tables
```bash
docker exec -it fsm-postgres-coolify psql -U fsm_user -d fsm_db -c "\dt"
```

### Check Users
```bash
docker exec -it fsm-postgres-coolify psql -U fsm_user -d fsm_db -c "SELECT email, full_name, role FROM users;"
```

### Test Login
```bash
curl -X POST https://fsmpro.phishsimulator.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fsm.com","password":"admin123"}'
```

Should return a token and user data!

---

## 🚀 Production Deployment

### On Coolify or Production Server

1. **Push code**:
   ```bash
   git add .
   git commit -m "Add auto database initialization"
   git push origin main
   ```

2. **On server** (first time):
   ```bash
   cd /path/to/fsm-pro
   git pull
   docker-compose -f docker-compose.coolify.yml up -d
   ```

3. **Database auto-initializes** on first startup!

4. **Verify**:
   ```bash
   docker logs fsm-postgres-coolify --tail 50
   ```

---

## ⚠️ Important Notes

### 1. Only Runs Once
- Init script **only runs when database volume is empty**
- Subsequent restarts **keep existing data**
- To reset: delete volume and restart

### 2. Updating init.sql
- Changes only affect **new installations**
- Existing databases **not affected**
- To apply changes: reset database (loses data)

### 3. Production Safety
- ✅ First deployment: auto-initializes
- ✅ Updates: keeps existing data
- ✅ Reset: requires manual volume deletion

---

## 🐛 Troubleshooting

### "relation 'users' does not exist"

**Solution**: Init script didn't run. Reset database:
```bash
./RESET_DATABASE.sh  # or .bat on Windows
```

### "function uuid_generate_v4() does not exist"

**Solution**: UUID extension not created. This is fixed in the updated init.sql. Reset database.

### Login fails

**Solution**: Check password hash:
```bash
docker exec -it fsm-postgres-coolify psql -U fsm_user -d fsm_db \
  -c "SELECT email, substring(password_hash, 1, 20) FROM users WHERE email='admin@fsm.com';"
```

Should show: `$2a$10$jtBDOrOS2vRD`

---

## 📚 Documentation

| File | Description |
|------|-------------|
| **`AUTO_DB_INIT_GUIDE.md`** | Complete guide with all details |
| `README_AUTO_INIT.md` | This quick reference |
| `RESET_DATABASE.sh` | Reset script (Linux/Mac) |
| `RESET_DATABASE.bat` | Reset script (Windows) |
| `database/init.sql` | Database initialization script |

---

## 🎉 Benefits

✅ **Zero manual setup** - Just start containers  
✅ **Consistent** - Same setup every time  
✅ **Proper passwords** - Bcrypt hashed correctly  
✅ **Ready to use** - Default users included  
✅ **Production ready** - Works on any Docker host  
✅ **Sample data** - Test immediately  

---

## 🔐 Security Reminder

After first login:

1. **Change default passwords** immediately
2. **Delete sample users** if not needed
3. **Review user permissions**
4. **Enable 2FA** if available
5. **Use strong passwords** in production

---

## 📞 Next Steps

1. ✅ Start containers → Database auto-initializes
2. ✅ Login to admin app: https://fsmpro.phishsimulator.com/
3. ✅ Test mobile app with Expo Go
4. ✅ Change default passwords
5. ✅ Start using the system!

---

**Everything is configured! Just start the containers and you're ready to go!** 🚀

