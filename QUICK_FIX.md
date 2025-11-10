# 🚀 Quick Fix - FSM Pro Production

## The Problem
Your website shows:
- ❌ API Error: Request failed with status code 400
- ❌ API Error: timeout of 10000ms exceeded
- ❌ 404 errors for favicon.ico, logo192.png, manifest.js

## The Solution (3 Steps)

### Step 1: Run the Fix Script

**On your VPS (Linux):**
```bash
cd /path/to/fsm-pro
chmod +x fix-production.sh
./fix-production.sh
```

**On Windows:**
```cmd
cd C:\path\to\fsm-pro
fix-production.bat
```

### Step 2: Wait 30 seconds
The script will:
- ✅ Stop old containers
- ✅ Remove old images
- ✅ Build new containers with fixes
- ✅ Start everything

### Step 3: Test
Open: `https://fsmpro.phishsimulator.com`

Login with:
- Email: `admin@fsm.com`
- Password: `admin123`

---

## What Was Fixed?

1. **API URL**: Changed from `https://fsmproapi.phishsimulator.com/api` to `/api`
2. **Nginx Proxy**: Fixed to properly route API requests (proxy_pass http://api:7001)
3. **Static Files**: Added manifest.json and handled missing files
4. **Timeouts**: Increased from 10s to 60s
5. **CORS**: Fixed headers to always apply

**Note**: The nginx proxy now correctly forwards `/api/` requests to `http://api:7001/api/` (keeping the /api path)

---

## Still Not Working?

### Check Logs:
```bash
docker-compose -f docker-compose.coolify.yml logs -f
```

### Check API Health:
```bash
curl https://fsmpro.phishsimulator.com/api/health
```

Should return: `{"success":true,"message":"API is healthy"}`

### Restart Everything:
```bash
docker-compose -f docker-compose.coolify.yml restart
```

---

## Need More Help?

See: `PRODUCTION_FIX_GUIDE.md` for detailed troubleshooting.

