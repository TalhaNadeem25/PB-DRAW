@echo off
echo Cleaning Vite cache and starting dev server...
echo.

REM Kill any running Node/Vite processes
taskkill /F /IM node.exe >nul 2>&1

REM Wait a moment
timeout /t 2 /nobreak >nul

REM Remove Vite cache
if exist "node_modules\.vite" (
    echo Removing Vite cache...
    rmdir /s /q "node_modules\.vite" >nul 2>&1
)

echo.
echo Starting dev server...
echo.
echo NOTE: If you get EPERM errors, you need to:
echo   1. Pause OneDrive sync (right-click OneDrive icon in system tray)
echo   2. Or move this project outside of OneDrive folder
echo.

npm run dev
