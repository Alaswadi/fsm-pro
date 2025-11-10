# FSM Pro - Production Fix Guide

## 🔍 Issues Fixed

### 1. **API Connection Error (400 Bad Request & Timeouts)**
**Problem**: Frontend was trying to connect to `https://fsmproapi.phishsimulator.com/api` which doesn't exist or isn't properly configured.

**Solution**: Changed frontend to use relative URL `/api` which works with nginx reverse proxy.

**Files Changed**:
- `admin-frontend/src/services/api.ts` - Changed from `https://fsmproapi.phishsimulator.com/api` to `/api`

### 2. **Nginx Proxy Configuration**
**Problem**: Nginx wasn't properly proxying API requests to the backend.

**Solution**: Updated nginx configuration to:
- Properly proxy `/api/` to `http://api:7001/api/`
- Added timeout settings (60s)
- Fixed CORS headers with `always` flag
- Changed OPTIONS response from 200 to 204 (standard)

**Files Changed**:
- `nginx/nginx.coolify.conf` - Updated proxy_pass and CORS headers

### 3. **Missing Static Files (404 Errors)**
**Problem**: Browser was requesting `favicon.ico`, `logo192.png`, `manifest.json` which didn't exist.

**Solution**: 
- Created `manifest.json`
- Updated nginx to handle missing favicon/logo gracefully (return 204 instead of 404)

**Files Changed**:
- `admin-frontend/public/manifest.json` - Created
- `admin-frontend/nginx.conf` - Added handlers for missing static files

---

## 🚀 Deployment Instructions

### Option 1: Using the Fix Script (Recommended)

**On Linux/Mac:**
```bash
chmod +x fix-production.sh
./fix-production.sh
```

**On Windows:**
```cmd
fix-production.bat
```

### Option 2: Manual Deployment

1. **Copy environment file:**
```bash
cp .env.coolify .env
```

2. **Stop existing containers:**
```bash
docker-compose -f docker-compose.coolify.yml down
```

3. **Remove old images (force rebuild):**
```bash
docker rmi fsm-pro-copy-admin:latest
docker rmi fsm-pro-copy-nginx:latest
docker rmi fsm-pro-copy-api:latest
```

4. **Build and start:**
```bash
docker-compose -f docker-compose.coolify.yml up -d --build
```

5. **Check status:**
```bash
docker-compose -f docker-compose.coolify.yml ps
docker-compose -f docker-compose.coolify.yml logs -f
```

---

## ✅ Verification Steps

### 1. Check Services are Running
```bash
docker-compose -f docker-compose.coolify.yml ps
```

All services should show "Up" status:
- fsm-postgres-coolify
- fsm-redis-coolify
- fsm-api-coolify
- fsm-admin-coolify
- fsm-nginx-coolify

### 2. Test API Health
```bash
curl https://fsmpro.phishsimulator.com/api/health
```

Should return: `{"success":true,"message":"API is healthy"}`

### 3. Test Frontend
Open browser: `https://fsmpro.phishsimulator.com`

**Check browser console (F12):**
- Should see: `API Base URL: /api`
- Should see: `Environment: production`
- Should NOT see any CORS errors
- Should NOT see timeout errors

### 4. Test Login
Try logging in with:
- Email: `admin@fsm.com`
- Password: `admin123`

Should successfully log in and redirect to dashboard.

---

## 🔧 Troubleshooting

### Issue: "Cannot connect to API"

**Check API container logs:**
```bash
docker-compose -f docker-compose.coolify.yml logs api
```

**Look for:**
- ✅ "FSM API Server running on port 7001"
- ✅ "Connected to PostgreSQL database"
- ✅ "Redis connected successfully"

### Issue: "Database connection failed"

**Check database container:**
```bash
docker-compose -f docker-compose.coolify.yml logs postgres
```

**Verify database is initialized:**
```bash
docker exec -it fsm-postgres-coolify psql -U fsm_user -d fsm_db -c "\dt"
```

Should show all tables (users, technicians, customers, etc.)

### Issue: "Nginx 502 Bad Gateway"

**Check if API is running:**
```bash
docker-compose -f docker-compose.coolify.yml ps api
```

**Check nginx logs:**
```bash
docker-compose -f docker-compose.coolify.yml logs nginx
```

**Test API directly (from inside nginx container):**
```bash
docker exec -it fsm-nginx-coolify wget -O- http://api:7001/api/health
```

### Issue: "CORS errors in browser"

**Check nginx configuration:**
```bash
docker exec -it fsm-nginx-coolify cat /etc/nginx/nginx.conf
```

Should include CORS headers with `always` flag.

**Restart nginx:**
```bash
docker-compose -f docker-compose.coolify.yml restart nginx
```

### Issue: "Timeout errors"

**Check API response time:**
```bash
time curl https://fsmpro.phishsimulator.com/api/health
```

**Increase timeout in nginx** (if needed):
Edit `nginx/nginx.coolify.conf` and increase:
```nginx
proxy_read_timeout 120s;
proxy_connect_timeout 120s;
proxy_send_timeout 120s;
```

Then rebuild:
```bash
docker-compose -f docker-compose.coolify.yml up -d --build nginx
```

---

## 📊 Monitoring

### View All Logs
```bash
docker-compose -f docker-compose.coolify.yml logs -f
```

### View Specific Service Logs
```bash
# API logs
docker-compose -f docker-compose.coolify.yml logs -f api

# Frontend logs
docker-compose -f docker-compose.coolify.yml logs -f admin

# Nginx logs
docker-compose -f docker-compose.coolify.yml logs -f nginx

# Database logs
docker-compose -f docker-compose.coolify.yml logs -f postgres
```

### Check Container Resource Usage
```bash
docker stats
```

---

## 🔐 Security Notes

### Change Default Passwords

After deployment, immediately change:

1. **Admin user password** (via UI)
2. **Database password** (in `.env` file)
3. **JWT secret** (in `.env` file)

Then rebuild:
```bash
docker-compose -f docker-compose.coolify.yml up -d --build
```

---

## 📝 Configuration Summary

### Current Setup

| Component | URL/Port | Notes |
|-----------|----------|-------|
| Frontend | https://fsmpro.phishsimulator.com | Served by nginx from admin container |
| API | https://fsmpro.phishsimulator.com/api | Proxied by nginx to api:7001 |
| Database | postgres:5432 (internal) | Not exposed externally |
| Redis | redis:6379 (internal) | Not exposed externally |
| Nginx | Port 7080 → 80 (internal) | Coolify proxies to this |

### Environment Variables

Key variables in `.env`:
```env
NODE_ENV=production
PORT=7001
CORS_ORIGIN=https://fsmpro.phishsimulator.com
FRONTEND_URL=https://fsmpro.phishsimulator.com
REACT_APP_API_URL=/api
```

---

## 🎯 What Changed

### Before (Broken)
- Frontend tried to call: `https://fsmproapi.phishsimulator.com/api`
- Nginx proxy wasn't configured correctly
- Missing static files caused 404 errors
- CORS headers weren't always applied

### After (Fixed)
- Frontend calls: `/api` (relative URL)
- Nginx properly proxies `/api/` to `http://api:7001/api/`
- Static files handled gracefully
- CORS headers always applied
- Increased timeouts for slow operations

---

## 📞 Support

If issues persist:

1. **Check all logs** for error messages
2. **Verify network connectivity** between containers
3. **Ensure Coolify** is properly routing to port 7080
4. **Check DNS** - ensure fsmpro.phishsimulator.com resolves correctly
5. **Verify SSL certificate** is valid

---

## ✨ Next Steps

After successful deployment:

1. ✅ Test all features (login, dashboard, work orders, etc.)
2. ✅ Change default passwords
3. ✅ Set up regular backups
4. ✅ Monitor logs for errors
5. ✅ Test mobile app connectivity

---

**Last Updated**: 2025-11-10
**Version**: 1.0.0

