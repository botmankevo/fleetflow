# Simple startup script for MainTMS
# This opens two terminals - one for backend, one for frontend

Write-Host ""
Write-Host "Starting MainTMS..." -ForegroundColor Cyan
Write-Host ""

# Check database
if (-not (Test-Path "backend\database.db")) {
    Write-Host "Creating database and demo data..." -ForegroundColor Yellow
    Push-Location backend
    python -m alembic upgrade head
    python -m app.scripts.seed_demo_data
    Pop-Location
    Write-Host "Database ready!" -ForegroundColor Green
    Write-Host ""
}

# Start Backend in new window
Write-Host "Starting Backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; python -m uvicorn app.main:app --reload --port 8000"

# Wait a moment
Start-Sleep -Seconds 3

# Start Frontend in new window
Write-Host "Starting Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm run dev"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  MainTMS Started!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Services:" -ForegroundColor Cyan
Write-Host "  Backend:  http://localhost:8000" -ForegroundColor White
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Login:" -ForegroundColor Cyan
Write-Host "  Email:    admin@maintms.com" -ForegroundColor White
Write-Host "  Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "Close the two PowerShell windows to stop services." -ForegroundColor Yellow
Write-Host ""
