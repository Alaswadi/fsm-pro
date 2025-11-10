#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}FSM Pro - Production Fix Script${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Copying from .env.coolify...${NC}"
    cp .env.coolify .env
    echo -e "${GREEN}✅ .env file created${NC}"
else
    echo -e "${GREEN}✅ .env file exists${NC}"
fi

echo ""
echo -e "${YELLOW}📋 Current Configuration:${NC}"
echo "  - Frontend URL: https://fsmpro.phishsimulator.com"
echo "  - API URL: /api (relative - via nginx proxy)"
echo "  - Database: PostgreSQL (auto-initialized)"
echo ""

echo -e "${YELLOW}🔧 Stopping existing containers...${NC}"
docker-compose -f docker-compose.coolify.yml down

echo ""
echo -e "${YELLOW}🗑️  Removing old images to force rebuild...${NC}"
docker rmi fsm-pro-copy-admin:latest 2>/dev/null || true
docker rmi fsm-pro-copy-nginx:latest 2>/dev/null || true
docker rmi fsm-pro-copy-api:latest 2>/dev/null || true

echo ""
echo -e "${YELLOW}🏗️  Building and starting containers...${NC}"
docker-compose -f docker-compose.coolify.yml up -d --build

echo ""
echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
sleep 10

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}📊 Service Status:${NC}"
docker-compose -f docker-compose.coolify.yml ps

echo ""
echo -e "${YELLOW}🌐 Access your application:${NC}"
echo "  - Frontend: https://fsmpro.phishsimulator.com"
echo "  - API Health: https://fsmpro.phishsimulator.com/api/health"
echo ""
echo -e "${YELLOW}🔑 Default Login:${NC}"
echo "  - Email: admin@fsm.com"
echo "  - Password: admin123"
echo ""
echo -e "${YELLOW}📝 View Logs:${NC}"
echo "  - All logs: docker-compose -f docker-compose.coolify.yml logs -f"
echo "  - API logs: docker-compose -f docker-compose.coolify.yml logs -f api"
echo "  - Frontend logs: docker-compose -f docker-compose.coolify.yml logs -f admin"
echo "  - Nginx logs: docker-compose -f docker-compose.coolify.yml logs -f nginx"
echo ""
echo -e "${GREEN}🎉 Done! Your application should now be working.${NC}"

