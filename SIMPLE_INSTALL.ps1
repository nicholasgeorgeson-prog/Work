<#
.SYNOPSIS
    TechWriterReview v3.0.49 Simple Installer
.DESCRIPTION
    Installs TechWriterReview without virtual environment.
    Uses system Python directly.
.NOTES
    Run with: Right-click > Run with PowerShell
#>

$ErrorActionPreference = "Continue"
trap {
    Write-Host ""
    Write-Host "ERROR: $_" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

$SOURCE = $PSScriptRoot
$DEST = Join-Path $PSScriptRoot "app"

Write-Host ""
Write-Host "=== TechWriterReview v3.0.49 Simple Installer ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Source: $SOURCE"
Write-Host "Destination: $DEST"
Write-Host ""

# Check Python
Write-Host "[1/4] Checking Python..."
try {
    $pyver = & python --version 2>&1
    Write-Host "      Found: $pyver" -ForegroundColor Green
} catch {
    Write-Host "      ERROR: Python not found" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Create directories
Write-Host "[2/4] Creating directories..."
$dirs = @(
    "",
    "templates",
    "static",
    "static\css",
    "static\js",
    "static\js\vendor",
    "static\js\ui",
    "static\js\api",
    "static\js\features",
    "static\js\utils",
    "statement_forge",
    "tools"
)

foreach ($d in $dirs) {
    $path = Join-Path $DEST $d
    if (!(Test-Path $path)) {
        New-Item -ItemType Directory -Path $path -Force | Out-Null
    }
}
Write-Host "      Directories created" -ForegroundColor Green

# Copy and rename files
Write-Host "[3/4] Copying files..."
$copied = 0

Get-ChildItem -Path $SOURCE -Filter "*.txt" -File | ForEach-Object {
    $name = $_.Name
    $outPath = $null
    
    # Handle __PATH__ encoded files
    if ($name -match "^__PATH__(.+)__EXT__\.(.+)\.txt$") {
        $pathPart = $matches[1] -replace "__", "\"
        $ext = $matches[2]
        $outPath = Join-Path $DEST "$pathPart.$ext"
    }
    # Handle Python files
    elseif ($name -match "^(.+)\.py\.txt$") {
        $outPath = Join-Path $DEST "$($matches[1]).py"
    }
    # Handle special files
    elseif ($name -eq "requirements.txt.txt") {
        $outPath = Join-Path $DEST "requirements.txt"
    }
    elseif ($name -eq "config.json.txt") {
        $outPath = Join-Path $DEST "config.json"
    }
    elseif ($name -eq "version.json.txt") {
        $outPath = Join-Path $DEST "version.json"
    }
    
    if ($outPath) {
        # Create parent directory if needed
        $outDir = Split-Path -Parent $outPath
        if (!(Test-Path $outDir)) {
            New-Item -ItemType Directory -Path $outDir -Force | Out-Null
        }
        
        Copy-Item -Path $_.FullName -Destination $outPath -Force
        $copied++
        
        if ($copied % 10 -eq 0) {
            Write-Host "      Copied $copied files..." -ForegroundColor Gray
        }
    }
}

Write-Host "      Copied $copied files" -ForegroundColor Green

# Install dependencies
Write-Host "[4/4] Installing dependencies..."
Write-Host "      This may take a few minutes..." -ForegroundColor Gray

pip install flask waitress python-docx lxml openpyxl PyMuPDF PyPDF2 --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org --quiet

# Check if flask installed
try {
    python -c "import flask" 2>&1 | Out-Null
    Write-Host "      Dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "      WARNING: Some dependencies may be missing" -ForegroundColor Yellow
}

# Create Run script
$runScript = @"
@echo off
cd /d "$DEST"
echo.
echo  Starting TechWriterReview...
echo  Server will be at http://127.0.0.1:5000
echo.
echo  Keep this window open while using the tool.
echo  Press Ctrl+C or close this window to stop.
echo.
python app.py
pause
"@

$runPath = Join-Path $SOURCE "Run_TWR.bat"
$runScript | Set-Content -Path $runPath -Encoding ASCII
Write-Host "      Created Run_TWR.bat" -ForegroundColor Green

# Create Stop script
$stopScript = @"
@echo off
echo Stopping TechWriterReview...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000.*LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
echo Done.
pause
"@

$stopPath = Join-Path $SOURCE "Stop_TWR.bat"
$stopScript | Set-Content -Path $stopPath -Encoding ASCII
Write-Host "      Created Stop_TWR.bat" -ForegroundColor Green

# Done
Write-Host ""
Write-Host "=== INSTALLATION COMPLETE ===" -ForegroundColor Green
Write-Host ""
Write-Host "Location: $SOURCE"
Write-Host ""
Write-Host "To start: Run_TWR.bat"
Write-Host "To stop:  Stop_TWR.bat"
Write-Host "Then open: http://127.0.0.1:5000"
Write-Host ""

$open = Read-Host "Open folder? (Y/n)"
if ($open -ne 'n') {
    explorer.exe $SOURCE
}

$run = Read-Host "Start TechWriterReview now? (Y/n)"
if ($run -ne 'n') {
    Start-Process -FilePath $runPath
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Green
Read-Host "Press Enter to close"
