@echo off
echo =========================================
echo FSM Pro Production Diagnostics
echo =========================================
echo.

echo 1. Checking container status...
echo -----------------------------------
docker-compose -f docker-compose.coolify.yml ps
echo.

echo 2. Checking PostgreSQL status...
echo -----------------------------------
docker-compose -f docker-compose.coolify.yml exec -T postgres pg_isready -U fsm_user -d fsm_db
echo.

echo 3. Checking if tables exist...
echo -----------------------------------
docker-compose -f docker-compose.coolify.yml exec -T postgres psql -U fsm_user -d fsm_db -c "\dt"
echo.

echo 4. Checking companies table...
echo -----------------------------------
docker-compose -f docker-compose.coolify.yml exec -T postgres psql -U fsm_user -d fsm_db -c "SELECT COUNT(*) as company_count FROM companies;"
echo.

echo 5. Checking equipment_types table...
echo -----------------------------------
docker-compose -f docker-compose.coolify.yml exec -T postgres psql -U fsm_user -d fsm_db -c "SELECT COUNT(*) as equipment_types_count FROM equipment_types;"
echo.

echo 6. Testing API health endpoint...
echo -----------------------------------
docker-compose -f docker-compose.coolify.yml exec -T api curl -s http://localhost:7001/api/health
echo.

echo 7. Testing API database health...
echo -----------------------------------
docker-compose -f docker-compose.coolify.yml exec -T api curl -s http://localhost:7001/api/health/db
echo.

echo 8. Checking API logs (last 30 lines)...
echo -----------------------------------
docker-compose -f docker-compose.coolify.yml logs api --tail 30
echo.

echo 9. Checking PostgreSQL logs (last 20 lines)...
echo -----------------------------------
docker-compose -f docker-compose.coolify.yml logs postgres --tail 20
echo.

echo 10. Checking API environment variables...
echo -----------------------------------
docker-compose -f docker-compose.coolify.yml exec -T api env | findstr "DB_ PORT NODE_ENV"
echo.

echo =========================================
echo Diagnostics Complete!
echo =========================================
echo.
echo Next steps:
echo 1. If PostgreSQL is not ready, restart it
echo 2. If tables don't exist, check database/init.sql
echo 3. If API can't connect to DB, check DB_HOST=postgres
echo 4. If API is slow, check API logs for errors
echo.
pause

