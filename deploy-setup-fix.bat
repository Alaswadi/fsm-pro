@echo off
echo ============================================================================
echo Deploying Setup Wizard Fix to Coolify
echo ============================================================================
echo.

echo This script will:
echo 1. Show you the changes made
echo 2. Commit the changes to Git
echo 3. Push to GitHub
echo 4. Provide instructions for Coolify deployment
echo.
pause

echo.
echo ============================================================================
echo Step 1: Checking Git Status
echo ============================================================================
echo.
git status

echo.
echo ============================================================================
echo Step 2: Showing Changes
echo ============================================================================
echo.
echo Changes in api/src/controllers/setupController.ts:
echo.
git diff api/src/controllers/setupController.ts

echo.
echo Changes in admin-frontend/src/App.tsx:
echo.
git diff admin-frontend/src/App.tsx

echo.
echo Changes in admin-frontend/src/pages/Setup/SetupWizard.tsx:
echo.
git diff admin-frontend/src/pages/Setup/SetupWizard.tsx

echo.
echo ============================================================================
echo Step 3: Staging Changes
echo ============================================================================
echo.
git add api/src/controllers/setupController.ts
git add admin-frontend/src/App.tsx
git add admin-frontend/src/pages/Setup/SetupWizard.tsx
git add SETUP_WIZARD_FIX.md
git add API_RESPONSE_STRUCTURE.md
git add DATABASE_VERIFICATION.md

echo Changes staged successfully!
echo.

echo ============================================================================
echo Step 4: Committing Changes
echo ============================================================================
echo.
git commit -m "Fix setup wizard: Use companies table for settings instead of non-existent company_settings table

- Fixed setupController to insert timezone, currency, date_format directly into companies table
- Removed attempt to insert into non-existent company_settings table
- Fixed TypeScript type errors in App.tsx and SetupWizard.tsx
- Added comprehensive documentation for the fix"

if errorlevel 1 (
    echo.
    echo ERROR: Commit failed!
    echo.
    pause
    exit /b 1
)

echo.
echo Commit successful!
echo.

echo ============================================================================
echo Step 5: Pushing to GitHub
echo ============================================================================
echo.
git push origin main

if errorlevel 1 (
    echo.
    echo ERROR: Push failed!
    echo Please check your Git credentials and try again.
    echo.
    pause
    exit /b 1
)

echo.
echo Push successful!
echo.

echo ============================================================================
echo Step 6: Coolify Deployment Instructions
echo ============================================================================
echo.
echo Your changes have been pushed to GitHub!
echo.
echo Next steps:
echo.
echo 1. Log into your Coolify dashboard
echo    URL: https://your-coolify-domain.com
echo.
echo 2. Navigate to your FSM Pro project
echo.
echo 3. Redeploy the API service:
echo    - Click on the "api" service
echo    - Click "Redeploy" or "Force Deploy"
echo    - Wait for the build to complete (2-5 minutes)
echo.
echo 4. Optionally redeploy the admin-frontend service:
echo    - Click on the "admin-frontend" service
echo    - Click "Redeploy" or "Force Deploy"
echo    - Wait for the build to complete (2-5 minutes)
echo.
echo 5. Test the setup wizard:
echo    a. Reset database (if needed):
echo       docker exec fsm-postgres-coolify psql -U fsm_user -d fsm_db -c "TRUNCATE users, companies CASCADE;"
echo.
echo    b. Visit: https://fsmpro.phishsimulator.com
echo.
echo    c. Complete the 5-step setup wizard
echo.
echo    d. Verify no errors and successful login
echo.
echo ============================================================================
echo Deployment preparation complete!
echo ============================================================================
echo.
echo See SETUP_WIZARD_FIX.md for detailed information about the fix.
echo.
pause

