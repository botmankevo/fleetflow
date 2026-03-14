const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

/**
 * BFS Crawler for authenticated SPA dashboard
 * Captures screenshots, HTML, and API endpoints
 */

class SPACrawler {
  constructor(config, tenantInfo, storageState) {
    this.config = config;
    this.tenantBaseUrl = tenantInfo.tenantBaseUrl;
    this.storageState = storageState;
    
    // Crawler state
    this.visited = new Set();
    this.queue = [];
    this.apiEndpoints = new Set();
    this.pageMetadata = [];
    
    // Enhanced tracking
    this.linkGraph = {}; // { pageUrl: [linkedUrls...] }
    this.pageEndpoints = {}; // { pageUrl: [{url, method, status, contentType}...] }
    this.endpointDetails = []; // Global list with page attribution
    
    // Create output directories
    this.snapshotDir = path.join(__dirname, 'snapshot');
    this.htmlDir = path.join(this.snapshotDir, 'html');
    this.screenshotDir = path.join(this.snapshotDir, 'screenshots');
    this.harDir = path.join(this.snapshotDir, 'har');
    
    [this.snapshotDir, this.htmlDir, this.screenshotDir, this.harDir].forEach(dir => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });
  }
  
  // Normalize URL
  normalizeUrl(url) {
    try {
      const urlObj = new URL(url);
      // Remove hash
      urlObj.hash = '';
      // Remove tracking params
      const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'ref', 'fbclid'];
      trackingParams.forEach(param => urlObj.searchParams.delete(param));
      return urlObj.href;
    } catch (e) {
      return null;
    }
  }
  
  // Check if URL should be crawled
  shouldCrawl(url) {
    try {
      const urlObj = new URL(url);
      
      // Must be same origin
      if (!url.startsWith(this.tenantBaseUrl)) {
        return false;
      }
      
      // Check denylist
      const urlLower = url.toLowerCase();
      for (const pattern of this.config.denylistPatterns) {
        if (urlLower.includes(pattern.toLowerCase())) {
          return false;
        }
      }
      
      // Check if already visited
      const normalized = this.normalizeUrl(url);
      if (this.visited.has(normalized)) {
        return false;
      }
      
      return true;
    } catch (e) {
      return false;
    }
  }
  
  // Generate slug from URL
  urlToSlug(url) {
    try {
      const urlObj = new URL(url);
      let slug = urlObj.pathname.replace(/^\//, '').replace(/\//g, '_');
      if (!slug) slug = 'index';
      
      // Add query params to slug if present
      if (urlObj.search) {
        const params = Array.from(urlObj.searchParams.entries())
          .map(([k, v]) => `${k}-${v}`)
          .join('_');
        slug += '_' + params;
      }
      
      // Sanitize
      slug = slug.replace(/[^a-zA-Z0-9_-]/g, '_');
      slug = slug.substring(0, 200); // Limit length
      
      return slug || 'index';
    } catch (e) {
      return 'unknown_' + Date.now();
    }
  }
  
  // Random delay
  async delay() {
    const ms = Math.random() * (this.config.delayMax - this.config.delayMin) + this.config.delayMin;
    await new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Extract links from page
  async extractLinks(page) {
    const links = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href]'));
      const navItems = Array.from(document.querySelectorAll('[role="navigation"] a, nav a, .sidebar a, .menu a'));
      
      const allLinks = [...anchors, ...navItems];
      return [...new Set(allLinks.map(a => a.href))];
    });
    
    return links;
  }
  
  // Capture page
  async capturePage(page, url, depth) {
    const slug = this.urlToSlug(url);
    const timestamp = new Date().toISOString();
    
    console.log(`📸 Capturing: ${url} (depth: ${depth})`);
    
    try {
      // Wait for page to be ready
      await page.waitForLoadState(this.config.waitUntil, { timeout: this.config.timeout });
      
      // Get final URL (after redirects/SPA navigation)
      const finalUrl = page.url();
      
      // Get title
      const title = await page.title();
      
      // Save HTML
      const html = await page.content();
      const htmlPath = path.join(this.htmlDir, `${slug}.html`);
      fs.writeFileSync(htmlPath, html);
      
      // Save screenshot
      const screenshotPath = path.join(this.screenshotDir, `${slug}.png`);
      await page.screenshot({ 
        path: screenshotPath, 
        fullPage: true,
        timeout: this.config.timeout 
      });
      
      // Extract links
      const links = await this.extractLinks(page);
      
      // Save metadata
      const metadata = {
        url,
        finalUrl,
        title,
        timestamp,
        depth,
        slug,
        linksFound: links.length,
        htmlPath: path.relative(__dirname, htmlPath),
        screenshotPath: path.relative(__dirname, screenshotPath)
      };
      
      this.pageMetadata.push(metadata);
      
      console.log(`  ✅ Captured: ${title} (${links.length} links found)`);
      
      return { links, metadata };
      
    } catch (error) {
      console.error(`  ❌ Error capturing ${url}:`, error.message);
      return { links: [], metadata: null };
    }
  }
  
  // Main crawl function
  async crawl() {
    console.log('🕷️  Starting crawler...');
    console.log(`🏢 Tenant: ${this.tenantBaseUrl}`);
    console.log(`📊 Max pages: ${this.config.maxPages}, Max depth: ${this.config.maxDepth}`);
    
    // Launch browser
    const browser = await chromium.launch({
      headless: true
    });
    
    const context = await browser.newContext({
      storageState: this.storageState,
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      recordHar: {
        path: path.join(this.harDir, 'network.har'),
        mode: 'minimal'
      }
    });
    
    // Store current page being processed for request attribution
    let currentPageUrl = null;
    
    // Listen for API requests with attribution
    context.on('request', request => {
      const url = request.url();
      if (request.resourceType() === 'fetch' || request.resourceType() === 'xhr') {
        this.apiEndpoints.add(url);
      }
    });
    
    // Listen for responses to capture full endpoint details
    context.on('response', response => {
      const request = response.request();
      const resourceType = request.resourceType();
      
      if (resourceType === 'fetch' || resourceType === 'xhr') {
        const endpointInfo = {
          url: response.url(),
          method: request.method(),
          status: response.status(),
          contentType: response.headers()['content-type'] || 'unknown',
          page: currentPageUrl
        };
        
        // Add to page-specific endpoints
        if (currentPageUrl) {
          if (!this.pageEndpoints[currentPageUrl]) {
            this.pageEndpoints[currentPageUrl] = [];
          }
          this.pageEndpoints[currentPageUrl].push(endpointInfo);
        }
        
        // Add to global endpoint details
        this.endpointDetails.push(endpointInfo);
        
        console.log(`   🔌 ${request.method()} ${response.url()} -> ${response.status()}`);
      }
    });
    
    const page = await context.newPage();
    
    // Track SPA navigation
    page.on('framenavigated', frame => {
      if (frame === page.mainFrame()) {
        const url = frame.url();
        if (url.startsWith(this.tenantBaseUrl)) {
          console.log(`  🔄 SPA navigation detected: ${url}`);
        }
      }
    });
    
    // Initialize queue with seed paths
    for (const seedPath of this.config.seedPaths) {
      const url = this.tenantBaseUrl + seedPath;
      this.queue.push({ url, depth: 0 });
    }
    
    let pagesProcessed = 0;
    
    // BFS crawl
    while (this.queue.length > 0 && pagesProcessed < this.config.maxPages) {
      const { url, depth } = this.queue.shift();
      
      // Check if should crawl
      const normalized = this.normalizeUrl(url);
      if (!this.shouldCrawl(url) || this.visited.has(normalized)) {
        continue;
      }
      
      // Check depth
      if (depth > this.config.maxDepth) {
        continue;
      }
      
      // Mark as visited
      this.visited.add(normalized);
      pagesProcessed++;
      
      console.log(`\n[${pagesProcessed}/${this.config.maxPages}] Crawling: ${url}`);
      
      // Set current page for endpoint attribution
      currentPageUrl = url;
      this.linkGraph[url] = [];
      
      try {
        // Navigate to page
        await page.goto(url, { 
          waitUntil: this.config.waitUntil,
          timeout: this.config.timeout 
        });
        
        // Capture page
        const { links } = await this.capturePage(page, url, depth);
        
        // Store links in graph
        this.linkGraph[url] = links;
        
        // Add new links to queue
        for (const link of links) {
          if (this.shouldCrawl(link)) {
            this.queue.push({ url: link, depth: depth + 1 });
          }
        }
        
        // Random delay
        await this.delay();
        
      } catch (error) {
        console.error(`❌ Error crawling ${url}:`, error.message);
      }
      
      // Save progress periodically
      if (pagesProcessed % 10 === 0) {
        this.saveProgress();
      }
    }
    
    // Final save
    this.saveProgress();
    
    await context.close();
    await browser.close();
    
    // Calculate final statistics
    const uniqueLinks = new Set();
    Object.values(this.linkGraph).forEach(links => {
      links.forEach(link => uniqueLinks.add(link));
    });
    
    console.log('\n✨ Crawl complete!');
    console.log(`📄 Pages visited: ${pagesProcessed}`);
    console.log(`🔗 Unique links: ${uniqueLinks.size}`);
    console.log(`🔌 Unique endpoints: ${this.apiEndpoints.size}`);
    console.log(`📡 Total API calls: ${this.endpointDetails.length}`);
    console.log(`📁 Output directory: ${this.snapshotDir}`);
    console.log('\n📊 Generated files:');
    console.log('   • link-graph.json - Navigation structure');
    console.log('   • page-endpoints.json - Endpoints by page');
    console.log('   • endpoint-details.json - Full endpoint data');
    console.log('   • summary.json - Statistics and analysis');
  }
  
  // Save progress
  saveProgress() {
    // Save metadata
    const metadataPath = path.join(this.snapshotDir, 'metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(this.pageMetadata, null, 2));
    
    // Save link graph
    const linkGraphPath = path.join(this.snapshotDir, 'link-graph.json');
    fs.writeFileSync(linkGraphPath, JSON.stringify(this.linkGraph, null, 2));
    
    // Save page-specific endpoints
    const pageEndpointsPath = path.join(this.snapshotDir, 'page-endpoints.json');
    fs.writeFileSync(pageEndpointsPath, JSON.stringify(this.pageEndpoints, null, 2));
    
    // Save global API endpoints (simple list)
    const endpointsPath = path.join(this.snapshotDir, 'api-endpoints.json');
    const endpoints = Array.from(this.apiEndpoints).sort();
    fs.writeFileSync(endpointsPath, JSON.stringify(endpoints, null, 2));
    
    // Save detailed endpoint info with attribution
    const endpointDetailsPath = path.join(this.snapshotDir, 'endpoint-details.json');
    fs.writeFileSync(endpointDetailsPath, JSON.stringify(this.endpointDetails, null, 2));
    
    // Calculate statistics
    const uniqueLinks = new Set();
    Object.values(this.linkGraph).forEach(links => {
      links.forEach(link => uniqueLinks.add(link));
    });
    
    const endpointsByPage = Object.entries(this.pageEndpoints)
      .map(([page, endpoints]) => ({ page, count: endpoints.length }))
      .sort((a, b) => b.count - a.count);
    
    // Save enhanced crawl summary
    const summary = {
      crawledAt: new Date().toISOString(),
      tenantBaseUrl: this.tenantBaseUrl,
      statistics: {
        pagesVisited: this.visited.size,
        uniqueLinks: uniqueLinks.size,
        uniqueEndpoints: this.apiEndpoints.size,
        totalEndpointCalls: this.endpointDetails.length
      },
      topPagesByEndpoints: endpointsByPage.slice(0, 10),
      files: {
        'metadata.json': 'All page metadata',
        'link-graph.json': 'Page-to-page link adjacency list',
        'page-endpoints.json': 'Endpoints grouped by page',
        'api-endpoints.json': 'Deduplicated endpoint URLs',
        'endpoint-details.json': 'Full endpoint details with page attribution'
      }
    };
    
    const summaryPath = path.join(this.snapshotDir, 'summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    
    // Save human-readable sitemap
    const sitemap = Array.from(this.visited).sort().join('\n');
    const sitemapPath = path.join(this.snapshotDir, 'sitemap.txt');
    fs.writeFileSync(sitemapPath, sitemap);
    
    console.log(`💾 Progress saved (${this.visited.size} pages, ${uniqueLinks.size} links, ${this.apiEndpoints.size} endpoints)`);
  }
}

// Main execution
async function main() {
  // Load config
  const config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));
  
  // Load tenant info
  const tenantPath = path.join(__dirname, 'tenant.json');
  if (!fs.existsSync(tenantPath)) {
    console.error('❌ tenant.json not found. Please run: npm run login');
    process.exit(1);
  }
  const tenantInfo = JSON.parse(fs.readFileSync(tenantPath, 'utf-8'));
  
  // Load storage state
  const storageStatePath = path.join(__dirname, 'storageState.json');
  if (!fs.existsSync(storageStatePath)) {
    console.error('❌ storageState.json not found. Please run: npm run login');
    process.exit(1);
  }
  
  const crawler = new SPACrawler(config, tenantInfo, storageStatePath);
  await crawler.crawl();
}

main().catch(console.error);
