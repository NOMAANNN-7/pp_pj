@echo off
setlocal enabledelayedexpansion

title LIFEPOINT - Blood Donation Camp Register & Management System
echo ===============================================================================
echo        LIFEPOINT - BLOOD DONATION CAMP REGISTER & MANAGEMENT PLATFORM          
echo ===============================================================================
echo.

:: 1. Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not found in system PATH.
    echo Please install Python 3.10+ from https://www.python.org/
    pause
    exit /b 1
)

:: 2. Check Node
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not found in system PATH.
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

:: 3. Setup Virtual Environment
if not exist "venv" (
    echo [INFO] Creating Python virtual environment in .\venv ...
    python -m venv venv
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to create virtual environment.
        pause
        exit /b 1
    )
)

:: 4. Install backend dependencies
echo [INFO] Checking and installing Python backend packages...
call .\venv\Scripts\pip.exe install -r backend\requirements.txt --quiet
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install backend dependencies.
    pause
    exit /b 1
)

:: 5. Install frontend dependencies
if not exist "frontend\node_modules" (
    echo [INFO] Installing frontend dependencies with npm...
    cd frontend
    call npm install
    cd ..
)

:: 6. Initialize Database and Seed Demonstration Records if empty
echo [INFO] Initializing SQLite database and verifying sample records...
call .\venv\Scripts\python.exe scripts\seed_data.py

echo.
echo ===============================================================================
echo  [SUCCESS] LIFEPOINT is ready to launch!
echo.
echo  FastAPI Backend API:   http://127.0.0.1:8000
echo  Swagger API Docs:      http://127.0.0.1:8000/docs
echo  Frontend Web App:      http://127.0.0.1:5173
echo  Terminal CLI App:      .\venv\Scripts\python.exe cli\main.py
echo ===============================================================================
echo.

:: 7. Launch Backend and Frontend in separate windows
echo [INFO] Launching FastAPI backend server...
start "LIFEPOINT Backend [FastAPI]" cmd /k ".\venv\Scripts\uvicorn.exe backend.app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [INFO] Launching Vite frontend server...
start "LIFEPOINT Frontend [React+Vite]" cmd /k "cd frontend && npm run dev"

echo [INFO] Applications started in background windows.
echo [INFO] Press any key to open the interactive CLI in this window, or close to keep servers running.
pause

call .\venv\Scripts\python.exe cli\main.py
