# MainTMS - Stop All Services

Write-Host "`n🛑 Stopping MainTMS Services..." -ForegroundColor Yellow

# Find and stop Python/Uvicorn processes (backend)
Write-Host "   Stopping backend..." -ForegroundColor Gray
Get-Process | Where-Object {$_.ProcessName -like "*python*" -or $_.ProcessName -like "*uvicorn*"} | Where-Object {
    $_.CommandLine -like "*app.main*"
} | Stop-Process -Force -ErrorAction SilentlyContinue

# Find and stop Node/Next.js processes (frontend)
Write-Host "   Stopping frontend..." -ForegroundColor Gray
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Where-Object {
    $_.CommandLine -like "*next dev*"
} | Stop-Process -Force -ErrorAction SilentlyContinue

# Stop any remaining jobs
Get-Job | Remove-Job -Force -ErrorAction SilentlyContinue

Write-Host "✅ All services stopped`n" -ForegroundColor Green
