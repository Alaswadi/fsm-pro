#!/bin/bash

# FSM Pro - Coolify Deployment Script
# This script helps deploy the application to Coolify VPS

set -e

echo "============================================================================"
echo "FSM Pro - Coolify Deployment"
echo "============================================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.coolify...${NC}"
    cp .env.coolify .env
    echo -e "${GREEN}✅ .env file created${NC}"
    echo -e "${YELLOW}⚠️  Please edit .env file and update the following:${NC}"
    echo "   - DB_PASSWORD"
    echo "   - JWT_SECRET"
    echo "   - CORS_ORIGIN"
    echo "   - FRONTEND_URL"
    echo "   - REACT_APP_API_URL"
    echo ""
    read -p "Press Enter after you've updated the .env file..."
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker and Docker Compose are installed${NC}"
echo ""

# Ask for deployment action
echo "What would you like to do?"
echo "1) Deploy (first time)"
echo "2) Update (rebuild and restart)"
echo "3) Stop services"
echo "4) View logs"
echo "5) Backup database"
echo "6) Exit"
echo ""
read -p "Enter your choice [1-6]: " choice

case $choice in
    1)
        echo ""
        echo -e "${GREEN}🚀 Starting deployment...${NC}"
        echo ""
        docker-compose -f docker-compose.coolify.yml --env-file .env up -d --build
        echo ""
        echo -e "${GREEN}✅ Deployment complete!${NC}"
        echo ""
        echo "Services are running on:"
        echo "  - Admin Dashboard: http://your-domain.com:7000"
        echo "  - API: http://your-domain.com:7001/api"
        echo "  - Nginx Proxy: http://your-domain.com:7080"
        echo ""
        echo "Default login credentials:"
        echo "  - Email: admin@fsm.com"
        echo "  - Password: admin123"
        echo ""
        echo -e "${YELLOW}⚠️  Remember to change the default password!${NC}"
        ;;
    2)
        echo ""
        echo -e "${GREEN}🔄 Updating application...${NC}"
        echo ""
        git pull origin main
        docker-compose -f docker-compose.coolify.yml --env-file .env up -d --build
        echo ""
        echo -e "${GREEN}✅ Update complete!${NC}"
        ;;
    3)
        echo ""
        echo -e "${YELLOW}🛑 Stopping services...${NC}"
        echo ""
        docker-compose -f docker-compose.coolify.yml down
        echo ""
        echo -e "${GREEN}✅ Services stopped${NC}"
        ;;
    4)
        echo ""
        echo -e "${GREEN}📋 Viewing logs (Press Ctrl+C to exit)...${NC}"
        echo ""
        docker-compose -f docker-compose.coolify.yml logs -f
        ;;
    5)
        echo ""
        echo -e "${GREEN}💾 Creating database backup...${NC}"
        echo ""
        BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
        docker exec fsm-postgres-coolify pg_dump -U fsm_user fsm_db > $BACKUP_FILE
        echo ""
        echo -e "${GREEN}✅ Backup created: $BACKUP_FILE${NC}"
        ;;
    6)
        echo ""
        echo -e "${GREEN}👋 Goodbye!${NC}"
        exit 0
        ;;
    *)
        echo ""
        echo -e "${RED}❌ Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo "============================================================================"

