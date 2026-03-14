const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

/**
 * Auto-detecting login flow for ezloads.net
 * Opens browser, waits for user to log in, automatically detects successful login
 */

async function autoLogin() {
  console.log('🚀 Starting auto-detecting login flow...');
  
  const config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));
  
  const browser = await chromium.launch({
    headless: false,
    slowMo: 100
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  
  const page = await context.newPage();
  
  console.log(`📱 Opening: ${config.loginUrl}`);
  await page.goto(config.loginUrl, { waitUntil: 'networkidle' });
  
  console.log('\n⏳ Waiting for you to log in...');
  console.log('   Steps:');
  console.log('   1. Log in if needed');
  console.log('   2. Click "Open app" button (opens new tab)');
  console.log('   3. Wait for loads/dashboard page to load');
  console.log('   I will detect it automatically!\n');
  
  // Wait for navigation to tenant subdomain (indicates successful login)
  let loginDetected = false;
  let tenantBaseUrl = '';
  let activePage = page;
  
  // Function to check if logged in
  const checkLoginStatus = (url, pageName = '') => {
    console.log(`🔍 Checking URL ${pageName}: ${url}`);
    
    // Check if we're on a tenant subdomain
    if (url.includes('.ezloads.net') && !url.includes('ezloads.net/apps')) {
      const urlObj = new URL(url);
      tenantBaseUrl = `${urlObj.protocol}//${urlObj.host}`;
      
      if (!loginDetected) {
        loginDetected = true;
        console.log(`\n✅ Login detected! Tenant: ${tenantBaseUrl}`);
        console.log('⏳ Waiting 3 seconds for page to fully load...\n');
      }
      return true;
    }
    return false;
  };
  
  // Listen for new pages/tabs (when "Open app" is clicked)
  context.on('page', async (newPage) => {
    console.log('📱 New tab/window detected!');
    activePage = newPage;
    
    newPage.on('framenavigated', async (frame) => {
      if (frame === newPage.mainFrame()) {
        checkLoginStatus(newPage.url(), '(new tab)');
      }
    });
    
    // Check immediately
    await newPage.waitForLoadState('domcontentloaded').catch(() => {});
    checkLoginStatus(newPage.url(), '(new tab)');
  });
  
  // Check current URL immediately
  checkLoginStatus(page.url());
  
  // Monitor URL changes on original page
  page.on('framenavigated', async (frame) => {
    if (frame === page.mainFrame()) {
      checkLoginStatus(page.url());
    }
  });
  
  // Wait up to 5 minutes for login
  const timeout = 300000; // 5 minutes
  const startTime = Date.now();
  
  while (!loginDetected && (Date.now() - startTime < timeout)) {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  if (!loginDetected) {
    console.log('❌ Login timeout. Please run the script again.');
    await browser.close();
    process.exit(1);
  }
  
  // Wait a bit more for full page load
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Save storage state
  const storageStatePath = path.join(__dirname, 'storageState.json');
  await context.storageState({ path: storageStatePath });
  console.log(`💾 Saved authentication to: ${storageStatePath}`);
  
  // Save tenant info
  const tenantInfo = {
    tenantBaseUrl,
    detectedAt: new Date().toISOString(),
    currentUrl: activePage.url()
  };
  
  const tenantPath = path.join(__dirname, 'tenant.json');
  fs.writeFileSync(tenantPath, JSON.stringify(tenantInfo, null, 2));
  console.log(`💾 Saved tenant info to: ${tenantPath}`);
  
  await browser.close();
  
  console.log('\n✨ Login complete! Run: npm run crawl');
}

autoLogin().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
