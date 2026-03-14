#!/usr/bin/env pwsh

Write-Host "`n🔐 EZLOADS LOGIN HELPER`n" -ForegroundColor Green
Write-Host "=" -NoNewline -ForegroundColor Gray
1..60 | ForEach-Object { Write-Host "=" -NoNewline -ForegroundColor Gray }
Write-Host "`n"

Write-Host "📋 Instructions:" -ForegroundColor Yellow
Write-Host "  1. Browser will open to https://ezloads.net/apps" -ForegroundColor White
Write-Host "  2. Log in with your credentials" -ForegroundColor White
Write-Host "  3. Wait until you see your dashboard" -ForegroundColor White
Write-Host "  4. Come back to this terminal window" -ForegroundColor Cyan
Write-Host "  5. Press ENTER" -ForegroundColor Cyan
Write-Host "  6. Session will be saved!`n" -ForegroundColor White

Write-Host "⚠️  IMPORTANT:" -ForegroundColor Red
Write-Host "  • Do NOT close the browser manually" -ForegroundColor Red
Write-Host "  • Only press ENTER after you see your dashboard`n" -ForegroundColor Red

Write-Host "=" -NoNewline -ForegroundColor Gray
1..60 | ForEach-Object { Write-Host "=" -NoNewline -ForegroundColor Gray }
Write-Host "`n"

Write-Host "🚀 Starting in 3 seconds...`n" -ForegroundColor Green

Start-Sleep -Seconds 3

npm run login
