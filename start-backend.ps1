# Start Silk and Sage Backend
# Run from the project root: .\start-backend.ps1

function Find-Python {
    foreach ($cmd in @("python", "python3", "py")) {
        $info = Get-Command $cmd -ErrorAction SilentlyContinue
        if (-not $info) { continue }
        try {
            # Capture both stdout and stderr streams
            $psi = New-Object System.Diagnostics.ProcessStartInfo
            $psi.FileName = $info.Source
            $psi.Arguments = "--version"
            $psi.RedirectStandardOutput = $true
            $psi.RedirectStandardError = $true
            $psi.UseShellExecute = $false
            $psi.CreateNoWindow = $true
            $proc = [System.Diagnostics.Process]::Start($psi)
            $stdout = $proc.StandardOutput.ReadToEnd()
            $stderr = $proc.StandardError.ReadToEnd()
            $proc.WaitForExit()
            $combined = "$stdout$stderr"
            if ($proc.ExitCode -ne 9009 -and $combined -match "Python 3") { return $cmd }
        } catch { continue }
    }
    return $null
}

$PYTHON = Find-Python

if (-not $PYTHON) {
    Write-Host ""
    Write-Host "  Python 3 is not installed." -ForegroundColor Red
    Write-Host ""
    Write-Host "  Install with winget (recommended on Windows 11):" -ForegroundColor Yellow
    Write-Host "     winget install Python.Python.3.12" -ForegroundColor White
    Write-Host ""
    Write-Host "  Or download from: https://www.python.org/downloads/" -ForegroundColor White
    Write-Host "  (Check 'Add python.exe to PATH' during install, then restart terminal)" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "Using: $PYTHON ($( & $PYTHON --version 2>&1 ))" -ForegroundColor Green

Set-Location backend

if (-not (Test-Path ".venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Green
    & $PYTHON -m venv .venv
    if (-not $?) { Write-Host "Failed to create venv" -ForegroundColor Red; exit 1 }
}

Write-Host "Activating virtual environment..." -ForegroundColor Green
.\.venv\Scripts\Activate.ps1

Write-Host "Installing dependencies..." -ForegroundColor Green
pip install -r requirements.txt --quiet

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Created .env from .env.example" -ForegroundColor Yellow
    Write-Host "Update STRIPE_SECRET_KEY in backend\.env before taking payments." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "  Backend running at  http://localhost:8000" -ForegroundColor Cyan
Write-Host "  API docs            http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "  Admin login         admin@silkandsage.com" -ForegroundColor Cyan
Write-Host "  Admin password      Admin123!" -ForegroundColor Cyan
Write-Host ""

uvicorn main:app --reload --host 0.0.0.0 --port 8000
