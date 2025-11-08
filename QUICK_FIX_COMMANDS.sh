#!/bin/bash

# Quick Fix Commands for Coolify VPS 403 Error
# Run this script on your VPS to diagnose and fix the database issue

set -e

echo "========================================="
echo "FSM Pro - Database Fix Script"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
CONTAINER_NAME="fsm-postgres-coolify"
DB_USER="fsm_user"
DB_NAME="fsm_db"
API_CONTAINER="fsm-api-coolify"

echo -e "${YELLOW}Step 1: Checking if containers are running...${NC}"
if ! docker ps | grep -q $CONTAINER_NAME; then
    echo -e "${RED}Error: PostgreSQL container is not running${NC}"
    echo "Start it with: docker-compose -f docker-compose.coolify.yml up -d"
    exit 1
fi
echo -e "${GREEN}✓ PostgreSQL container is running${NC}"
echo ""

echo -e "${YELLOW}Step 2: Testing database connection...${NC}"
if docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Database connection successful${NC}"
else
    echo -e "${RED}Error: Cannot connect to database${NC}"
    exit 1
fi
echo ""

echo -e "${YELLOW}Step 3: Checking table count...${NC}"
TABLE_COUNT=$(docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')
echo "Found $TABLE_COUNT tables"

if [ "$TABLE_COUNT" -lt 20 ]; then
    echo -e "${RED}Warning: Expected 30+ tables, found only $TABLE_COUNT${NC}"
    echo "Database schema is incomplete"
else
    echo -e "${GREEN}✓ Table count looks good${NC}"
fi
echo ""

echo -e "${YELLOW}Step 4: Checking for critical tables...${NC}"
MISSING_TABLES=""

for table in users companies technicians company_skills company_certifications customers equipment_types parts jobs; do
    if docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$table');" | grep -q "t"; then
        echo -e "${GREEN}✓ $table${NC}"
    else
        echo -e "${RED}✗ $table (MISSING)${NC}"
        MISSING_TABLES="$MISSING_TABLES $table"
    fi
done
echo ""

if [ -n "$MISSING_TABLES" ]; then
    echo -e "${RED}Missing tables:$MISSING_TABLES${NC}"
    echo ""
    echo -e "${YELLOW}Step 5: Running database fix script...${NC}"
    
    if [ -f "database/verify-and-fix.sql" ]; then
        docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME < database/verify-and-fix.sql
        echo -e "${GREEN}✓ Fix script executed${NC}"
    else
        echo -e "${YELLOW}Warning: verify-and-fix.sql not found, running full init.sql${NC}"
        if [ -f "database/init.sql" ]; then
            docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME < database/init.sql 2>&1 | grep -v "already exists" || true
            echo -e "${GREEN}✓ Init script executed${NC}"
        else
            echo -e "${RED}Error: No SQL files found${NC}"
            exit 1
        fi
    fi
else
    echo -e "${GREEN}✓ All critical tables exist${NC}"
fi
echo ""

echo -e "${YELLOW}Step 6: Checking data...${NC}"
USER_COUNT=$(docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM users;" | tr -d ' ')
COMPANY_COUNT=$(docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM companies;" | tr -d ' ')
TECH_COUNT=$(docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM technicians;" | tr -d ' ')

echo "Users: $USER_COUNT"
echo "Companies: $COMPANY_COUNT"
echo "Technicians: $TECH_COUNT"
echo ""

if [ "$USER_COUNT" -eq 0 ] || [ "$COMPANY_COUNT" -eq 0 ]; then
    echo -e "${YELLOW}Warning: No users or companies found${NC}"
    echo "You need to complete the setup wizard at /setup"
fi
echo ""

echo -e "${YELLOW}Step 7: Restarting API container...${NC}"
docker restart $API_CONTAINER
echo -e "${GREEN}✓ API container restarted${NC}"
echo ""

echo -e "${YELLOW}Step 8: Waiting for API to start...${NC}"
sleep 5
echo -e "${GREEN}✓ API should be ready${NC}"
echo ""

echo "========================================="
echo -e "${GREEN}Fix Complete!${NC}"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Test the diagnostic endpoint:"
echo "   curl https://fsmpro.phishsimulator.com/api/diagnostics/health | jq"
echo ""
echo "2. If you see 'status: healthy', try logging in"
echo ""
echo "3. If you still have issues, check the logs:"
echo "   docker logs $API_CONTAINER --tail 100"
echo ""
echo "4. If no users exist, go to the setup wizard:"
echo "   https://fsmpro.phishsimulator.com/setup"
echo ""

