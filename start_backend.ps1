# Start Backend Server
Write-Host "Starting MainTMS Backend on port 8000..." -ForegroundColor Cyan
Set-Location backend
python -m uvicorn app.main:app --reload --port 8000
