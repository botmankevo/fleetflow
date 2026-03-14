const fs = require('fs');
const path = require('path');

/**
 * Analyze crawled data and generate reports
 */

function analyzeSnapshots() {
  const snapshotDir = path.join(__dirname, 'snapshot');
  
  if (!fs.existsSync(snapshotDir)) {
    console.error('❌ No snapshot directory found. Please run: npm run crawl');
    process.exit(1);
  }
  
  // Load metadata
  const metadataPath = path.join(snapshotDir, 'metadata.json');
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
  
  // Load API endpoints
  const endpointsPath = path.join(snapshotDir, 'api-endpoints.json');
  const endpoints = JSON.parse(fs.readFileSync(endpointsPath, 'utf-8'));
  
  // Load summary
  const summaryPath = path.join(snapshotDir, 'summary.json');
  const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
  
  console.log('\n📊 CRAWL ANALYSIS REPORT\n');
  console.log('═'.repeat(60));
  
  // Basic stats
  console.log('\n📈 BASIC STATISTICS');
  console.log('─'.repeat(60));
  console.log(`Crawled at: ${summary.crawledAt}`);
  console.log(`Tenant URL: ${summary.tenantBaseUrl}`);
  console.log(`Total pages: ${summary.totalPages}`);
  console.log(`API endpoints: ${summary.apiEndpoints}`);
  
  // Page breakdown
  console.log('\n📄 PAGES BY SECTION');
  console.log('─'.repeat(60));
  
  const sections = {};
  metadata.forEach(page => {
    const urlObj = new URL(page.url);
    const section = urlObj.pathname.split('/')[1] || 'home';
    sections[section] = (sections[section] || 0) + 1;
  });
  
  Object.entries(sections)
    .sort((a, b) => b[1] - a[1])
    .forEach(([section, count]) => {
      console.log(`  ${section.padEnd(20)} : ${count} pages`);
    });
  
  // API endpoint analysis
  console.log('\n🔌 API ENDPOINTS BY TYPE');
  console.log('─'.repeat(60));
  
  const apiByType = {
    GET: [],
    POST: [],
    PUT: [],
    DELETE: [],
    OTHER: []
  };
  
  const apiPaths = {};
  endpoints.forEach(endpoint => {
    try {
      const urlObj = new URL(endpoint);
      const apiPath = urlObj.pathname;
      apiPaths[apiPath] = (apiPaths[apiPath] || 0) + 1;
    } catch (e) {}
  });
  
  console.log(`Total unique API endpoints: ${endpoints.length}`);
  console.log(`\nTop 20 API paths:`);
  Object.entries(apiPaths)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .forEach(([path, count]) => {
      console.log(`  ${count}x  ${path}`);
    });
  
  // Page titles
  console.log('\n📋 PAGE TITLES');
  console.log('─'.repeat(60));
  
  const uniqueTitles = [...new Set(metadata.map(p => p.title))];
  uniqueTitles.slice(0, 20).forEach(title => {
    console.log(`  • ${title}`);
  });
  
  if (uniqueTitles.length > 20) {
    console.log(`  ... and ${uniqueTitles.length - 20} more`);
  }
  
  // Generate sitemap
  console.log('\n🗺️  SITEMAP');
  console.log('─'.repeat(60));
  
  const sitemap = metadata
    .map(p => p.url)
    .sort()
    .map(url => {
      const urlObj = new URL(url);
      return urlObj.pathname + urlObj.search;
    });
  
  const sitemapPath = path.join(snapshotDir, 'sitemap.txt');
  fs.writeFileSync(sitemapPath, sitemap.join('\n'));
  console.log(`Sitemap saved to: ${sitemapPath}`);
  console.log(`Total routes: ${sitemap.length}`);
  
  // Generate implementation checklist
  generateImplementationChecklist(metadata, endpoints, snapshotDir);
  
  console.log('\n✨ Analysis complete!\n');
}

function generateImplementationChecklist(metadata, endpoints, snapshotDir) {
  const sections = {};
  
  metadata.forEach(page => {
    const urlObj = new URL(page.url);
    const section = urlObj.pathname.split('/')[1] || 'home';
    
    if (!sections[section]) {
      sections[section] = {
        pages: [],
        title: page.title
      };
    }
    
    sections[section].pages.push({
      path: urlObj.pathname,
      title: page.title,
      screenshot: page.screenshotPath
    });
  });
  
  let checklist = `# IMPLEMENTATION CHECKLIST\n\n`;
  checklist += `Generated: ${new Date().toISOString()}\n\n`;
  checklist += `## Overview\n\n`;
  checklist += `Total sections to implement: ${Object.keys(sections).length}\n`;
  checklist += `Total pages: ${metadata.length}\n\n`;
  checklist += `---\n\n`;
  
  Object.entries(sections)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([section, data]) => {
      checklist += `## ${section.toUpperCase()}\n\n`;
      checklist += `Pages: ${data.pages.length}\n\n`;
      
      data.pages.forEach(page => {
        checklist += `- [ ] **${page.path}**\n`;
        checklist += `      Title: ${page.title}\n`;
        checklist += `      Screenshot: ${page.screenshot}\n\n`;
      });
      
      checklist += `---\n\n`;
    });
  
  checklist += `## API ENDPOINTS TO IMPLEMENT\n\n`;
  
  const apiBySection = {};
  endpoints.forEach(endpoint => {
    try {
      const urlObj = new URL(endpoint);
      const path = urlObj.pathname;
      const section = path.split('/')[1] || 'general';
      
      if (!apiBySection[section]) {
        apiBySection[section] = [];
      }
      
      apiBySection[section].push(path);
    } catch (e) {}
  });
  
  Object.entries(apiBySection)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([section, paths]) => {
      checklist += `### ${section}\n\n`;
      [...new Set(paths)].sort().forEach(path => {
        checklist += `- [ ] \`${path}\`\n`;
      });
      checklist += `\n`;
    });
  
  const checklistPath = path.join(snapshotDir, 'IMPLEMENTATION_CHECKLIST.md');
  fs.writeFileSync(checklistPath, checklist);
  console.log(`\n📝 Implementation checklist saved to: ${checklistPath}`);
}

analyzeSnapshots();
