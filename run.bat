@echo off
REM File Import Metrics Dashboard - Windows Run Script

echo ======================================
echo   File Import Metrics Dashboard
echo ======================================

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing dependencies...
pip install -q -r requirements.txt

REM Run the application
echo.
echo Starting server...
echo Dashboard available at: http://localhost:5000
echo.
python app.py
