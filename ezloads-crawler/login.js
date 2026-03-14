const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

/**
 * Manual login flow for ezloads.net
 * This script opens a browser for the user to log in manually.
 * Once logged in and redirected to the tenant dashboard, it saves:
 * - storageState.json (cookies, localStorage, sessionStorage)
 * - tenant.json (detected tenant base URL)
 */

async function manualLogin() {
  console.log('🚀 Starting manual login flow...');
  
  const config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));
  
  // Launch browser in headed mode for manual login
  const browser = await chromium.launch({
    headless: false,
    slowMo: 100
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  
  const page = await context.newPage();
  
  console.log(`📱 Navigating to: ${config.loginUrl}`);
  await page.goto(config.loginUrl, { waitUntil: 'networkidle' });
  
  console.log('\n⏳ Please log in manually in the browser window...');
  console.log('   After successful login, you should see your dashboard.');
  console.log('   Press ENTER in this terminal once you see your dashboard.\n');
  
  // Wait for user input
  await new Promise((resolve) => {
    process.stdin.once('data', () => {
      resolve();
    });
  });
  
  // Detect tenant URL
  const currentUrl = page.url();
  console.log(`\n✅ Current URL: ${currentUrl}`);
  
  const urlObj = new URL(currentUrl);
  const tenantBaseUrl = `${urlObj.protocol}//${urlObj.host}`;
  
  console.log(`🏢 Detected tenant base URL: ${tenantBaseUrl}`);
  
  // Save storage state
  const storageStatePath = path.join(__dirname, 'storageState.json');
  await context.storageState({ path: storageStatePath });
  console.log(`💾 Saved authentication state to: ${storageStatePath}`);
  
  // Save tenant info
  const tenantInfo = {
    tenantBaseUrl,
    detectedAt: new Date().toISOString(),
    currentUrl
  };
  
  const tenantPath = path.join(__dirname, 'tenant.json');
  fs.writeFileSync(tenantPath, JSON.stringify(tenantInfo, null, 2));
  console.log(`💾 Saved tenant info to: ${tenantPath}`);
  
  await browser.close();
  
  console.log('\n✨ Login complete! You can now run: npm run crawl');
}

manualLogin().catch(console.error);
