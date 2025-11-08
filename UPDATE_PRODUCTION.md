# 🚀 Update Production Server - Fix API Connection

## Problem
The admin frontend at `https://fsmpro.phishsimulator.com/` was connecting to `localhost:3001` instead of the production API.

## Solution
We've updated the code to use relative URLs (`/api`) which will work through the nginx reverse proxy.

## 📋 Steps to Update Production

### 1. Access Your Production Server

SSH into your production server where the app is deployed.

### 2. Navigate to Project Directory

```bash
cd /path/to/fsm-pro
```

### 3. Pull Latest Changes

```bash
git pull origin main
```

### 4. Update Environment Variables

Copy the updated environment file:

```bash
cp .env.coolify .env
```

Or manually edit `.env` to ensure these values are set:

```env
# CORS Configuration
CORS_ORIGIN=https://fsmpro.phishsimulator.com

# Frontend Configuration
FRONTEND_URL=https://fsmpro.phishsimulator.com
REACT_APP_API_URL=/api
MOBILE_APP_URL=exp://fsmpro.phishsimulator.com:8081
```

### 5. Rebuild and Restart Services

```bash
docker-compose -f docker-compose.coolify.yml down
docker-compose -f docker-compose.coolify.yml up -d --build
```

This will:
- Stop all services
- Rebuild the admin frontend with the new code
- Rebuild the API with updated CORS settings
- Start all services

### 6. Wait for Services to Start

Wait about 1-2 minutes for all services to fully start.

### 7. Verify the Fix

#### Test Admin Frontend:
1. Open `https://fsmpro.phishsimulator.com/`
2. Open browser console (F12) → Network tab
3. Try to login
4. Check that API calls go to `https://fsmpro.phishsimulator.com/api/...` (not localhost)

#### Test Mobile App:
1. Restart Expo Go on your phone
2. Try to login with:
   - Email: mobile.tech@fsm.com
   - Password: mobile123
3. Should now connect successfully!

## 🔍 What Changed

### Admin Frontend (`admin-frontend/src/services/api.ts`)
```typescript
// Before:
const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// After:
const baseURL = process.env.NODE_ENV === 'production' 
  ? '/api'  // Relative URL - works with nginx reverse proxy
  : (process.env.REACT_APP_API_URL || 'http://localhost:3001/api');
```

### Mobile App (`FSMProMobile/src/services/api.ts`)
```typescript
// Now uses the same domain as admin app:
this.baseURL = 'https://fsmpro.phishsimulator.com/api';
```

### Environment Variables (`.env.coolify`)
```env
CORS_ORIGIN=https://fsmpro.phishsimulator.com
FRONTEND_URL=https://fsmpro.phishsimulator.com
REACT_APP_API_URL=/api
```

## 🎯 Expected Results

After updating:

✅ **Admin app** at `https://fsmpro.phishsimulator.com/` → calls `https://fsmpro.phishsimulator.com/api/...`

✅ **Mobile app** → calls `https://fsmpro.phishsimulator.com/api/...`

✅ **Both use the same API** through nginx reverse proxy

✅ **Database works** because it's already connected to the production API

## 🔧 Troubleshooting

### If admin app still shows localhost in Network tab:

1. **Hard refresh** the browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. **Clear browser cache** and reload
3. **Check if rebuild completed**: `docker logs fsm-admin-coolify`

### If mobile app still gets errors:

1. **Restart Expo development server**:
   ```bash
   cd FSMProMobile
   npm start
   ```
2. **Clear Expo cache**:
   ```bash
   npm start -- --clear
   ```
3. **Restart Expo Go** app on your phone

### If you get CORS errors:

Check that CORS_ORIGIN is set correctly in `.env`:
```bash
cat .env | grep CORS_ORIGIN
```

Should show: `CORS_ORIGIN=https://fsmpro.phishsimulator.com`

If not, update it and restart:
```bash
docker-compose -f docker-compose.coolify.yml restart api
```

## 📞 Need Help?

If you encounter any issues:

1. **Check API logs**:
   ```bash
   docker logs fsm-api-coolify
   ```

2. **Check admin logs**:
   ```bash
   docker logs fsm-admin-coolify
   ```

3. **Check all services are running**:
   ```bash
   docker ps
   ```

   You should see:
   - fsm-postgres-coolify
   - fsm-redis-coolify
   - fsm-api-coolify
   - fsm-admin-coolify
   - fsm-nginx-coolify

## ✅ Success Checklist

- [ ] Pulled latest code from git
- [ ] Updated `.env` file with correct domains
- [ ] Rebuilt and restarted all services
- [ ] Admin app loads at `https://fsmpro.phishsimulator.com/`
- [ ] Admin app calls API at `https://fsmpro.phishsimulator.com/api/...` (check Network tab)
- [ ] Can login to admin app successfully
- [ ] Mobile app connects to `https://fsmpro.phishsimulator.com/api`
- [ ] Can login to mobile app successfully

## 🎉 After Success

Once everything works:

1. **Test the mobile app** thoroughly with Expo Go
2. **Rebuild the production APK** if needed:
   ```bash
   cd FSMProMobile
   eas build --platform android --profile production
   ```
3. **Install the new APK** on your Android device
4. **Verify everything works** in the production APK

---

**Note**: The changes we made ensure that both the admin web app and mobile app use the same production API endpoint through the nginx reverse proxy. This is the correct architecture for production deployment.

