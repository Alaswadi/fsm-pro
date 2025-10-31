@echo off
echo Applying inventory equipment type migration...
echo.

REM Run the migration using docker-compose
docker-compose exec -T postgres psql -U fsm_user -d fsm_db < database/migrations/001_update_parts_to_equipment_type.sql

echo.
echo Migration completed!
echo.
echo Verifying migration...
echo.

REM Verify the migration
docker-compose exec -T postgres psql -U fsm_user -d fsm_db -c "SELECT COUNT(*) as total_parts, COUNT(equipment_type_id) as parts_with_equipment_type, COUNT(*) - COUNT(equipment_type_id) as parts_without_equipment_type FROM parts;"

echo.
echo Migration verification complete!
pause

