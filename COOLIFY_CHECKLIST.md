# Coolify Deployment Checklist

Use this checklist to ensure a smooth deployment to your Coolify VPS.

## 📋 Pre-Deployment Checklist

### 1. VPS Preparation
- [ ] SSH access to Coolify VPS is working
- [ ] Docker is installed on VPS
- [ ] Docker Compose is installed on VPS
- [ ] Git is installed on VPS
- [ ] Ports 7000, 7001, 7080, 7379, 7432 are available (not in use)

### 2. Repository Setup
- [ ] Code is pushed to GitHub repository
- [ ] Repository is accessible from VPS
- [ ] SSH keys are configured (if using private repo)

### 3. Environment Configuration
- [ ] Copied `.env.coolify` to `.env`
- [ ] Updated `DB_PASSWORD` with strong password
- [ ] Updated `JWT_SECRET` with strong random string
- [ ] Updated `CORS_ORIGIN` with your domain
- [ ] Updated `FRONTEND_URL` with your domain
- [ ] Updated `REACT_APP_API_URL` with your API URL
- [ ] Reviewed all other environment variables

### 4. Domain/DNS Setup (Optional)
- [ ] Domain name is configured
- [ ] DNS A record points to VPS IP
- [ ] DNS propagation is complete

## 🚀 Deployment Steps

### Step 1: Connect to VPS
```bash
ssh user@your-vps-ip
```
- [ ] Successfully connected to VPS

### Step 2: Clone Repository
```bash
cd /path/to/your/apps
git clone https://github.com/Alaswadi/fsm-pro.git
cd fsm-pro
```
- [ ] Repository cloned successfully
- [ ] Changed to project directory

### Step 3: Configure Environment
```bash
cp .env.coolify .env
nano .env  # or vim .env
```
- [ ] Environment file created
- [ ] All variables updated correctly
- [ ] File saved

### Step 4: Deploy Application
```bash
# Option A: Using script
chmod +x deploy-coolify.sh
./deploy-coolify.sh

# Option B: Manual
docker-compose -f docker-compose.coolify.yml --env-file .env up -d --build
```
- [ ] Deployment command executed
- [ ] No errors during build
- [ ] All containers started successfully

### Step 5: Verify Deployment
```bash
# Check container status
docker-compose -f docker-compose.coolify.yml ps

# Check logs
docker-compose -f docker-compose.coolify.yml logs -f
```
- [ ] All 5 containers are running (postgres, redis, api, admin, nginx)
- [ ] No error messages in logs
- [ ] API shows "Server running" message
- [ ] Database connected successfully

### Step 6: Test Access
- [ ] Admin Dashboard accessible at `http://your-domain.com:7000`
- [ ] API health check works: `http://your-domain.com:7001/api/health`
- [ ] Can login with default credentials (admin@fsm.com / admin123)
- [ ] Dashboard loads correctly
- [ ] No console errors in browser

### Step 7: Security Setup
- [ ] Changed default admin password
- [ ] Verified new password works
- [ ] Logged out and logged back in successfully

## 🔒 Post-Deployment Security

### Firewall Configuration
```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow application ports
sudo ufw allow 7000/tcp
sudo ufw allow 7001/tcp
sudo ufw allow 7080/tcp

# Enable firewall
sudo ufw enable
```
- [ ] Firewall configured
- [ ] Required ports allowed
- [ ] Firewall enabled

### SSL/TLS Setup (Optional but Recommended)
- [ ] SSL certificate obtained (Let's Encrypt)
- [ ] Nginx configured for HTTPS
- [ ] HTTP to HTTPS redirect configured
- [ ] Certificate auto-renewal configured

### Backup Configuration
```bash
# Create backup script
nano /path/to/backup-fsm.sh
```
- [ ] Backup script created
- [ ] Cron job scheduled for daily backups
- [ ] Backup location configured
- [ ] Test backup performed successfully

## 📊 Monitoring Setup

### Health Checks
- [ ] API health endpoint responding: `/api/health`
- [ ] Database connection verified
- [ ] Redis connection verified

### Logging
- [ ] Log rotation configured
- [ ] Log monitoring set up (optional)
- [ ] Error alerting configured (optional)

## 🧪 Testing Checklist

### Functional Testing
- [ ] User login works
- [ ] User logout works
- [ ] Dashboard displays data
- [ ] Can create new work order
- [ ] Can view work orders
- [ ] Can update work order
- [ ] Can delete work order
- [ ] File uploads work
- [ ] API responses are correct

### Performance Testing
- [ ] Page load times acceptable
- [ ] API response times acceptable
- [ ] Database queries performing well
- [ ] No memory leaks observed

## 📝 Documentation

- [ ] Deployment details documented
- [ ] Credentials stored securely
- [ ] Team members notified
- [ ] Access instructions shared

## 🆘 Troubleshooting Reference

### If containers won't start:
```bash
docker-compose -f docker-compose.coolify.yml logs [service-name]
```

### If database connection fails:
```bash
docker-compose -f docker-compose.coolify.yml logs postgres
docker exec -it fsm-postgres-coolify psql -U fsm_user -d fsm_db
```

### If API is not responding:
```bash
docker-compose -f docker-compose.coolify.yml logs api
docker-compose -f docker-compose.coolify.yml restart api
```

### If port is already in use:
```bash
# Check what's using the port
sudo lsof -i :7000
sudo lsof -i :7001

# Kill the process or change port in docker-compose.coolify.yml
```

## ✅ Deployment Complete!

Once all items are checked:
- [ ] All checklist items completed
- [ ] Application is running smoothly
- [ ] Team has access
- [ ] Documentation is updated
- [ ] Backup system is in place

## 📞 Support

If you encounter issues:
1. Check the logs: `docker-compose -f docker-compose.coolify.yml logs -f`
2. Review [COOLIFY_DEPLOYMENT.md](COOLIFY_DEPLOYMENT.md)
3. Check [COOLIFY_QUICK_REFERENCE.md](COOLIFY_QUICK_REFERENCE.md)
4. Create an issue on GitHub

---

**Deployment Date:** _________________

**Deployed By:** _________________

**VPS IP:** _________________

**Domain:** _________________

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

