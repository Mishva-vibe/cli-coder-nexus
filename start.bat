@echo off
title APEX // Coder Hub
echo.
echo  ==============================
echo   APEX // Coder Hub - Starting
echo  ==============================
echo.
cd /d "%~dp0"

:: Ask user for project folder
echo  Select your project folder
echo  (A folder dialog will open - pick your project, or Cancel for current dir)
echo.

:: Use PowerShell to open folder picker
for /f "delims=" %%I in ('powershell -NoProfile -Command "Add-Type -AssemblyName System.Windows.Forms; $f = New-Object System.Windows.Forms.FolderBrowserDialog; $f.Description = 'Select Project Folder'; $f.ShowNewFolderButton = $true; if ($f.ShowDialog() -eq 'OK') { $f.SelectedPath } else { '' }"') do set "PICKED=%%I"

if "%PICKED%"=="" (
    echo  Using current directory: %CD%
    set "TARGET_DIR=%CD%"
) else (
    echo  Using: %PICKED%
    set "TARGET_DIR=%PICKED%"
)

echo.
:: Stop only a previous APEX server (whatever holds port 3777).
:: NOTE: do NOT use "taskkill /F /IM node.exe" here - that kills every unrelated
:: Node process on the machine (editor helpers, other CLIs/agents, terminals).
set "OLD_PID="
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3777" ^| findstr "LISTENING"') do set "OLD_PID=%%a"
if not "%OLD_PID%"=="" (
    echo  Stopping previous server on port 3777 ^(PID %OLD_PID%^)...
    taskkill /F /PID %OLD_PID% >nul 2>&1
    timeout /t 2 /nobreak >nul
)

:: Start the server with the selected directory
echo  Starting server...
if exist "%~dp0node_modules\.bin\tsx.cmd" (
    start "APEX Server" /B cmd /c call "%~dp0node_modules\.bin\tsx.cmd" src\server.ts
) else (
    echo  Local tsx not found - run "npm install" for the fastest start.
    start "APEX Server" /B cmd /c npx --yes tsx src\server.ts
)

:: Wait for server to be ready, then open browser
echo  Waiting for server...
set "WAIT_COUNT=0"
:waitloop
timeout /t 1 /nobreak >nul
set /a WAIT_COUNT+=1
if %WAIT_COUNT% GEQ 30 (
    echo  Server did not start within 30 seconds
    goto openanyway
)
curl -s -o nul -w "%%{http_code}" http://localhost:3777/api/about 2>nul | findstr /r /c:"^200$" >nul
if not errorlevel 1 goto serverready
goto waitloop

:serverready
echo  Server ready - opening browser

:: Open browser using start command
start http://localhost:3777
echo.
echo  APEX // Coder Hub is running at http://localhost:3777
echo  Free CLIs need NO API keys: opencode / freebuff / openclaude.
echo  Press Ctrl+C to stop the server
echo.
pause
goto :eof

:openanyway
echo  Opening the browser anyway - the server may still be starting.
start http://localhost:3777
echo.
echo  If the page does not connect, check http://localhost:3777 in a moment,
echo  or run "npm run dev" in this folder to see the server log.
echo.
pause
goto :eof
