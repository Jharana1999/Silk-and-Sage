# Start Silk and Sage Frontend
Set-Location frontend

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing npm dependencies..." -ForegroundColor Green
    npm install
}

Write-Host "Starting Angular dev server on http://localhost:4200" -ForegroundColor Cyan
npm start
