@echo off
setlocal

cd /d "%~dp0"

echo Cleaning up existing backend and frontend processes...
call :kill_port 3000
call :kill_port 5050

echo Starting backend...
start "Ko Backend" cmd /k "cd /d %~dp0 && npm.cmd start"

echo Starting frontend...
start "Ko Frontend" cmd /k "cd /d %~dp0client && set BROWSER=none && npm.cmd start"

echo.
echo Restart requested successfully.
echo Backend should come up on http://localhost:5050
echo Frontend should come up on http://localhost:3000
echo.
exit /b 0

:kill_port
set "TARGET_PORT=%~1"
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":%TARGET_PORT% .*LISTENING"') do (
  if not "%%P"=="0" (
    echo Stopping process %%P on port %TARGET_PORT%...
    taskkill /PID %%P /F >nul 2>&1
  )
)
exit /b 0
