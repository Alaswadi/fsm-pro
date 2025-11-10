#!/bin/bash

echo "========================================="
echo "FSM Pro Production Diagnostics"
echo "========================================="
echo ""

# Check if docker-compose file exists
if [ ! -f "docker-compose.coolify.yml" ]; then
    echo "❌ docker-compose.coolify.yml not found!"
    exit 1
fi

echo "1. Checking container status..."
echo "-----------------------------------"
docker-compose -f docker-compose.coolify.yml ps
echo ""

echo "2. Checking PostgreSQL status..."
echo "-----------------------------------"
docker-compose -f docker-compose.coolify.yml exec -T postgres pg_isready -U fsm_user -d fsm_db
if [ $? -eq 0 ]; then
    echo "✅ PostgreSQL is ready"
else
    echo "❌ PostgreSQL is NOT ready"
fi
echo ""

echo "3. Checking if tables exist..."
echo "-----------------------------------"
docker-compose -f docker-compose.coolify.yml exec -T postgres psql -U fsm_user -d fsm_db -c "\dt" 2>&1
echo ""

echo "4. Checking companies table..."
echo "-----------------------------------"
docker-compose -f docker-compose.coolify.yml exec -T postgres psql -U fsm_user -d fsm_db -c "SELECT COUNT(*) as company_count FROM companies;" 2>&1
echo ""

echo "5. Checking equipment_types table..."
echo "-----------------------------------"
docker-compose -f docker-compose.coolify.yml exec -T postgres psql -U fsm_user -d fsm_db -c "SELECT COUNT(*) as equipment_types_count FROM equipment_types;" 2>&1
echo ""

echo "6. Testing API health endpoint..."
echo "-----------------------------------"
API_HEALTH=$(docker-compose -f docker-compose.coolify.yml exec -T api curl -s http://localhost:7001/api/health 2>&1)
echo "$API_HEALTH"
if echo "$API_HEALTH" | grep -q "success"; then
    echo "✅ API health check passed"
else
    echo "❌ API health check failed"
fi
echo ""

echo "7. Testing API database health..."
echo "-----------------------------------"
DB_HEALTH=$(docker-compose -f docker-compose.coolify.yml exec -T api curl -s http://localhost:7001/api/health/db 2>&1)
echo "$DB_HEALTH"
if echo "$DB_HEALTH" | grep -q "success"; then
    echo "✅ API database connection OK"
else
    echo "❌ API database connection FAILED"
fi
echo ""

echo "8. Checking API logs (last 30 lines)..."
echo "-----------------------------------"
docker-compose -f docker-compose.coolify.yml logs api --tail 30
echo ""

echo "9. Checking PostgreSQL logs (last 20 lines)..."
echo "-----------------------------------"
docker-compose -f docker-compose.coolify.yml logs postgres --tail 20
echo ""

echo "10. Checking API environment variables..."
echo "-----------------------------------"
docker-compose -f docker-compose.coolify.yml exec -T api env | grep -E "DB_|PORT|NODE_ENV" | sort
echo ""

echo "========================================="
echo "Diagnostics Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. If PostgreSQL is not ready, restart it: docker-compose -f docker-compose.coolify.yml restart postgres"
echo "2. If tables don't exist, check database/init.sql was copied correctly"
echo "3. If API can't connect to DB, check DB_HOST=postgres in API environment"
echo "4. If API is slow, check API logs for database query errors"
echo ""

