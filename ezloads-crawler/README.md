# EzLoads.net Crawler

**Authenticated Playwright crawler for capturing SPA dashboard UI/UX patterns**

⚠️ **IMPORTANT: Authorized Use Only**

This tool is designed for legitimate competitive analysis and UI/UX research. Only use it on systems where you have explicit authorization. Unauthorized access to computer systems is illegal.

---

## 🎯 Purpose

This crawler captures:
- **Full-page screenshots** of all dashboard pages
- **HTML snapshots** for structure analysis
- **API endpoint inventory** for backend understanding
- **Sitemap** of all discovered routes
- **Implementation checklist** for MainTMS development

---

## 🚀 Quick Start (Windows PowerShell)

### 1. Install Dependencies

```powershell
cd .gemini/antigravity/scratch/MainTMS/ezloads-crawler

# Install Node.js packages
npm install

# Install Playwright browsers
npx playwright install chromium
```

### 2. Login and Capture Session

```powershell
npm run login
```

**What happens:**
1. Browser opens to https://ezloads.net/apps
2. **Log in manually** with your credentials
3. Wait until you see your dashboard
4. Press **ENTER** in the terminal
5. Session saved to `storageState.json` and `tenant.json`

### 3. Run the Crawler

```powershell
npm run crawl
```

**What it does:**
- Crawls up to 400 pages (configurable)
- Max depth: 5 levels
- Random delays: 700-1500ms between requests
- Captures screenshots, HTML, and API calls
- Saves everything to `./snapshot/`

### 4. Analyze Results

```powershell
npm run analyze
```

**Generates:**
- Statistics report (console)
- `sitemap.txt` - All discovered routes
- `IMPLEMENTATION_CHECKLIST.md` - Feature comparison

---

## 📁 Output Structure

```
snapshot/
├── html/                       # HTML snapshots
│   ├── loads.html
│   ├── drivers.html
│   └── ...
├── screenshots/                # Full-page screenshots
│   ├── loads.png
│   ├── drivers.png
│   └── ...
├── har/                        # Network traffic
│   └── network.har
├── metadata.json              # Page metadata
├── api-endpoints.json         # All API endpoints
├── summary.json               # Crawl summary
├── sitemap.txt                # All routes
└── IMPLEMENTATION_CHECKLIST.md # Feature list
```

---

## ⚙️ Configuration

Edit `config.json`:

```json
{
  "maxPages": 400,           // Max pages to crawl
  "maxDepth": 5,             // Max link depth
  "concurrency": 2,          // Concurrent requests
  "delayMin": 700,           // Min delay (ms)
  "delayMax": 1500,          // Max delay (ms)
  "timeout": 30000,          // Page load timeout
  "waitUntil": "networkidle" // When to consider page loaded
}
```

---

## 🛡️ Safety Features

### Automatic Protections

✅ **Only crawls same-origin URLs** (your tenant subdomain)  
✅ **Denylists destructive actions**: logout, delete, approve, pay, etc.  
✅ **Never submits forms**  
✅ **Only follows GET navigation**  
✅ **Random delays** to avoid rate limiting  

### Denylist Patterns

The crawler automatically skips URLs containing:
- `logout`, `signout`
- `delete`, `remove`
- `approve`, `pay`, `submit`
- `upload`

---

## 📊 Use Cases

### 1. UI/UX Research
Compare ezLoads features with MainTMS to identify gaps and improvements.

### 2. Feature Parity
Use the implementation checklist to track which features you've built.

### 3. API Design
Review API endpoints to understand backend architecture.

### 4. Responsive Design
Screenshots show how ezLoads handles different screen sizes.

---

## 🔧 Troubleshooting

### "tenant.json not found"
**Solution:** Run `npm run login` first

### "Session expired"
**Solution:** Re-run `npm run login` to refresh authentication

### Crawl is too slow
**Solution:** Reduce `delayMin` and `delayMax` in `config.json`

### Missing pages
**Solution:** Increase `maxDepth` or add specific paths to `seedPaths`

### Timeout errors
**Solution:** Increase `timeout` in `config.json`

---

## 🎨 Integration with MainTMS

After crawling:

1. **Review screenshots** in `snapshot/screenshots/`
2. **Compare with MainTMS** pages
3. **Identify missing features** using `IMPLEMENTATION_CHECKLIST.md`
4. **Implement gaps** in MainTMS
5. **Test parity** by comparing side-by-side

---

## 📝 Notes

- **Session persistence:** Login is saved, so you only need to run `npm run login` once (until session expires)
- **Incremental crawling:** The crawler deduplicates URLs automatically
- **SPA-aware:** Detects client-side navigation and captures dynamic routes
- **Network capture:** HAR file includes all API requests for analysis

---

## ⚖️ Legal & Ethical Use

✅ **DO:**
- Use on systems you're authorized to access
- Respect rate limits and terms of service
- Use for legitimate competitive analysis
- Cite sources when implementing similar features

❌ **DON'T:**
- Use on unauthorized systems
- Attempt to exploit vulnerabilities
- Extract sensitive data
- Violate terms of service

---

## 🤝 Support

For issues or questions:
1. Check `snapshot/summary.json` for crawl statistics
2. Review `config.json` settings
3. Check browser console in `npm run login` for errors

---

**Happy crawling! 🕷️**
