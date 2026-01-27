@echo off
REM ============================================================================
REM TechWriterReview v3.0.91 - Development Setup
REM ============================================================================
REM Just run this script - it installs everything automatically.
REM Requires: Python 3.10+, internet connection
REM 
REM For advanced document extraction with AI, also run:
REM   setup_docling.bat
REM ============================================================================
setlocal enabledelayedexpansion

echo.
echo ============================================================
echo TechWriterReview v3.0.91 - Automated Setup
echo ============================================================
echo.

REM Get script directory
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

REM Check Python version
python --version 2>nul | findstr /R "3\.1[0-9]" >nul
if errorlevel 1 (
    echo ERROR: Python 3.10+ is required but not found.
    echo.
    echo Please install Python 3.10 or later:
    echo   1. Download from https://python.org
    echo   2. During install, check "Add Python to PATH"
    echo   3. Run this script again
    echo.
    pause
    exit /b 1
)

for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYVER=%%i
echo [OK] Python %PYVER% detected
echo.

REM ============================================================================
REM Install all dependencies from requirements.txt
REM ============================================================================
echo ============================================================
echo Installing dependencies (this may take 2-3 minutes)...
echo ============================================================
echo.

pip install -r requirements.txt --quiet --disable-pip-version-check
if errorlevel 1 (
    echo Trying with --user flag...
    pip install -r requirements.txt --user --quiet --disable-pip-version-check
)

REM Install pdfplumber for table extraction
echo Installing pdfplumber for table extraction...
pip install pdfplumber --quiet --disable-pip-version-check 2>nul
if errorlevel 1 pip install pdfplumber --user --quiet 2>nul

REM Optional: Install spaCy for enhanced NLP (commented out by default)
REM echo Installing spaCy for enhanced NLP...
REM pip install spacy --quiet --disable-pip-version-check
REM python -m spacy download en_core_web_sm --quiet

echo.
echo ============================================================
echo Verifying installation...
echo ============================================================
echo.

set ALL_OK=1

python -c "import flask" 2>nul
if errorlevel 1 (echo   [FAIL] flask & set ALL_OK=0) else (echo   [OK] flask)

python -c "from docx import Document" 2>nul
if errorlevel 1 (echo   [FAIL] python-docx & set ALL_OK=0) else (echo   [OK] python-docx)

python -c "import pdfplumber" 2>nul
if errorlevel 1 (echo   [WARN] pdfplumber - table extraction unavailable) else (echo   [OK] pdfplumber)

python -c "from role_integration import RoleIntegration; r = RoleIntegration(); exit(0 if r.is_available() else 1)" 2>nul
if errorlevel 1 (
    echo   [WARN] role extraction - check role_extractor_v3.py
) else (
    echo   [OK] role extraction
)

REM Check for Docling (optional)
python -c "import docling; print(f'  [OK] docling {docling.__version__}')" 2>nul
if errorlevel 1 (
    echo   [INFO] docling not installed - run setup_docling.bat for advanced extraction
)

REM ============================================================================
REM Create start script
REM ============================================================================
echo.
(
echo @echo off
echo cd /d "%SCRIPT_DIR%"
echo echo Starting TechWriterReview v3.0.91...
echo echo Open browser to: http://localhost:5000
echo echo Press Ctrl+C to stop.
echo echo.
echo python app.py
echo pause
) > "%SCRIPT_DIR%start_twr.bat"

echo Created: start_twr.bat

REM ============================================================================
REM Done
REM ============================================================================
echo.
echo ============================================================
if %ALL_OK%==1 (
    echo SETUP COMPLETE - Ready to use!
) else (
    echo SETUP COMPLETE - Some warnings above
)
echo ============================================================
echo.
echo To start TechWriterReview:
echo   Double-click: start_twr.bat
echo   Or run: python app.py
echo.
echo Then open: http://localhost:5000
echo.

if %ALL_OK%==1 (
    set /p START_NOW="Start TechWriterReview now? (Y/N): "
    if /i "!START_NOW!"=="Y" (
        echo.
        start "" http://localhost:5000
        timeout /t 2 >nul
        python app.py
    )
)

pause
