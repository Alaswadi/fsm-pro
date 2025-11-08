# ⚡ Quick Fix Guide - Production API Connection

## 🎯 The Problem
- Admin app at `https://fsmpro.phishsimulator.com/` was connecting to `localhost:3001`
- Mobile app couldn't connect to production API

## ✅ The Solution
Updated both apps to use `https://fsmpro.phishsimulator.com/api` through nginx reverse proxy.

---

## 🚀 Quick Steps to Fix Production

### 1️⃣ SSH to Production Server
```bash
ssh your-server
cd /path/to/fsm-pro
```

### 2️⃣ Pull Latest Code
```bash
git pull origin main
```

### 3️⃣ Update Environment File
```bash
cp .env.coolify .env
```

Or manually edit `.env`:
```env
CORS_ORIGIN=https://fsmpro.phishsimulator.com
FRONTEND_URL=https://fsmpro.phishsimulator.com
REACT_APP_API_URL=/api
```

### 4️⃣ Rebuild & Restart
```bash
docker-compose -f docker-compose.coolify.yml down
docker-compose -f docker-compose.coolify.yml up -d --build
```

### 5️⃣ Initialize Database (IMPORTANT!)
```bash
# Wait for PostgreSQL to start
sleep 10

# Initialize database tables and seed data
docker exec -i fsm-postgres-coolify psql -U fsm_user -d fsm_db < database/init.sql

# Restart API
docker-compose -f docker-compose.coolify.yml restart api
```

Or use the automated script:
```bash
# Linux/Mac
chmod +x init-production-db.sh
./init-production-db.sh

# Windows
init-production-db.bat
```

### 6️⃣ Wait 1-2 Minutes
Services need time to start up.

### 7️⃣ Test Admin App
1. Open `https://fsmpro.phishsimulator.com/`
2. Press F12 → Network tab
3. Login with: admin@fsm.com / admin123
4. Verify API calls go to `https://fsmpro.phishsimulator.com/api/...`

### 8️⃣ Test Mobile App
1. Restart Expo: `cd FSMProMobile && npm start`
2. Scan QR code with Expo Go
3. Login with: mobile.tech@fsm.com / mobile123

---

## 📊 What Changed

| Component | Before | After |
|-----------|--------|-------|
| Admin API URL | `http://localhost:3001/api` | `https://fsmpro.phishsimulator.com/api` |
| Mobile API URL | `https://fsmproapi.phishsimulator.com/api` | `https://fsmpro.phishsimulator.com/api` |
| Architecture | Direct API calls | Through nginx reverse proxy |

---

## 🔍 Quick Verification

### Admin App Working?
```bash
# Should see API calls to fsmpro.phishsimulator.com, NOT localhost
# Open browser console → Network tab → Try login
```

### Mobile App Working?
```bash
# Should see: API Base URL: https://fsmpro.phishsimulator.com/api
# In Expo Go console when app starts
```

### Services Running?
```bash
docker ps
# Should see 5 containers: postgres, redis, api, admin, nginx
```

---

## 🆘 Quick Troubleshooting

### Admin still shows localhost?
```bash
# Hard refresh browser
Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

# Or clear cache and reload
```

### Mobile app still fails?
```bash
# Clear Expo cache
cd FSMProMobile
npm start -- --clear
```

### Services not starting?
```bash
# Check logs
docker logs fsm-api-coolify
docker logs fsm-admin-coolify

# Restart
docker-compose -f docker-compose.coolify.yml restart
```

---

## 📚 Detailed Documentation

- **Full Guide**: See `UPDATE_PRODUCTION.md`
- **Summary**: See `PRODUCTION_API_FIX_SUMMARY.md`
- **Build Instructions**: See `FSMProMobile/BUILD_INSTRUCTIONS.md`

---

## ✅ Success Checklist

- [ ] Production server updated
- [ ] Services rebuilt and running
- [ ] Admin app connects to production API
- [ ] Mobile app connects to production API
- [ ] Can login to both apps
- [ ] No localhost references in Network tab

---

## 🎉 After Success

1. Test all features in admin app
2. Test all features in mobile app with Expo Go
3. Rebuild production APK if needed:
   ```bash
   cd FSMProMobile
   eas build --platform android --profile production
   ```

---

**Need Help?** Check the detailed guides or contact support.

