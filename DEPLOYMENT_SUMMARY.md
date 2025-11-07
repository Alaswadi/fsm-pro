# Coolify Deployment - Summary

## ✅ Files Created

The following files have been created for your Coolify deployment:

### Configuration Files
1. **docker-compose.coolify.yml** - Docker Compose configuration with custom ports
2. **.env.coolify** - Environment variables template for Coolify
3. **admin-frontend/Dockerfile.coolify** - Dockerfile for admin frontend (port 7000)
4. **nginx/Dockerfile.coolify** - Dockerfile for Nginx with Coolify config
5. **nginx/nginx.coolify.conf** - Nginx configuration for Coolify ports

### Deployment Scripts
6. **deploy-coolify.sh** - Linux/Mac deployment script
7. **deploy-coolify.bat** - Windows deployment script

### Documentation
8. **COOLIFY_DEPLOYMENT.md** - Complete deployment guide
9. **COOLIFY_QUICK_REFERENCE.md** - Quick reference for common commands
10. **DEPLOYMENT_SUMMARY.md** - This file

## 🔧 Port Configuration

Your Coolify deployment uses the following ports:

| Service | External Port | Internal Port | Access |
|---------|--------------|---------------|--------|
| **Admin Frontend** | **7000** | 7000 | Public |
| **API Backend** | **7001** | 7001 | Public |
| PostgreSQL | 7432 | 5432 | Internal |
| Redis | 7379 | 6379 | Internal |
| Nginx Proxy | 7080 | 80 | Public |

### Why These Ports?

- **7000-7001**: Main application ports (admin and API) as requested
- **7432**: PostgreSQL external port (7000 range + 432 from default 5432)
- **7379**: Redis external port (7000 range + 379 from default 6379)
- **7080**: Nginx proxy port (7000 range + 80)

## 📋 Next Steps

### 1. Before Deployment

1. **Copy environment file:**
   ```bash
   cp .env.coolify .env
   ```

2. **Edit `.env` file and update:**
   - `DB_PASSWORD` - Use a strong password
   - `JWT_SECRET` - Use a strong random string
   - `CORS_ORIGIN` - Your domain (e.g., `http://your-domain.com:7000`)
   - `FRONTEND_URL` - Your domain (e.g., `http://your-domain.com:7000`)
   - `REACT_APP_API_URL` - Your API URL (e.g., `http://your-domain.com:7001/api`)

### 2. Deploy to Coolify

**Option A: Using Deployment Script (Recommended)**
```bash
# Linux/Mac
chmod +x deploy-coolify.sh
./deploy-coolify.sh

# Windows
deploy-coolify.bat
```

**Option B: Manual Deployment**
```bash
docker-compose -f docker-compose.coolify.yml --env-file .env up -d --build
```

### 3. Verify Deployment

```bash
# Check if all services are running
docker-compose -f docker-compose.coolify.yml ps

# View logs
docker-compose -f docker-compose.coolify.yml logs -f
```

### 4. Access Your Application

- **Admin Dashboard**: `http://your-domain.com:7000`
- **API**: `http://your-domain.com:7001/api`
- **API Health Check**: `http://your-domain.com:7001/api/health`

### 5. Login and Change Password

Use default credentials:
- **Email**: admin@fsm.com
- **Password**: admin123

⚠️ **IMPORTANT**: Change the default password immediately!

## 🔒 Security Checklist

- [ ] Changed `DB_PASSWORD` in `.env`
- [ ] Changed `JWT_SECRET` in `.env`
- [ ] Updated domain URLs in `.env`
- [ ] Changed default admin password after first login
- [ ] Configured firewall to only allow necessary ports
- [ ] Set up SSL/TLS certificates (optional but recommended)
- [ ] Scheduled regular database backups

## 📚 Documentation

- **Full Deployment Guide**: See [COOLIFY_DEPLOYMENT.md](COOLIFY_DEPLOYMENT.md)
- **Quick Reference**: See [COOLIFY_QUICK_REFERENCE.md](COOLIFY_QUICK_REFERENCE.md)
- **Main README**: See [README.md](README.md)

## 🆘 Need Help?

### Common Issues

1. **Port already in use**: Change the port in `docker-compose.coolify.yml`
2. **Database connection error**: Check PostgreSQL logs and credentials
3. **API not responding**: Check API logs and ensure all environment variables are set

### Useful Commands

```bash
# View all logs
docker-compose -f docker-compose.coolify.yml logs -f

# Restart a service
docker-compose -f docker-compose.coolify.yml restart api

# Stop all services
docker-compose -f docker-compose.coolify.yml down

# Backup database
docker exec fsm-postgres-coolify pg_dump -U fsm_user fsm_db > backup.sql
```

## 📝 Notes

- Your original `.env` file remains unchanged
- The original `docker-compose.yml` is still available for local development
- All Coolify-specific files have `.coolify` in their name for easy identification
- The deployment uses production mode (`NODE_ENV=production`)

## 🎉 You're Ready!

Your FSM Pro application is now ready to be deployed to Coolify with custom ports in the 7000 range!

Good luck with your deployment! 🚀

