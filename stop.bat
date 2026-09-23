@echo off
title SWITCHYARD Coder Hub - Stopping
echo.
echo  Stopping SWITCHYARD Coder Hub...
echo.

:: Find and kill the node process running on port 3777
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3777 ^| findstr LISTENING') do (
    echo  Found process %%a on port 3777
    tasklist /FI "PID eq %%a" /FI "IMAGENAME eq node.exe" | findstr "node.exe" >nul && (
        echo  Killing node process %%a
        taskkill /F /PID %%a >nul 2>&1
    ) || (
        echo  Process %%a is not node.exe, skipping
    )
)

:: Fallback: kill node process running tsx/src/server.ts specifically
for /f "tokens=2" %%a in ('tasklist /FI "IMAGENAME eq node.exe" /FO CSV /NH ^| findstr /i "tsx.*server"') do (
    set "PID=%%~a"
    echo  Killing node process %PID% (tsx server)
    taskkill /F /PID %PID% >nul 2>&1
)

echo  Done.
timeout /t 1 >nul
