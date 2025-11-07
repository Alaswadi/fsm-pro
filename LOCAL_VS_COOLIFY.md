# Local Development vs Coolify Deployment

This document compares the configuration differences between local development and Coolify deployment.

## 🔧 Port Configuration

| Service | Local Port | Coolify Port | Notes |
|---------|-----------|--------------|-------|
| Admin Frontend | 3000 | 7000 | React development server |
| API Backend | 3001 | 7001 | Express server |
| PostgreSQL | 5432 | 7432 | Database |
| Redis | 6379 | 7379 | Cache & Sessions |
| Nginx | 80 | 7080 | Reverse proxy |

## 📁 File Differences

| File | Local | Coolify | Purpose |
|------|-------|---------|---------|
| Docker Compose | `docker-compose.yml` | `docker-compose.coolify.yml` | Container orchestration |
| Environment | `.env` | `.env.coolify` → `.env` | Environment variables |
| API Dockerfile | `api/Dockerfile` | `api/Dockerfile.coolify` | API container build |
| Admin Dockerfile | `admin-frontend/Dockerfile` | `admin-frontend/Dockerfile.coolify` | Frontend container build |
| Nginx Config | `nginx/nginx.conf` | `nginx/nginx.coolify.conf` | Reverse proxy config |
| Nginx Dockerfile | `nginx/Dockerfile` | `nginx/Dockerfile.coolify` | Nginx container build |

## 🌍 Environment Variables

### Local Development (.env)
```env
# Local URLs
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000
REACT_APP_API_URL=http://localhost:3001/api

# Development mode
NODE_ENV=development

# Local ports
PORT=3001
```

### Coolify Deployment (.env.coolify)
```env
# Production URLs
CORS_ORIGIN=http://your-domain.com:7000
FRONTEND_URL=http://your-domain.com:7000
REACT_APP_API_URL=http://your-domain.com:7001/api

# Production mode
NODE_ENV=production

# Coolify ports
PORT=7001
```

## 🚀 Deployment Commands

### Local Development
```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild
docker-compose up -d --build
```

### Coolify Deployment
```bash
# Start services
docker-compose -f docker-compose.coolify.yml --env-file .env up -d --build

# View logs
docker-compose -f docker-compose.coolify.yml logs -f

# Stop services
docker-compose -f docker-compose.coolify.yml down

# Rebuild
docker-compose -f docker-compose.coolify.yml up -d --build
```

Or use the deployment scripts:
```bash
# Linux/Mac
./deploy-coolify.sh

# Windows
deploy-coolify.bat
```

## 🔄 Switching Between Environments

### From Local to Coolify
1. Ensure local changes are committed
2. Push to GitHub
3. Pull on VPS
4. Use Coolify deployment files
5. Update environment variables

### From Coolify to Local
1. Pull latest changes from GitHub
2. Use local docker-compose.yml
3. Ensure .env has local settings
4. Start with `docker-compose up -d`

## 📊 Container Names

### Local
- `fsm-postgres`
- `fsm-redis`
- `fsm-api`
- `fsm-admin`
- `fsm-nginx`

### Coolify
- `fsm-postgres-coolify`
- `fsm-redis-coolify`
- `fsm-api-coolify`
- `fsm-admin-coolify`
- `fsm-nginx-coolify`

## 🔐 Security Differences

### Local Development
- Development mode enabled
- Relaxed CORS settings
- Default passwords acceptable
- No SSL required
- Debug logging enabled

### Coolify Production
- Production mode enabled
- Strict CORS settings
- Strong passwords required
- SSL recommended
- Production logging
- Firewall configuration needed

## 🗄️ Database Access

### Local
```bash
# Direct access
docker exec -it fsm-postgres psql -U fsm_user -d fsm_db

# Port
localhost:5432
```

### Coolify
```bash
# Direct access
docker exec -it fsm-postgres-coolify psql -U fsm_user -d fsm_db

# Port
your-domain.com:7432
```

## 📝 Development Workflow

### Local Development
1. Make code changes
2. Test locally with `docker-compose up -d`
3. Commit changes
4. Push to GitHub

### Coolify Deployment
1. Pull latest from GitHub on VPS
2. Run deployment script or docker-compose command
3. Verify deployment
4. Monitor logs

## 🎯 When to Use Each

### Use Local Development When:
- Developing new features
- Testing changes
- Debugging issues
- Running tests
- Learning the codebase

### Use Coolify Deployment When:
- Deploying to production
- Sharing with team/clients
- Running in production environment
- Need public access
- Performance testing

## 🔄 Migration Path

### Moving from Local to Coolify

1. **Prepare Environment**
   ```bash
   cp .env.coolify .env
   # Edit .env with production values
   ```

2. **Update URLs**
   - Change localhost to your domain
   - Update ports to 7000 range
   - Update CORS settings

3. **Deploy**
   ```bash
   ./deploy-coolify.sh
   ```

4. **Verify**
   - Check all services are running
   - Test application functionality
   - Verify database connection

### Moving from Coolify to Local

1. **Reset Environment**
   ```bash
   # Restore local .env
   git checkout .env
   ```

2. **Stop Coolify Services** (on VPS)
   ```bash
   docker-compose -f docker-compose.coolify.yml down
   ```

3. **Start Local Services**
   ```bash
   docker-compose up -d
   ```

## 📚 Quick Reference

| Task | Local Command | Coolify Command |
|------|--------------|-----------------|
| Start | `docker-compose up -d` | `./deploy-coolify.sh` |
| Stop | `docker-compose down` | `docker-compose -f docker-compose.coolify.yml down` |
| Logs | `docker-compose logs -f` | `docker-compose -f docker-compose.coolify.yml logs -f` |
| Restart | `docker-compose restart` | `docker-compose -f docker-compose.coolify.yml restart` |
| Rebuild | `docker-compose up -d --build` | `docker-compose -f docker-compose.coolify.yml up -d --build` |

## ✅ Summary

- **Local**: Development environment with standard ports (3000, 3001, etc.)
- **Coolify**: Production environment with custom ports (7000, 7001, etc.)
- Both environments use the same codebase
- Different configuration files for each environment
- Easy switching between environments
- Deployment scripts simplify Coolify deployment

---

**Remember**: Always test changes locally before deploying to Coolify!

