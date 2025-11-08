# 🔧 Production API Connection Fix - Summary

## 📊 Issue Identified

Your admin app at `https://fsmpro.phishsimulator.com/` was working, but it was connecting to `localhost:3001` instead of the production API. This meant:

- ✅ Admin app worked (because you had localhost API running)
- ❌ Mobile app failed (because it tried to connect to production API which wasn't properly configured)

## 🎯 Root Cause

The admin frontend was hardcoded to use `http://localhost:3001/api` as the default API URL, and the environment variable wasn't being set correctly in production.

## ✅ Solution Implemented

### 1. **Admin Frontend - Use Relative URLs**

**File**: `admin-frontend/src/services/api.ts`

**Change**: Made the admin app use relative URLs (`/api`) in production, which automatically uses the same domain through nginx reverse proxy.

```typescript
// Before:
const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// After:
const baseURL = process.env.NODE_ENV === 'production' 
  ? '/api'  // Relative URL - works with nginx reverse proxy
  : (process.env.REACT_APP_API_URL || 'http://localhost:3001/api');
```

**Why this works**:
- In production: Uses `/api` → nginx routes to production API
- In development: Uses `http://localhost:3001/api` → connects to local API

### 2. **Mobile App - Use Same Domain as Admin**

**File**: `FSMProMobile/src/services/api.ts`

**Change**: Updated mobile app to use the same domain as the admin app.

```typescript
// Before:
this.baseURL = 'https://fsmproapi.phishsimulator.com/api';

// After:
this.baseURL = 'https://fsmpro.phishsimulator.com/api';
```

**Why this works**:
- Both admin and mobile now use `https://fsmpro.phishsimulator.com/api`
- Nginx reverse proxy routes `/api` requests to the backend API
- Single domain, single SSL certificate, simpler configuration

### 3. **Environment Variables - Updated for Production**

**File**: `.env.coolify`

**Changes**:
```env
# Before:
CORS_ORIGIN=http://your-domain.com:7000
FRONTEND_URL=http://your-domain.com:7000
REACT_APP_API_URL=http://your-domain.com:7001/api

# After:
CORS_ORIGIN=https://fsmpro.phishsimulator.com
FRONTEND_URL=https://fsmpro.phishsimulator.com
REACT_APP_API_URL=/api
```

## 🏗️ Architecture Overview

### Before (Broken):
```
Admin App (https://fsmpro.phishsimulator.com)
    ↓
    → localhost:3001/api ❌ (Wrong!)

Mobile App
    ↓
    → https://fsmproapi.phishsimulator.com/api ❌ (Not configured!)
```

### After (Fixed):
```
Admin App (https://fsmpro.phishsimulator.com)
    ↓
    → /api (relative)
    ↓
    → Nginx Reverse Proxy
    ↓
    → Backend API (port 7001) ✅

Mobile App
    ↓
    → https://fsmpro.phishsimulator.com/api
    ↓
    → Nginx Reverse Proxy
    ↓
    → Backend API (port 7001) ✅
```

## 📁 Files Modified

1. ✅ `admin-frontend/src/services/api.ts` - Use relative URLs in production
2. ✅ `FSMProMobile/src/services/api.ts` - Use same domain as admin
3. ✅ `.env.coolify` - Updated production environment variables
4. ✅ `FSMProMobile/BUILD_INSTRUCTIONS.md` - Updated documentation

## 📝 Files Created

1. ✅ `UPDATE_PRODUCTION.md` - Step-by-step guide to update production server
2. ✅ `PRODUCTION_API_FIX_SUMMARY.md` - This summary document
3. ✅ `test-api-endpoints.html` - Browser-based API testing tool

## 🚀 Next Steps for You

### Step 1: Update Production Server

Follow the instructions in `UPDATE_PRODUCTION.md`:

1. SSH into your production server
2. Pull latest code: `git pull origin main`
3. Update `.env` file with correct domains
4. Rebuild services: `docker-compose -f docker-compose.coolify.yml up -d --build`

### Step 2: Test Admin App

1. Open `https://fsmpro.phishsimulator.com/`
2. Open browser console (F12) → Network tab
3. Login and verify API calls go to `https://fsmpro.phishsimulator.com/api/...`

### Step 3: Test Mobile App with Expo Go

1. Restart Expo development server:
   ```bash
   cd FSMProMobile
   npm start
   ```
2. Scan QR code with Expo Go
3. Try to login with:
   - Email: mobile.tech@fsm.com
   - Password: mobile123

### Step 4: Rebuild Production APK (Optional)

If you want to distribute a new APK:

```bash
cd FSMProMobile
eas build --platform android --profile production
```

## 🎯 Expected Results

After updating production:

| Component | URL | Status |
|-----------|-----|--------|
| Admin Web App | `https://fsmpro.phishsimulator.com/` | ✅ Works |
| Admin API Calls | `https://fsmpro.phishsimulator.com/api/...` | ✅ Works |
| Mobile App (Expo Go) | `https://fsmpro.phishsimulator.com/api/...` | ✅ Works |
| Mobile App (APK) | `https://fsmpro.phishsimulator.com/api/...` | ✅ Works |

## 🔍 How to Verify

### Verify Admin App:
1. Open `https://fsmpro.phishsimulator.com/`
2. Press F12 → Network tab
3. Login
4. Look for API calls - should see `https://fsmpro.phishsimulator.com/api/auth/login`
5. Should NOT see `localhost:3001`

### Verify Mobile App:
1. Open Expo Go
2. Check console output - should see: `API Base URL: https://fsmpro.phishsimulator.com/api`
3. Try to login
4. Should succeed without "Internal Server Error"

## 🎉 Benefits of This Architecture

1. **Single Domain**: Both admin and mobile use `https://fsmpro.phishsimulator.com`
2. **Single SSL Certificate**: Only need SSL for one domain
3. **Nginx Reverse Proxy**: Handles routing, CORS, and load balancing
4. **Simpler Configuration**: No need for separate API domain
5. **Better Security**: All traffic goes through nginx
6. **Easier Debugging**: All requests visible in browser Network tab

## 📞 Troubleshooting

If you encounter issues after updating:

1. **Check services are running**:
   ```bash
   docker ps
   ```

2. **Check API logs**:
   ```bash
   docker logs fsm-api-coolify
   ```

3. **Check admin logs**:
   ```bash
   docker logs fsm-admin-coolify
   ```

4. **Restart services**:
   ```bash
   docker-compose -f docker-compose.coolify.yml restart
   ```

5. **Hard refresh browser**: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

## ✅ Checklist

- [ ] Code changes committed to git
- [ ] Production server updated with latest code
- [ ] `.env` file updated with correct domains
- [ ] Services rebuilt and restarted
- [ ] Admin app tested and working
- [ ] Mobile app tested with Expo Go
- [ ] Production APK rebuilt (if needed)

---

**Summary**: The fix ensures both admin and mobile apps use the same production API endpoint (`https://fsmpro.phishsimulator.com/api`) through the nginx reverse proxy, eliminating the localhost connection issue.

