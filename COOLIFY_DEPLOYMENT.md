# Coolify Deployment Guide

This guide will help you deploy the FSM Pro application to your Coolify VPS.

## 📋 Overview

The Coolify deployment uses custom ports to avoid conflicts with other services:

| Service | External Port | Internal Port | Description |
|---------|--------------|---------------|-------------|
| Admin Frontend | 7000 | 7000 | React Admin Dashboard |
| API Backend | 7001 | 7001 | Node.js/Express API |
| PostgreSQL | 7432 | 5432 | Database |
| Redis | 7379 | 6379 | Cache & Sessions |
| Nginx | 7080 | 80 | Reverse Proxy |

## 🚀 Deployment Steps

### 1. Prepare Your VPS

SSH into your Coolify VPS:
```bash
ssh user@your-vps-ip
```

### 2. Clone the Repository

```bash
cd /path/to/your/apps
git clone https://github.com/Alaswadi/fsm-pro.git
cd fsm-pro
```

### 3. Configure Environment Variables

Copy the Coolify environment file:
```bash
cp .env.coolify .env
```

Edit the `.env` file and update the following variables:
```bash
nano .env
```

**Important variables to update:**
- `DB_PASSWORD`: Change to a strong password
- `JWT_SECRET`: Change to a strong random string
- `CORS_ORIGIN`: Update to your domain (e.g., `http://your-domain.com:7000`)
- `FRONTEND_URL`: Update to your domain (e.g., `http://your-domain.com:7000`)
- `REACT_APP_API_URL`: Update to your domain (e.g., `http://your-domain.com:7001/api`)

**Example configuration:**
```env
# PostgreSQL Database Configuration
DATABASE_URL=postgresql://fsm_user:YOUR_STRONG_PASSWORD@postgres:5432/fsm_db
DB_HOST=postgres
DB_PORT=5432
DB_NAME=fsm_db
DB_USER=fsm_user
DB_PASSWORD=YOUR_STRONG_PASSWORD

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_2024
JWT_EXPIRES_IN=7d

# Redis Configuration
REDIS_URL=redis://redis:6379

# API Configuration
PORT=7001
NODE_ENV=production

# CORS Configuration
CORS_ORIGIN=http://your-domain.com:7000

# Frontend Configuration
FRONTEND_URL=http://your-domain.com:7000
REACT_APP_API_URL=http://your-domain.com:7001/api
```

### 4. Deploy with Docker Compose

Build and start all services:
```bash
docker-compose -f docker-compose.coolify.yml --env-file .env up -d --build
```

### 5. Verify Deployment

Check if all containers are running:
```bash
docker-compose -f docker-compose.coolify.yml ps
```

You should see all services in "Up" state.

Check logs:
```bash
# All services
docker-compose -f docker-compose.coolify.yml logs -f

# Specific service
docker-compose -f docker-compose.coolify.yml logs -f api
docker-compose -f docker-compose.coolify.yml logs -f admin
docker-compose -f docker-compose.coolify.yml logs -f postgres
```

### 6. Access the Application

- **Admin Dashboard**: `http://your-domain.com:7000`
- **API**: `http://your-domain.com:7001/api`
- **API Health Check**: `http://your-domain.com:7001/api/health`
- **Nginx Proxy**: `http://your-domain.com:7080`

### 7. Default Login Credentials

- **Email**: admin@fsm.com
- **Password**: admin123

**⚠️ IMPORTANT**: Change the default admin password immediately after first login!

## 🔧 Management Commands

### Stop Services
```bash
docker-compose -f docker-compose.coolify.yml down
```

### Restart Services
```bash
docker-compose -f docker-compose.coolify.yml restart
```

### Restart Specific Service
```bash
docker-compose -f docker-compose.coolify.yml restart api
docker-compose -f docker-compose.coolify.yml restart admin
```

### View Logs
```bash
# All services
docker-compose -f docker-compose.coolify.yml logs -f

# Specific service
docker-compose -f docker-compose.coolify.yml logs -f api
```

### Update Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.coolify.yml up -d --build
```

### Database Backup
```bash
# Backup database
docker exec fsm-postgres-coolify pg_dump -U fsm_user fsm_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore database
docker exec -i fsm-postgres-coolify psql -U fsm_user fsm_db < backup_file.sql
```

### Clean Up
```bash
# Remove all containers and volumes
docker-compose -f docker-compose.coolify.yml down -v

# Remove unused images
docker image prune -a
```

## 🔒 Security Recommendations

1. **Change Default Passwords**: Update all default passwords in `.env`
2. **Use Strong JWT Secret**: Generate a strong random string for `JWT_SECRET`
3. **Enable Firewall**: Configure UFW or iptables to only allow necessary ports
4. **SSL/TLS**: Set up SSL certificates using Let's Encrypt (see below)
5. **Regular Backups**: Schedule automated database backups
6. **Update Regularly**: Keep Docker images and application code up to date

## 🌐 Setting Up SSL with Let's Encrypt (Optional)

If you want to use HTTPS, you can set up SSL with Let's Encrypt:

1. Install Certbot:
```bash
sudo apt-get update
sudo apt-get install certbot
```

2. Generate SSL certificate:
```bash
sudo certbot certonly --standalone -d your-domain.com
```

3. Update nginx configuration to use SSL (you'll need to modify `nginx/nginx.coolify.conf`)

## 🐛 Troubleshooting

### Container Won't Start
```bash
# Check logs
docker-compose -f docker-compose.coolify.yml logs [service-name]

# Check container status
docker ps -a
```

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose -f docker-compose.coolify.yml ps postgres

# Check PostgreSQL logs
docker-compose -f docker-compose.coolify.yml logs postgres

# Test database connection
docker exec -it fsm-postgres-coolify psql -U fsm_user -d fsm_db
```

### API Not Responding
```bash
# Check API logs
docker-compose -f docker-compose.coolify.yml logs api

# Restart API
docker-compose -f docker-compose.coolify.yml restart api
```

### Port Already in Use
If you get a "port already in use" error, you can either:
1. Stop the service using that port
2. Change the port in `docker-compose.coolify.yml`

## 📞 Support

For issues or questions, please check the main README.md or create an issue on GitHub.

## 📝 Notes

- The database is initialized with the schema from `database/init.sql` on first run
- Uploaded files are stored in `api/uploads` directory
- Redis is used for caching and session management
- All services are connected via a Docker network for internal communication

