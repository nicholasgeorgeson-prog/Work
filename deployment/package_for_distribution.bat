@echo off
REM ============================================================================
REM TechWriterReview - Distribution Packager
REM ============================================================================
REM Run this on a CONNECTED Windows machine to create a distributable package
REM that includes all dependencies for air-gapped installation.
REM
REM Output: dist\TWR_Distribution.zip (ready to transfer and install)
REM ============================================================================
setlocal enabledelayedexpansion

echo.
echo ============================================================
echo TechWriterReview - Distribution Packager
echo ============================================================
echo.
echo This creates a complete package for air-gapped deployment.
echo Requirements: Python 3.12, pip, internet connection
echo.

REM Check Python version
python --version 2>nul | findstr "3.12" >nul
if errorlevel 1 (
    echo ERROR: Python 3.12 is required.
    pause
    exit /b 1
)

echo [OK] Python 3.12 detected
echo.

REM Get script directory
set SCRIPT_DIR=%~dp0
set TWR_ROOT=%SCRIPT_DIR%..

REM Create output directory
set OUTPUT_DIR=%TWR_ROOT%\dist
set PACKAGE_NAME=TWR_Distribution

if exist "%OUTPUT_DIR%\%PACKAGE_NAME%" (
    echo Removing existing package...
    rmdir /s /q "%OUTPUT_DIR%\%PACKAGE_NAME%"
)

mkdir "%OUTPUT_DIR%" 2>nul
mkdir "%OUTPUT_DIR%\%PACKAGE_NAME%"
mkdir "%OUTPUT_DIR%\%PACKAGE_NAME%\wheels"

echo Created: %OUTPUT_DIR%\%PACKAGE_NAME%
echo.

REM ============================================================================
REM Download Python dependencies
REM ============================================================================
echo ============================================================
echo Downloading Python dependencies...
echo ============================================================
echo.

echo [1/5] Downloading Flask and web dependencies...
pip download flask waitress -d "%OUTPUT_DIR%\%PACKAGE_NAME%\wheels" --only-binary=:all: --python-version 3.12 --platform win_amd64 2>nul
if errorlevel 1 pip download flask waitress -d "%OUTPUT_DIR%\%PACKAGE_NAME%\wheels"

echo [2/5] Downloading document processing libraries...
pip download python-docx lxml openpyxl PyMuPDF PyPDF2 -d "%OUTPUT_DIR%\%PACKAGE_NAME%\wheels" --only-binary=:all: --python-version 3.12 --platform win_amd64 2>nul
if errorlevel 1 pip download python-docx lxml openpyxl PyMuPDF PyPDF2 -d "%OUTPUT_DIR%\%PACKAGE_NAME%\wheels"

echo [3/5] Downloading pdfplumber for table extraction...
pip download pdfplumber -d "%OUTPUT_DIR%\%PACKAGE_NAME%\wheels" --only-binary=:all: --python-version 3.12 --platform win_amd64 2>nul
if errorlevel 1 pip download pdfplumber -d "%OUTPUT_DIR%\%PACKAGE_NAME%\wheels"

echo [4/5] Downloading spaCy (optional NLP)...
pip download spacy -d "%OUTPUT_DIR%\%PACKAGE_NAME%\wheels" --only-binary=:all: --python-version 3.12 --platform win_amd64 2>nul
if errorlevel 1 pip download spacy -d "%OUTPUT_DIR%\%PACKAGE_NAME%\wheels"

echo [5/5] Downloading spaCy English model...
curl -L -o "%OUTPUT_DIR%\%PACKAGE_NAME%\wheels\en_core_web_sm-3.8.0-py3-none-any.whl" https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.8.0/en_core_web_sm-3.8.0-py3-none-any.whl 2>nul
if errorlevel 1 (
    powershell -Command "Invoke-WebRequest -Uri 'https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.8.0/en_core_web_sm-3.8.0-py3-none-any.whl' -OutFile '%OUTPUT_DIR%\%PACKAGE_NAME%\wheels\en_core_web_sm-3.8.0-py3-none-any.whl'" 2>nul
)

REM ============================================================================
REM Copy TWR application files
REM ============================================================================
echo.
echo ============================================================
echo Copying TWR application files...
echo ============================================================
echo.

REM Copy all Python files
for %%f in ("%TWR_ROOT%\*.py") do (
    copy "%%f" "%OUTPUT_DIR%\%PACKAGE_NAME%\" >nul && echo   [OK] %%~nxf
)

REM Copy other root files
copy "%TWR_ROOT%\version.json" "%OUTPUT_DIR%\%PACKAGE_NAME%\" >nul 2>&1
copy "%TWR_ROOT%\requirements.txt" "%OUTPUT_DIR%\%PACKAGE_NAME%\" >nul 2>&1
copy "%TWR_ROOT%\config.json" "%OUTPUT_DIR%\%PACKAGE_NAME%\" >nul 2>&1
copy "%TWR_ROOT%\README.md" "%OUTPUT_DIR%\%PACKAGE_NAME%\" >nul 2>&1
copy "%TWR_ROOT%\TWR_LESSONS_LEARNED.md" "%OUTPUT_DIR%\%PACKAGE_NAME%\" >nul 2>&1

REM Copy directories
xcopy "%TWR_ROOT%\static" "%OUTPUT_DIR%\%PACKAGE_NAME%\static\" /E /I /Q >nul && echo   [OK] static/
xcopy "%TWR_ROOT%\templates" "%OUTPUT_DIR%\%PACKAGE_NAME%\templates\" /E /I /Q >nul && echo   [OK] templates/
xcopy "%TWR_ROOT%\statement_forge" "%OUTPUT_DIR%\%PACKAGE_NAME%\statement_forge\" /E /I /Q >nul 2>&1
xcopy "%TWR_ROOT%\tools" "%OUTPUT_DIR%\%PACKAGE_NAME%\tools\" /E /I /Q >nul 2>&1
xcopy "%TWR_ROOT%\images" "%OUTPUT_DIR%\%PACKAGE_NAME%\images\" /E /I /Q >nul 2>&1

REM Create empty directories
mkdir "%OUTPUT_DIR%\%PACKAGE_NAME%\logs" 2>nul
mkdir "%OUTPUT_DIR%\%PACKAGE_NAME%\temp" 2>nul
mkdir "%OUTPUT_DIR%\%PACKAGE_NAME%\backups" 2>nul
mkdir "%OUTPUT_DIR%\%PACKAGE_NAME%\data" 2>nul

REM Copy install script
copy "%SCRIPT_DIR%install.bat" "%OUTPUT_DIR%\%PACKAGE_NAME%\" >nul && echo   [OK] install.bat

REM ============================================================================
REM Create ZIP archive
REM ============================================================================
echo.
echo ============================================================
echo Creating distribution archive...
echo ============================================================
echo.

cd "%OUTPUT_DIR%"
powershell -Command "Compress-Archive -Path '%PACKAGE_NAME%\*' -DestinationPath '%PACKAGE_NAME%.zip' -Force" 2>nul
if errorlevel 1 (
    echo PowerShell compression failed, folder ready at: %OUTPUT_DIR%\%PACKAGE_NAME%\
) else (
    echo [OK] Created: %OUTPUT_DIR%\%PACKAGE_NAME%.zip
)

REM ============================================================================
REM Summary
REM ============================================================================
echo.
echo ============================================================
echo Packaging Complete!
echo ============================================================
echo.
echo Distribution package: %OUTPUT_DIR%\%PACKAGE_NAME%.zip
echo.
for /f %%a in ('dir /b /a-d "%OUTPUT_DIR%\%PACKAGE_NAME%\wheels\*.whl" 2^>nul ^| find /c /v ""') do echo   Wheels included: %%a
echo.
echo To distribute:
echo   1. Copy %PACKAGE_NAME%.zip to the target machine
echo   2. Extract and run install.bat
echo.
pause
