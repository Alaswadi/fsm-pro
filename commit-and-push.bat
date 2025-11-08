@echo off
echo ============================================================================
echo Committing and Pushing Setup Wizard Fix + Complete Database Schema
echo ============================================================================
echo.

echo Adding files...
git add api/src/controllers/setupController.ts
git add database/init.sql
git add SETUP_WIZARD_FIX.md
git add DATABASE_TABLES_VERIFICATION.md
git add API_RESPONSE_STRUCTURE.md
git add DATABASE_VERIFICATION.md
git add deploy-setup-fix.bat
git add commit-and-push.bat

echo.
echo Committing...
git commit -m "Fix setup wizard and add all missing database tables to init.sql

- Fixed setupController to insert timezone, currency, date_format directly into companies table
- Added 7 missing tables to init.sql (workshop and inventory tracking tables)
- All 25 tables now included in init.sql for fresh Coolify deployments
- Added equipment_repair_status enum type
- Added all indexes, triggers, and foreign keys for new tables
- Database schema is now complete and ready for Coolify deployment"

echo.
echo Pushing to GitHub...
git push origin main

echo.
echo ============================================================================
echo Done! Now redeploy on Coolify:
echo ============================================================================
echo.
echo 1. Go to your Coolify dashboard
echo 2. Find the FSM Pro API service
echo 3. Click "Redeploy" or "Force Deploy"
echo 4. Wait for build to complete (2-5 minutes)
echo 5. Test the setup wizard at https://fsmpro.phishsimulator.com
echo.
echo NOTE: If you want to test with a fresh database:
echo   - Stop all containers
echo   - Remove the postgres_data volume
echo   - Start containers again
echo   - All 25 tables will be created automatically
echo.
pause

