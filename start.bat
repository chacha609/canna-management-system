@echo off
echo 🌿 Cannabis Management System - Starting Application...
echo.

echo 📦 Installing dependencies...
echo Installing backend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install backend dependencies
    pause
    exit /b 1
)

echo Installing frontend dependencies...
cd client
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
)
cd ..

echo.
echo ✅ Dependencies installed successfully!
echo.
echo 🚀 Starting development servers...
echo Backend will run on: http://localhost:3001
echo Frontend will run on: http://localhost:3000
echo.
echo Press Ctrl+C to stop both servers
echo.

call npm run dev