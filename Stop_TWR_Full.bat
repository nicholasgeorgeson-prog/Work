@echo off
title Stop TechWriterReview
echo.
echo  ============================================
echo   Stopping TechWriterReview - Full Cleanup
echo  ============================================
echo.

:: Method 1: Kill by window title
echo  [1] Killing by window title...
taskkill /f /fi "WINDOWTITLE eq TechWriterReview*" 2>nul

:: Method 2: Kill ALL python.exe processes (most reliable)
echo  [2] Killing all Python processes...
taskkill /f /im python.exe 2>nul
if %errorlevel%==0 (
    echo      Killed python.exe processes
) else (
    echo      No python.exe processes found
)

:: Method 3: Kill pythonw.exe (background python)
echo  [3] Killing background Python...
taskkill /f /im pythonw.exe 2>nul

:: Method 4: Kill waitress if running standalone
echo  [4] Killing waitress server...
taskkill /f /im waitress-serve.exe 2>nul

:: Wait for processes to fully release file handles
echo.
echo  Waiting for file handles to release...
timeout /t 5 /nobreak >nul

:: Verify
echo.
echo  ============================================
echo   Verification
echo  ============================================
echo.

tasklist /fi "imagename eq python.exe" 2>nul | findstr /i python.exe >nul
if %errorlevel%==0 (
    echo  [!] WARNING: Python processes still running:
    echo.
    tasklist /fi "imagename eq python.exe"
    echo.
    echo  Try closing any Python IDEs (VS Code, PyCharm, etc.)
) else (
    echo  [OK] All Python processes stopped.
)

echo.
echo  ============================================
echo   Next Steps
echo  ============================================
echo.
echo  If files are still locked:
echo    1. Pause OneDrive (right-click tray icon)
echo    2. Close File Explorer windows in TWR folder
echo    3. Wait 30 seconds
echo    4. Try the installer again
echo.
echo  Press any key to exit...
pause >nul
