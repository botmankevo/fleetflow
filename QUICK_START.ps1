# Main TMS - Quick Start Script (PowerShell)
# This script helps you get Main TMS running quickly

Write-Host "🚀 Main TMS - Quick Start" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Cyan
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}
Write-Host ""

# Check disk space
Write-Host "Checking disk space..." -ForegroundColor Cyan
$drive = Get-PSDrive C
$freeGB = [math]::Round($drive.Free / 1GB, 2)
Write-Host "Free space on C: drive: $freeGB GB"
if ($freeGB -lt 10) {
    Write-Host "⚠️  WARNING: Low disk space. Recommended: 10GB+ free" -ForegroundColor Yellow
}
Write-Host ""

# Check if .env files exist
Write-Host "Checking environment files..." -ForegroundColor Cyan
if (-not (Test-Path "backend\.env")) {
    Write-Host "⚠️  backend\.env not found. Creating from example..." -ForegroundColor Yellow
    Copy-Item "backend\.env.example" "backend\.env"
    Write-Host "📝 Please edit backend\.env and add your MAPBOX_API_KEY" -ForegroundColor Yellow
}

if (-not (Test-Path "frontend\.env.local")) {
    Write-Host "⚠️  frontend\.env.local not found. Creating..." -ForegroundColor Yellow
    @"
NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
"@ | Out-File -FilePath "frontend\.env.local" -Encoding UTF8
    Write-Host "📝 Please edit frontend\.env.local and add your NEXT_PUBLIC_MAPBOX_TOKEN" -ForegroundColor Yellow
}
Write-Host ""

# Check if Mapbox token is set
if (Test-Path "backend\.env") {
    $backendEnv = Get-Content "backend\.env" -Raw
    if ($backendEnv -match "your_mapbox_token_here|MAPBOX_API_KEY=$") {
        Write-Host "⚠️  WARNING: Mapbox token not set in backend\.env" -ForegroundColor Yellow
        Write-Host "Get your token from https://mapbox.com and add it to backend\.env" -ForegroundColor Yellow
        Write-Host ""
    }
}

if (Test-Path "frontend\.env.local") {
    $frontendEnv = Get-Content "frontend\.env.local" -Raw
    if ($frontendEnv -match "your_mapbox_token_here") {
        Write-Host "⚠️  WARNING: Mapbox token not set in frontend\.env.local" -ForegroundColor Yellow
        Write-Host "Get your token from https://mapbox.com and add it to frontend\.env.local" -ForegroundColor Yellow
        Write-Host ""
    }
}

# Run migrations
Write-Host "Running database migrations..." -ForegroundColor Cyan
Set-Location backend
try {
    alembic upgrade head
    Write-Host "✅ Migrations complete" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Migrations failed - you may need to run them manually" -ForegroundColor Yellow
}
Set-Location ..
Write-Host ""

# Start services
Write-Host "Starting services..." -ForegroundColor Cyan
docker-compose up -d

Write-Host ""
Write-Host "⏳ Waiting for services to start (30 seconds)..." -ForegroundColor Cyan
Start-Sleep -Seconds 30

# Check if services are running
Write-Host ""
Write-Host "Checking service status..." -ForegroundColor Cyan
docker-compose ps

Write-Host ""
Write-Host "=========================" -ForegroundColor Green
Write-Host "✅ Main TMS is starting!" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green
Write-Host ""
Write-Host "Access your TMS at:" -ForegroundColor Cyan
Write-Host "  Frontend: " -NoNewline
Write-Host "http://localhost:3001" -ForegroundColor Yellow
Write-Host "  Backend:  " -NoNewline
Write-Host "http://localhost:8000" -ForegroundColor Yellow
Write-Host "  API Docs: " -NoNewline
Write-Host "http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host ""
Write-Host "View logs with: " -NoNewline -ForegroundColor Cyan
Write-Host "docker-compose logs -f" -ForegroundColor Yellow
Write-Host "Stop services: " -NoNewline -ForegroundColor Cyan
Write-Host "docker-compose down" -ForegroundColor Yellow
Write-Host ""
Write-Host "First time? Create a user at: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "Use POST /auth/register" -ForegroundColor Cyan
Write-Host ""
Write-Host "Happy dispatching! 🚛" -ForegroundColor Green
