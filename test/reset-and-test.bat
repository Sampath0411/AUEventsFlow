@echo off
echo ====================================
echo    EventFlow Test Launcher
echo ====================================
echo.

REM Clear localStorage by creating a fresh start
echo This will open EventFlow in your browser...
echo.
echo === HOW TO TEST ===
echo.
echo STEP 1: Create an Event
echo   - Click "Organizer" button (top right)
echo   - Login with: admin / admin123
echo   - Click "Create Event"
echo   - Fill in:
echo     * Name: Tech Conference 2026
echo     * Description: A great tech event
echo     * Category: Conference
echo     * Date: Pick a future date
echo     * Location: Mumbai or Online
echo     * Capacity: 100
echo   - Click "Save Event"
echo.
echo STEP 2: Get Share Link
echo   - Go to "My Events" tab
echo   - Click the Share icon (share-alt) next to your event
echo   - Click "Copy" to copy the link
echo.
echo STEP 3: Test Registration
echo   - Open a new Incognito/Private window
echo   - Paste the event link
echo   - Click "Register Now"
echo   - Fill in your details and register
echo.
echo STEP 4: Check Registration
echo   - Go back to organizer dashboard
echo   - Click "Registrations" tab
echo   - You should see the registration!
echo.
echo ===================
echo.

start "" "..\index.html"

echo EventFlow opened!
echo.
echo TIP: Use Ctrl+Shift+N (Chrome) or Ctrl+Shift+P (Firefox)
echo      to open incognito for testing registration flow.
echo.
pause
