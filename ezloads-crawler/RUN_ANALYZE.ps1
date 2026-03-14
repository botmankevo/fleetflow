#!/usr/bin/env pwsh

Write-Host "`n📊 ANALYZE CRAWL RESULTS`n" -ForegroundColor Green

# Check if snapshot exists
if (-not (Test-Path "snapshot")) {
    Write-Host "❌ No snapshot found!`n" -ForegroundColor Red
    Write-Host "Please run crawl first:" -ForegroundColor Yellow
    Write-Host "  .\RUN_CRAWL.ps1`n" -ForegroundColor White
    exit 1
}

Write-Host "🔍 Analyzing crawled data...`n" -ForegroundColor Cyan

npm run analyze

Write-Host "`n📂 Results saved to:" -ForegroundColor Green
Write-Host "  • snapshot\IMPLEMENTATION_CHECKLIST.md" -ForegroundColor White
Write-Host "  • snapshot\sitemap.txt" -ForegroundColor White
Write-Host "  • snapshot\api-endpoints.json`n" -ForegroundColor White

Write-Host "📸 View screenshots:" -ForegroundColor Yellow
Write-Host "  explorer snapshot\screenshots`n" -ForegroundColor White

Write-Host "Would you like to open the screenshots folder? (Y/N): " -ForegroundColor Cyan -NoNewline
$response = Read-Host

if ($response -eq 'Y' -or $response -eq 'y') {
    explorer snapshot\screenshots
    Write-Host "`n📸 Screenshots folder opened!`n" -ForegroundColor Green
}

Write-Host "Would you like to view the implementation checklist? (Y/N): " -ForegroundColor Cyan -NoNewline
$response = Read-Host

if ($response -eq 'Y' -or $response -eq 'y') {
    if (Get-Command code -ErrorAction SilentlyContinue) {
        code snapshot\IMPLEMENTATION_CHECKLIST.md
        Write-Host "`n📝 Checklist opened in VS Code!`n" -ForegroundColor Green
    } else {
        notepad snapshot\IMPLEMENTATION_CHECKLIST.md
        Write-Host "`n📝 Checklist opened in Notepad!`n" -ForegroundColor Green
    }
}

Write-Host "`n✨ Analysis complete!`n" -ForegroundColor Green
