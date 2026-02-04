# MainTMS - Start Script
# Run this after Docker build completes

Write-Host ""
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   Starting MainTMS..." -ForegroundColor Green
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

cd ".gemini\antigravity\scratch\MainTMS"

Write-Host "🚀 Starting all containers..." -ForegroundColor Cyan
docker-compose up -d

Write-Host ""
Write-Host "⏳ Waiting 30 seconds for startup..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host ""
Write-Host "📊 Container Status:" -ForegroundColor Cyan
docker-compose ps

Write-Host ""
Write-Host "🔍 Testing services..." -ForegroundColor Cyan
Write-Host ""

$backendUp = $false
$frontendUp = $false

# Test backend
try {
    $backend = Invoke-WebRequest -Uri "http://localhost:8000/docs" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Backend: http://localhost:8000" -ForegroundColor Green
    $backendUp = $true
} catch {
    Write-Host "❌ Backend not responding" -ForegroundColor Red
}

# Test frontend
try {
    $frontend = Invoke-WebRequest -Uri "http://localhost:3001" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Frontend: http://localhost:3001" -ForegroundColor Green
    $frontendUp = $true
} catch {
    Write-Host "❌ Frontend not responding" -ForegroundColor Red
}

Write-Host ""
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan

if ($backendUp -and $frontendUp) {
    Write-Host "   🎉 MAINTMS IS READY!" -ForegroundColor Green
    Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🌐 Open your browser:" -ForegroundColor Yellow
    Write-Host "   http://localhost:3001" -ForegroundColor White
    Write-Host ""
    Write-Host "🔑 Login Credentials:" -ForegroundColor Yellow
    Write-Host "   Email:    admin@maintms.com" -ForegroundColor White
    Write-Host "   Password: admin123" -ForegroundColor White
    Write-Host ""
    Write-Host "✨ You should see:" -ForegroundColor Cyan
    Write-Host "   • Modern sidebar with MAIN TMS branding" -ForegroundColor White
    Write-Host "   • New login page design" -ForegroundColor White
    Write-Host "   • Dispatch board (Kanban view)" -ForegroundColor White
    Write-Host "   • Customer management page" -ForegroundColor White
    Write-Host "   • All latest features!" -ForegroundColor White
    Write-Host ""
    Write-Host "🎊 Enjoy your TMS!" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  SERVICES NOT READY" -ForegroundColor Yellow
    Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    
    if (-not $backendUp) {
        Write-Host "Backend logs:" -ForegroundColor Yellow
        docker logs main-tms-backend --tail=20
        Write-Host ""
    }
    
    if (-not $frontendUp) {
        Write-Host "Frontend logs:" -ForegroundColor Yellow
        docker logs main-tms-frontend --tail=20
        Write-Host ""
    }
    
    Write-Host "Try running this script again in 1-2 minutes" -ForegroundColor Cyan
    Write-Host "Or check: .\CHECK_STATUS.ps1" -ForegroundColor Gray
}

Write-Host ""
