# MainTMS - Quick Status Check Script

Write-Host ""
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   MainTMS Status Check" -ForegroundColor Green
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check backend
Write-Host "Backend API (http://localhost:8000):" -ForegroundColor Yellow
try {
    $backend = Invoke-WebRequest -Uri "http://localhost:8000/docs" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    Write-Host "  ✅ READY" -ForegroundColor Green
    $backendUp = $true
} catch {
    Write-Host "  ❌ Not ready" -ForegroundColor Red
    $backendUp = $false
}

Write-Host ""

# Check frontend
Write-Host "Frontend (http://localhost:3002):" -ForegroundColor Yellow
try {
    $frontend = Invoke-WebRequest -Uri "http://localhost:3002" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    Write-Host "  ✅ READY" -ForegroundColor Green
    $frontendUp = $true
} catch {
    Write-Host "  ⏳ Still compiling..." -ForegroundColor Yellow
    $frontendUp = $false
}

Write-Host ""

# Check Docker containers
Write-Host "Docker Containers:" -ForegroundColor Yellow
docker ps --filter "name=main-tms" --format "  {{.Names}} - {{.Status}}"

Write-Host ""
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan

if ($backendUp -and $frontendUp) {
    Write-Host "   ✅ SYSTEM IS READY!" -ForegroundColor Green
    Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🌐 Open: http://localhost:3002" -ForegroundColor Yellow
    Write-Host "🔑 Login: admin@maintms.com / admin123" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "   ⏳ SERVICES STILL STARTING" -ForegroundColor Yellow
    Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Run this script again in 30 seconds" -ForegroundColor Cyan
    Write-Host "Or check the frontend window to see compilation progress" -ForegroundColor Gray
    Write-Host ""
}
