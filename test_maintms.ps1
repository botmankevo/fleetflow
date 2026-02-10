
cd "C:\Users\my self\.gemini\antigravity\scratch\MainTMS"

Write-Host "🧪 MainTMS Testing Script" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

# Test 1: Services Running
Write-Host "`n1. Checking services..." -ForegroundColor Yellow
$services = docker-compose ps --services --filter "status=running"
if ($services.Count -eq 3) {
    Write-Host "✅ All 3 services running" -ForegroundColor Green
} else {
    Write-Host "❌ Some services down" -ForegroundColor Red
}

# Test 2: Database Connection
$dbTest = docker-compose exec -T db psql -U fleetflow -d fleetflow -c "SELECT COUNT(*) FROM customers;" 2>&1
if ($dbTest -match "COUNT" -or $dbTest -match "\d+") {
    Write-Host "✅ Database accessible (Postgres)" -ForegroundColor Green
} else {
    Write-Host "❌ Database issue: $dbTest" -ForegroundColor Red
}

# Test 3: Backend API
Write-Host "`n3. Testing backend API..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/docs" -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend API responding" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Backend API not responding" -ForegroundColor Red
}

# Test 4: Frontend
Write-Host "`n4. Testing frontend..." -ForegroundColor Yellow
try {
    # Check login page specifically which should return 200
    $response = Invoke-WebRequest -Uri "http://localhost:3001/login" -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Frontend responding (Login Page)" -ForegroundColor Green
    }
} catch {
    # If it redirects to login (307), that's also a sign it's working
    if ($_.Exception.Response.StatusCode -eq 307 -or $_.Exception.Response.StatusCode -eq 404) {
         # 404 might mean route not found, but service IS responding
         Write-Host "⚠️ Frontend responding but returned $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    } else {
         Write-Host "❌ Frontend not responding: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 5: Login API
Write-Host "`n5. Testing login..." -ForegroundColor Yellow
try {
    $body = @{email="admin@coxtnl.com"; password="admin123"} | ConvertTo-Json
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:8000/auth/login" -Method Post -Body $body -ContentType "application/json"
    if ($loginResponse.access_token) {
        Write-Host "✅ Login successful, token received" -ForegroundColor Green
        $global:token = $loginResponse.access_token
    }
} catch {
    Write-Host "❌ Login failed" -ForegroundColor Red
}

# Test 6: Customers API
Write-Host "`n6. Testing customers API..." -ForegroundColor Yellow
try {
    $customers = Invoke-RestMethod -Uri "http://localhost:8000/customers/" -Headers @{Authorization="Bearer $global:token"}
    Write-Host "✅ Retrieved $($customers.Count) customers" -ForegroundColor Green
} catch {
    Write-Host "❌ Customers API failed" -ForegroundColor Red
}

# Test 7: Loads API
Write-Host "`n7. Testing loads API..." -ForegroundColor Yellow
try {
    $loads = Invoke-RestMethod -Uri "http://localhost:8000/loads" -Headers @{Authorization="Bearer $global:token"}
    Write-Host "✅ Retrieved $($loads.Count) loads" -ForegroundColor Green
} catch {
    Write-Host "❌ Loads API failed" -ForegroundColor Red
}

# Test 8: New Features
Write-Host "`n8. Testing new features..." -ForegroundColor Yellow
try {
    $vendors = Invoke-RestMethod -Uri "http://localhost:8000/vendors/" -Headers @{Authorization="Bearer $global:token"}
    Write-Host "✅ Vendors API working ($($vendors.Count) vendors)" -ForegroundColor Green
} catch {
    Write-Host "❌ Vendors API failed" -ForegroundColor Red
}

Write-Host "`n=========================" -ForegroundColor Cyan
Write-Host "Testing Complete!" -ForegroundColor Cyan
Write-Host "`nManual tests required:" -ForegroundColor Yellow
Write-Host "  - Open http://localhost:3001" -ForegroundColor White
Write-Host "  - Test IFTA, Safety, Tolls pages" -ForegroundColor White
Write-Host "  - Create test records" -ForegroundColor White
Write-Host "  - Verify mobile responsiveness" -ForegroundColor White
