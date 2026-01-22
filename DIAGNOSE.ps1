<#
.SYNOPSIS
    TechWriterReview Diagnostic Tool
.DESCRIPTION
    Collects all information needed to diagnose installation issues.
    Run after extracting the ZIP but before or after running the installer.
.NOTES
    Run with: Right-click > Run with PowerShell
#>

$ErrorActionPreference = "Continue"
$VERSION = "3.0.49"
$SCRIPT_DIR = $PSScriptRoot
$REPORT_FILE = Join-Path $SCRIPT_DIR "DIAGNOSTIC_REPORT.txt"

# Expected file sizes (from source package)
$EXPECTED_SIZES = @{
    "__PATH__static__js__features__roles__EXT__.js.txt" = 93309
    "__PATH__static__js__app__EXT__.js.txt" = 346070
    "__PATH__static__css__style__EXT__.css.txt" = 213847
    "__PATH__templates__index__EXT__.html.txt" = 177953
    "__PATH__statement_forge__routes__EXT__.py.txt" = 30588
    "__PATH__statement_forge__extractor__EXT__.py.txt" = 30036
    "__PATH__statement_forge___INIT___EXT__.py.txt" = 646
    "app.py.txt" = 144692
    "core.py.txt" = 53925
}

function Write-Report {
    param([string]$Text)
    $Text | Out-File $REPORT_FILE -Append
    Write-Host $Text
}

# Clear old report
if (Test-Path $REPORT_FILE) { Remove-Item $REPORT_FILE -Force }

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  TechWriterReview Diagnostic Tool" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Collecting diagnostic information..."
Write-Host "Report will be saved to: $REPORT_FILE"
Write-Host ""

# ============================================================
# HEADER
# ============================================================

Write-Report "============================================"
Write-Report "  TECHWRITERREVIEW DIAGNOSTIC REPORT"
Write-Report "  Generated: $(Get-Date)"
Write-Report "  Expected Version: $VERSION"
Write-Report "============================================"
Write-Report ""

# ============================================================
# SYSTEM INFO
# ============================================================

Write-Report "=== SYSTEM INFORMATION ==="
Write-Report ""
Write-Report "Computer Name: $env:COMPUTERNAME"
Write-Report "User: $env:USERNAME"
Write-Report "OS: $([System.Environment]::OSVersion.VersionString)"
Write-Report ""

Write-Report "PowerShell Version: $($PSVersionTable.PSVersion)"
Write-Report "PowerShell Edition: $($PSVersionTable.PSEdition)"
Write-Report ""

Write-Report "Execution Policy:"
Get-ExecutionPolicy -List | Out-String | ForEach-Object { Write-Report $_ }
Write-Report ""

# ============================================================
# PYTHON INFO
# ============================================================

Write-Report "=== PYTHON INFORMATION ==="
Write-Report ""

try {
    $pyVer = & python --version 2>&1
    Write-Report "Python: $pyVer"
    $pyPath = (Get-Command python -ErrorAction SilentlyContinue).Source
    Write-Report "Python Path: $pyPath"
} catch {
    Write-Report "Python: NOT FOUND IN PATH"
}

try {
    $pipVer = & pip --version 2>&1
    Write-Report "Pip: $pipVer"
} catch {
    Write-Report "Pip: NOT FOUND"
}

Write-Report ""

# Check installed packages
Write-Report "Installed Packages (relevant):"
try {
    $packages = & pip list 2>&1
    @("flask", "waitress", "python-docx", "lxml", "openpyxl", "PyMuPDF", "PyPDF2") | ForEach-Object {
        $pkg = $_
        $found = $packages | Where-Object { $_ -match "^$pkg\s" }
        if ($found) {
            Write-Report "  $found"
        } else {
            Write-Report "  $pkg - NOT INSTALLED"
        }
    }
} catch {
    Write-Report "  Could not list packages"
}
Write-Report ""

# ============================================================
# DIRECTORY INFO
# ============================================================

Write-Report "=== DIRECTORY INFORMATION ==="
Write-Report ""
Write-Report "Script Directory: $SCRIPT_DIR"
Write-Report ""

# Check if this is OneDrive
if ($SCRIPT_DIR -match "OneDrive") {
    Write-Report "WARNING: Running from OneDrive folder - this may cause issues!"
    Write-Report ""
}

# ============================================================
# SOURCE FILES (before install)
# ============================================================

Write-Report "=== SOURCE FILES (.txt files in root) ==="
Write-Report ""

$sourceFiles = Get-ChildItem -Path $SCRIPT_DIR -Filter "*.txt" -File -ErrorAction SilentlyContinue
Write-Report "Total .txt files found: $($sourceFiles.Count)"
Write-Report ""

Write-Report "Critical File Size Check:"
Write-Report "-" * 80
Write-Report ("{0,-60} {1,10} {2,10} {3}" -f "File", "Actual", "Expected", "Status")
Write-Report "-" * 80

$issues = 0
foreach ($expectedFile in $EXPECTED_SIZES.Keys) {
    $filePath = Join-Path $SCRIPT_DIR $expectedFile
    $expectedSize = $EXPECTED_SIZES[$expectedFile]
    
    if (Test-Path $filePath) {
        $actualSize = (Get-Item $filePath).Length
        $status = if ($actualSize -eq $expectedSize) { 
            "OK" 
        } elseif ($actualSize -lt ($expectedSize * 0.5)) { 
            $issues++
            "TRUNCATED!" 
        } elseif ($actualSize -lt ($expectedSize * 0.9)) {
            $issues++
            "SHORT"
        } else { 
            "OK (~)" 
        }
        Write-Report ("{0,-60} {1,10} {2,10} {3}" -f $expectedFile, $actualSize, $expectedSize, $status)
    } else {
        $issues++
        Write-Report ("{0,-60} {1,10} {2,10} {3}" -f $expectedFile, "MISSING", $expectedSize, "MISSING!")
    }
}

Write-Report "-" * 80
Write-Report ""

if ($issues -gt 0) {
    Write-Report "*** $issues FILE ISSUES DETECTED ***"
    Write-Report ""
}

# ============================================================
# APP DIRECTORY (after install)
# ============================================================

$APP_DIR = Join-Path $SCRIPT_DIR "app"

if (Test-Path $APP_DIR) {
    Write-Report "=== INSTALLED APP FILES ==="
    Write-Report ""
    Write-Report "App directory exists: $APP_DIR"
    Write-Report ""
    
    $installedChecks = @{
        "app\app.py" = 144692
        "app\core.py" = 53925
        "app\templates\index.html" = 177953
        "app\static\css\style.css" = 213847
        "app\static\js\app.js" = 346070
        "app\static\js\features\roles.js" = 93309
        "app\statement_forge\__init__.py" = 646
        "app\statement_forge\routes.py" = 30588
    }
    
    Write-Report "Installed File Size Check:"
    Write-Report "-" * 80
    Write-Report ("{0,-50} {1,12} {2,12} {3}" -f "File", "Actual", "Expected", "Status")
    Write-Report "-" * 80
    
    foreach ($relPath in $installedChecks.Keys) {
        $fullPath = Join-Path $SCRIPT_DIR $relPath
        $expectedSize = $installedChecks[$relPath]
        
        if (Test-Path $fullPath) {
            $actualSize = (Get-Item $fullPath).Length
            $status = if ($actualSize -eq $expectedSize) { 
                "OK" 
            } elseif ($actualSize -lt ($expectedSize * 0.5)) { 
                "TRUNCATED!" 
            } elseif ($actualSize -lt ($expectedSize * 0.9)) {
                "SHORT"
            } else { 
                "OK (~)" 
            }
            Write-Report ("{0,-50} {1,12} {2,12} {3}" -f $relPath, $actualSize, $expectedSize, $status)
        } else {
            Write-Report ("{0,-50} {1,12} {2,12} {3}" -f $relPath, "MISSING", $expectedSize, "MISSING!")
        }
    }
    
    Write-Report "-" * 80
    Write-Report ""
    
    # Check __init__.py vs _INIT_.py
    $wrongInit = Join-Path $SCRIPT_DIR "app\statement_forge\_INIT_.py"
    $correctInit = Join-Path $SCRIPT_DIR "app\statement_forge\__init__.py"
    
    if (Test-Path $wrongInit) {
        Write-Report "WARNING: _INIT_.py exists (should be __init__.py)"
    }
    if (Test-Path $correctInit) {
        Write-Report "OK: __init__.py exists"
    }
    Write-Report ""
    
    # List statement_forge contents
    Write-Report "Statement Forge directory contents:"
    $sfDir = Join-Path $SCRIPT_DIR "app\statement_forge"
    if (Test-Path $sfDir) {
        Get-ChildItem $sfDir | ForEach-Object {
            Write-Report ("  {0,-30} {1,10} bytes" -f $_.Name, $_.Length)
        }
    } else {
        Write-Report "  Directory does not exist!"
    }
    Write-Report ""
    
    # List JS features contents
    Write-Report "JS Features directory contents:"
    $jsDir = Join-Path $SCRIPT_DIR "app\static\js\features"
    if (Test-Path $jsDir) {
        Get-ChildItem $jsDir | ForEach-Object {
            Write-Report ("  {0,-30} {1,10} bytes" -f $_.Name, $_.Length)
        }
    } else {
        Write-Report "  Directory does not exist!"
    }
    Write-Report ""

} else {
    Write-Report "=== APP DIRECTORY NOT FOUND ==="
    Write-Report ""
    Write-Report "App directory does not exist: $APP_DIR"
    Write-Report "(Run COMPLETE_INSTALL.ps1 first)"
    Write-Report ""
}

# ============================================================
# FILE CONTENT SAMPLES
# ============================================================

Write-Report "=== FILE CONTENT SAMPLES ==="
Write-Report ""

# Check roles.js content
$rolesFile = Join-Path $SCRIPT_DIR "__PATH__static__js__features__roles__EXT__.js.txt"
if (Test-Path $rolesFile) {
    Write-Report "roles.js.txt - First 3 lines:"
    Get-Content $rolesFile -TotalCount 3 | ForEach-Object { Write-Report "  $_" }
    Write-Report ""
    Write-Report "roles.js.txt - Last 3 lines:"
    Get-Content $rolesFile -Tail 3 | ForEach-Object { Write-Report "  $_" }
    Write-Report ""
    Write-Report "roles.js.txt - Line count: $((Get-Content $rolesFile).Count)"
    Write-Report "(Expected: 1827 lines)"
    Write-Report ""
}

# Check installed roles.js
$installedRoles = Join-Path $SCRIPT_DIR "app\static\js\features\roles.js"
if (Test-Path $installedRoles) {
    Write-Report "Installed roles.js - First 3 lines:"
    Get-Content $installedRoles -TotalCount 3 | ForEach-Object { Write-Report "  $_" }
    Write-Report ""
    Write-Report "Installed roles.js - Last 3 lines:"
    Get-Content $installedRoles -Tail 3 | ForEach-Object { Write-Report "  $_" }
    Write-Report ""
    Write-Report "Installed roles.js - Line count: $((Get-Content $installedRoles).Count)"
    Write-Report "(Expected: 1827 lines)"
    Write-Report ""
}

# ============================================================
# ZIP FILE CHECK
# ============================================================

Write-Report "=== ZIP FILE CHECK ==="
Write-Report ""

$zipFiles = Get-ChildItem -Path $SCRIPT_DIR -Filter "*.zip" -File -ErrorAction SilentlyContinue
if ($zipFiles) {
    foreach ($zip in $zipFiles) {
        Write-Report "Found: $($zip.Name) ($($zip.Length) bytes)"
    }
} else {
    Write-Report "No .zip files found in directory"
}
Write-Report ""

# ============================================================
# SUMMARY
# ============================================================

Write-Report "=== SUMMARY ==="
Write-Report ""

$criticalIssues = @()

# Check source file truncation
$rolesSource = Join-Path $SCRIPT_DIR "__PATH__static__js__features__roles__EXT__.js.txt"
if (Test-Path $rolesSource) {
    $size = (Get-Item $rolesSource).Length
    if ($size -lt 50000) {
        $criticalIssues += "roles.js source is truncated ($size bytes, expected 93309)"
    }
}

# Check app.js source
$appSource = Join-Path $SCRIPT_DIR "__PATH__static__js__app__EXT__.js.txt"
if (Test-Path $appSource) {
    $size = (Get-Item $appSource).Length
    if ($size -lt 200000) {
        $criticalIssues += "app.js source is truncated ($size bytes, expected 346070)"
    }
}

# Check installed files
$installedRoles = Join-Path $SCRIPT_DIR "app\static\js\features\roles.js"
if (Test-Path $installedRoles) {
    $size = (Get-Item $installedRoles).Length
    if ($size -lt 50000) {
        $criticalIssues += "Installed roles.js is truncated ($size bytes, expected 93309)"
    }
}

# Check __init__.py
$wrongInit = Join-Path $SCRIPT_DIR "app\statement_forge\_INIT_.py"
if (Test-Path $wrongInit) {
    $criticalIssues += "__init__.py is named incorrectly (_INIT_.py)"
}

if ($criticalIssues.Count -eq 0) {
    Write-Report "No critical issues detected."
} else {
    Write-Report "CRITICAL ISSUES FOUND:"
    foreach ($issue in $criticalIssues) {
        Write-Report "  - $issue"
    }
}

Write-Report ""
Write-Report "============================================"
Write-Report "  END OF DIAGNOSTIC REPORT"
Write-Report "============================================"

# ============================================================
# FINISH
# ============================================================

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Diagnostic Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Report saved to: $REPORT_FILE"
Write-Host ""
Write-Host "Please share the contents of DIAGNOSTIC_REPORT.txt"
Write-Host ""

# Open the report
notepad $REPORT_FILE

Read-Host "Press Enter to close"
