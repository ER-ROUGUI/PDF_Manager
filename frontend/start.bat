@echo off
REM Script to easily launch the Local PDF Manager application on Windows

echo ===========================================
echo  Starting Local PDF Manager
echo ===========================================
echo.

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: npm is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if node_modules exists, if not run npm install
IF NOT EXIST "node_modules\" (
    echo First time setup: Installing dependencies...
    npm install
    echo.
)

echo Running Vite development server...
echo.

REM Start the dev server and automatically open the default browser
npm run dev -- --open
