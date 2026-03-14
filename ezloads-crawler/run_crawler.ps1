# EzLoads Crawler - Simple Version
# Run this script to crawl ezloads.net

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  EZLOADS CRAWLER" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Login
Write-Host "STEP 1: LOGIN" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor DarkGray
Write-Host ""
Write-Host "A browser will open. Please:" -ForegroundColor White
Write-Host "  1. Log in to ezloads.net" -ForegroundColor White
Write-Host "  2. Wait until you see your dashboard" -ForegroundColor White
Write-Host "  3. Browser will close automatically" -ForegroundColor Green
Write-Host ""
Write-Host "Press any key to start..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
Write-Host ""

node login-auto.js

if (-not (Test-Path "storageState.json")) {
    Write-Host ""
    Write-Host "Login failed. Please try again." -ForegroundColor Red
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "Login successful!" -ForegroundColor Green
Write-Host ""
Start-Sleep -Seconds 2

# Step 2: Crawl
Write-Host "STEP 2: CRAWL" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Starting crawler... This will take 10-20 minutes." -ForegroundColor White
Write-Host "Progress will be shown below:" -ForegroundColor White
Write-Host ""

node crawl.js

Write-Host ""
Write-Host "Crawl complete!" -ForegroundColor Green
Write-Host ""
Start-Sleep -Seconds 2

# Step 3: Analyze
Write-Host "STEP 3: ANALYZE" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Generating reports..." -ForegroundColor White
Write-Host ""

node analyze.js

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ALL DONE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Results saved to: ./snapshot/" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Browse screenshots in ./snapshot/screenshots/" -ForegroundColor White
Write-Host "  2. Read ./snapshot/IMPLEMENTATION_CHECKLIST.md" -ForegroundColor White
Write-Host "  3. Review ./snapshot/sitemap.txt" -ForegroundColor White
Write-Host ""
