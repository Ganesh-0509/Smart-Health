# Smart Health — start backend + frontend for local development (Windows).
# Usage:  ./scripts/dev.ps1
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent

Write-Host "Starting Smart Health (backend :8000, frontend :3000)..." -ForegroundColor Cyan

# Backend
$backend = Join-Path $root "backend"
if (-not (Test-Path (Join-Path $backend ".venv"))) {
    Write-Host "Creating backend venv + installing deps..." -ForegroundColor Yellow
    python -m venv (Join-Path $backend ".venv")
    & (Join-Path $backend ".venv\Scripts\python.exe") -m pip install -q -r (Join-Path $backend "requirements.txt")
}
Start-Process -FilePath (Join-Path $backend ".venv\Scripts\python.exe") `
    -ArgumentList "-m","uvicorn","app.main:app","--reload","--port","8000" `
    -WorkingDirectory $backend

# Frontend
$frontend = Join-Path $root "frontend"
if (-not (Test-Path (Join-Path $frontend "node_modules"))) {
    Write-Host "Installing frontend deps..." -ForegroundColor Yellow
    Push-Location $frontend; npm install; Pop-Location
}
Push-Location $frontend
npm run dev
Pop-Location
