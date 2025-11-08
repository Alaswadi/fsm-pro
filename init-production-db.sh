#!/bin/bash

# Initialize Production Database for FSM Pro
# This script creates all tables and inserts seed data

echo "=========================================="
echo "FSM Pro - Production Database Initialization"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if docker is running
if ! docker ps &> /dev/null; then
    echo -e "${RED}❌ Error: Docker is not running${NC}"
    exit 1
fi

# Check if postgres container is running
if ! docker ps | grep -q "fsm-postgres-coolify"; then
    echo -e "${RED}❌ Error: PostgreSQL container (fsm-postgres-coolify) is not running${NC}"
    echo "Please start the services first:"
    echo "  docker-compose -f docker-compose.coolify.yml up -d"
    exit 1
fi

echo -e "${GREEN}✅ PostgreSQL container is running${NC}"
echo ""

# Get database credentials from .env file
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${RED}❌ Error: .env file not found${NC}"
    exit 1
fi

# Set default values if not in .env
DB_NAME=${DB_NAME:-fsm_db}
DB_USER=${DB_USER:-fsm_user}
DB_PASSWORD=${DB_PASSWORD:-fsm_password}

echo "Database Configuration:"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo ""

# Step 1: Check if database is accessible
echo -e "${YELLOW}Step 1: Checking database connection...${NC}"
if docker exec -i fsm-postgres-coolify psql -U $DB_USER -d $DB_NAME -c "SELECT 1;" &> /dev/null; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
else
    echo -e "${RED}❌ Error: Cannot connect to database${NC}"
    exit 1
fi
echo ""

# Step 2: Check if tables already exist
echo -e "${YELLOW}Step 2: Checking if tables exist...${NC}"
TABLE_COUNT=$(docker exec -i fsm-postgres-coolify psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')

if [ "$TABLE_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Warning: Database already has $TABLE_COUNT tables${NC}"
    echo ""
    read -p "Do you want to DROP all tables and recreate them? (yes/no): " -r
    echo ""
    if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        echo -e "${YELLOW}Dropping all tables...${NC}"
        docker exec -i fsm-postgres-coolify psql -U $DB_USER -d $DB_NAME -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
        echo -e "${GREEN}✅ All tables dropped${NC}"
    else
        echo -e "${YELLOW}Skipping table creation. Will only insert seed data if tables exist.${NC}"
    fi
else
    echo -e "${GREEN}✅ Database is empty, ready for initialization${NC}"
fi
echo ""

# Step 3: Run init.sql to create tables
echo -e "${YELLOW}Step 3: Creating database tables...${NC}"
if docker exec -i fsm-postgres-coolify psql -U $DB_USER -d $DB_NAME < database/init.sql; then
    echo -e "${GREEN}✅ Database tables created successfully${NC}"
else
    echo -e "${RED}❌ Error: Failed to create tables${NC}"
    exit 1
fi
echo ""

# Step 4: Verify tables were created
echo -e "${YELLOW}Step 4: Verifying tables...${NC}"
TABLE_COUNT=$(docker exec -i fsm-postgres-coolify psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')
echo -e "${GREEN}✅ Created $TABLE_COUNT tables${NC}"
echo ""

# Step 5: List all tables
echo -e "${YELLOW}Step 5: Listing all tables...${NC}"
docker exec -i fsm-postgres-coolify psql -U $DB_USER -d $DB_NAME -c "\dt"
echo ""

# Step 6: Check if default users exist
echo -e "${YELLOW}Step 6: Checking for default users...${NC}"
USER_COUNT=$(docker exec -i fsm-postgres-coolify psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM users;" | tr -d ' ')

if [ "$USER_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ Found $USER_COUNT users in database${NC}"
else
    echo -e "${YELLOW}⚠️  No users found. Default users should have been created by init.sql${NC}"
    echo -e "${YELLOW}Please check the init.sql file for seed data.${NC}"
fi
echo ""

# Step 7: Display default credentials
echo "=========================================="
echo -e "${GREEN}✅ Database Initialization Complete!${NC}"
echo "=========================================="
echo ""
echo "Default Login Credentials:"
echo ""
echo "Admin Account:"
echo "  Email: admin@fsm.com"
echo "  Password: admin123"
echo ""
echo "Technician Account:"
echo "  Email: mobile.tech@fsm.com"
echo "  Password: mobile123"
echo ""
echo "⚠️  IMPORTANT: Change these passwords after first login!"
echo ""
echo "Next Steps:"
echo "1. Restart the API service:"
echo "   docker-compose -f docker-compose.coolify.yml restart api"
echo ""
echo "2. Test the API:"
echo "   curl https://fsmpro.phishsimulator.com/api/health"
echo ""
echo "3. Try logging in:"
echo "   - Admin: https://fsmpro.phishsimulator.com/"
echo "   - Mobile: Use Expo Go app"
echo ""
echo "=========================================="

