# Coolify Deployment - Quick Reference

## 🚀 Quick Start

### Using Deployment Script (Recommended)

**Linux/Mac:**
```bash
chmod +x deploy-coolify.sh
./deploy-coolify.sh
```

**Windows:**
```bash
deploy-coolify.bat
```

### Manual Deployment

```bash
# 1. Copy environment file
cp .env.coolify .env

# 2. Edit .env and update your domain and passwords
nano .env

# 3. Deploy
docker-compose -f docker-compose.coolify.yml --env-file .env up -d --build
```

## 📊 Port Configuration

| Service | Port | URL |
|---------|------|-----|
| Admin Frontend | 7000 | http://your-domain.com:7000 |
| API Backend | 7001 | http://your-domain.com:7001/api |
| PostgreSQL | 7432 | Internal only |
| Redis | 7379 | Internal only |
| Nginx Proxy | 7080 | http://your-domain.com:7080 |

## 🔑 Environment Variables to Update

Edit `.env` file and change these values:

```env
# Change these!
DB_PASSWORD=YOUR_STRONG_PASSWORD_HERE
JWT_SECRET=YOUR_RANDOM_SECRET_KEY_HERE

# Update with your domain
CORS_ORIGIN=http://your-domain.com:7000
FRONTEND_URL=http://your-domain.com:7000
REACT_APP_API_URL=http://your-domain.com:7001/api
```

## 📝 Common Commands

```bash
# Deploy/Start
docker-compose -f docker-compose.coolify.yml up -d --build

# Stop
docker-compose -f docker-compose.coolify.yml down

# Restart
docker-compose -f docker-compose.coolify.yml restart

# View logs
docker-compose -f docker-compose.coolify.yml logs -f

# View specific service logs
docker-compose -f docker-compose.coolify.yml logs -f api
docker-compose -f docker-compose.coolify.yml logs -f admin

# Check status
docker-compose -f docker-compose.coolify.yml ps

# Update application
git pull origin main
docker-compose -f docker-compose.coolify.yml up -d --build

# Backup database
docker exec fsm-postgres-coolify pg_dump -U fsm_user fsm_db > backup.sql

# Restore database
docker exec -i fsm-postgres-coolify psql -U fsm_user fsm_db < backup.sql
```

## 🔐 Default Credentials

- **Email:** admin@fsm.com
- **Password:** admin123

⚠️ **Change immediately after first login!**

## 🐛 Troubleshooting

### Check if services are running
```bash
docker-compose -f docker-compose.coolify.yml ps
```

### View all logs
```bash
docker-compose -f docker-compose.coolify.yml logs -f
```

### Restart a specific service
```bash
docker-compose -f docker-compose.coolify.yml restart api
```

### Access database directly
```bash
docker exec -it fsm-postgres-coolify psql -U fsm_user -d fsm_db
```

### Check API health
```bash
curl http://your-domain.com:7001/api/health
```

## 📚 Full Documentation

See [COOLIFY_DEPLOYMENT.md](COOLIFY_DEPLOYMENT.md) for complete deployment guide.

