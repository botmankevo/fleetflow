#!/usr/bin/env pwsh

Write-Host "`n🕷️  EZLOADS CRAWLER`n" -ForegroundColor Green

# Check if authentication files exist
if (-not (Test-Path "storageState.json")) {
    Write-Host "❌ Authentication files not found!`n" -ForegroundColor Red
    Write-Host "Please run login first:" -ForegroundColor Yellow
    Write-Host "  .\RUN_LOGIN.ps1`n" -ForegroundColor White
    exit 1
}

if (-not (Test-Path "tenant.json")) {
    Write-Host "❌ Tenant configuration not found!`n" -ForegroundColor Red
    Write-Host "Please run login first:" -ForegroundColor Yellow
    Write-Host "  .\RUN_LOGIN.ps1`n" -ForegroundColor White
    exit 1
}

# Load tenant info
$tenant = Get-Content "tenant.json" | ConvertFrom-Json
Write-Host "✅ Authenticated!" -ForegroundColor Green
Write-Host "🏢 Tenant: $($tenant.tenantBaseUrl)`n" -ForegroundColor Cyan

Write-Host "🎯 Crawl Configuration:" -ForegroundColor Yellow
$config = Get-Content "config.json" | ConvertFrom-Json
Write-Host "  Max pages: $($config.maxPages)" -ForegroundColor White
Write-Host "  Max depth: $($config.maxDepth)" -ForegroundColor White
Write-Host "  Delay: $($config.delayMin)-$($config.delayMax)ms`n" -ForegroundColor White

Write-Host "📸 Will capture:" -ForegroundColor Yellow
Write-Host "  • Full-page screenshots" -ForegroundColor White
Write-Host "  • HTML snapshots" -ForegroundColor White
Write-Host "  • API endpoints" -ForegroundColor White
Write-Host "  • Complete sitemap`n" -ForegroundColor White

Write-Host "⏱️  Estimated time: 10-20 minutes`n" -ForegroundColor Cyan

Write-Host "Press any key to start crawling..." -ForegroundColor Green
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host "`n🚀 Starting crawler...`n" -ForegroundColor Green

npm run crawl

Write-Host "`n✨ Crawl complete!`n" -ForegroundColor Green
Write-Host "📂 Check results in: .\snapshot\`n" -ForegroundColor Cyan
Write-Host "To analyze results, run:" -ForegroundColor Yellow
Write-Host "  .\RUN_ANALYZE.ps1`n" -ForegroundColor White
