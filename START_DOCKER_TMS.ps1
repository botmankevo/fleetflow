# MainTMS - Docker Startup Script
# This script checks Docker and starts your TMS system

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "     MAIN TMS - Docker Startup" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if Docker is ready
function Test-DockerReady {
    try {
        $null = docker info 2>&1
        return $LASTEXITCODE -eq 0
    } catch {
        return $false
    }
}

# Check Docker status
Write-Host "🔍 Checking Docker Desktop..." -ForegroundColor Cyan
if (Test-DockerReady) {
    Write-Host "✅ Docker is running!" -ForegroundColor Green
} else {
    Write-Host "❌ Docker Desktop is not running or still starting" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please:" -ForegroundColor Cyan
    Write-Host "  1. Check Docker Desktop in your system tray" -ForegroundColor White
    Write-Host "  2. Wait for it to show 'Docker Desktop is running'" -ForegroundColor White
    Write-Host "  3. Then run this script again" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "🎯 Starting MainTMS with Docker Compose..." -ForegroundColor Cyan
Write-Host ""

# Start the services
docker-compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "     ✅ MainTMS Started Successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Access your TMS at:" -ForegroundColor Cyan
    Write-Host "   Frontend:  http://localhost:3001" -ForegroundColor Yellow
    Write-Host "   Backend:   http://localhost:8000" -ForegroundColor Yellow
    Write-Host "   API Docs:  http://localhost:8000/docs" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📊 View logs:" -ForegroundColor Cyan
    Write-Host "   docker-compose logs -f" -ForegroundColor White
    Write-Host ""
    Write-Host "🛑 Stop services:" -ForegroundColor Cyan
    Write-Host "   docker-compose down" -ForegroundColor White
    Write-Host ""
    
    # Wait for services to be ready
    Write-Host "⏳ Waiting for services to initialize (30 seconds)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30
    
    Write-Host ""
    Write-Host "📋 Service Status:" -ForegroundColor Cyan
    docker-compose ps
    
    Write-Host ""
    Write-Host "🎉 Ready to go! Open http://localhost:3001 in your browser" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Failed to start services" -ForegroundColor Red
    Write-Host "Check the logs with: docker-compose logs" -ForegroundColor Yellow
    Write-Host ""
}

Read-Host "Press Enter to continue"
