# 🚀 Quick Start Guide

## Step-by-Step Instructions

### 1️⃣ Install (One-time setup)

```powershell
# Navigate to crawler directory
cd .gemini\antigravity\scratch\MainTMS\ezloads-crawler

# Install dependencies
npm install

# Install Playwright browser
npx playwright install chromium
```

---

### 2️⃣ Login to EzLoads

```powershell
npm run login
```

**Instructions:**
1. Browser window will open at https://ezloads.net/apps
2. Log in with your credentials manually
3. Wait until you see your dashboard
4. Come back to this terminal and press **ENTER**
5. Browser will close and save your session

**Output files created:**
- ✅ `storageState.json` - Your login cookies/tokens
- ✅ `tenant.json` - Your tenant URL (e.g., s1-cox-transportation01.ezloads.net)

---

### 3️⃣ Start Crawling

```powershell
npm run crawl
```

**What it does:**
- Visits all pages in the dashboard
- Takes full-page screenshots
- Saves HTML for each page
- Records all API endpoints
- Creates a complete sitemap

**Expected time:** 10-20 minutes (depends on pages)

**Progress indicators:**
```
[1/400] Crawling: https://s1-cox-transportation01.ezloads.net/loads
📸 Capturing: https://...
  ✅ Captured: Loads (47 links found)
💾 Progress saved (10 pages)
```

---

### 4️⃣ Analyze Results

```powershell
npm run analyze
```

**Generates:**
```
📊 CRAWL ANALYSIS REPORT
═══════════════════════════════════════
📈 BASIC STATISTICS
Total pages: 124
API endpoints: 87

📄 PAGES BY SECTION
loads              : 23 pages
drivers            : 15 pages
equipment          : 12 pages
...

🔌 API ENDPOINTS BY TYPE
Total unique API endpoints: 87
Top 20 API paths:
  15x  /api/loads
  12x  /api/drivers
  ...
```

---

## 📁 Check Your Results

After crawling, explore the `snapshot/` folder:

```
snapshot/
├── screenshots/          ← 📸 View these in File Explorer
│   ├── loads.png
│   ├── drivers.png
│   └── equipment.png
│
├── html/                 ← 📄 Raw HTML files
│
├── IMPLEMENTATION_CHECKLIST.md  ← ✅ Feature comparison
├── sitemap.txt          ← 🗺️ All routes found
└── api-endpoints.json   ← 🔌 All API calls
```

---

## 🎯 Next Steps: Use Results in MainTMS

### Compare Features

1. Open `snapshot/IMPLEMENTATION_CHECKLIST.md`
2. Review all ezLoads features
3. Compare with your MainTMS features
4. Identify gaps

### View Screenshots

1. Open `snapshot/screenshots/` folder
2. Browse all page designs
3. Note UI patterns you like
4. Implement similar designs in MainTMS

### Study API Structure

1. Open `snapshot/api-endpoints.json`
2. See how ezLoads structures their API
3. Compare with your FastAPI backend
4. Add missing endpoints if needed

---

## 🔄 Re-crawl Later

If ezLoads adds new features:

```powershell
# Login again (if session expired)
npm run login

# Crawl again
npm run crawl

# Analyze new results
npm run analyze
```

---

## ⚠️ Troubleshooting

| Problem | Solution |
|---------|----------|
| `tenant.json not found` | Run `npm run login` first |
| `Session expired` | Re-run `npm run login` |
| Too slow | Edit `config.json`: reduce `delayMin` and `delayMax` |
| Missing pages | Edit `config.json`: increase `maxDepth` |
| Timeout errors | Edit `config.json`: increase `timeout` |

---

## 📞 Common Questions

**Q: Is this legal?**  
A: Yes, as long as you have authorized access to the ezLoads account. You're just viewing pages you can already access.

**Q: Will ezLoads know I'm crawling?**  
A: It looks like normal browsing with random delays. No different than manually clicking through pages.

**Q: How often should I re-crawl?**  
A: Whenever you notice ezLoads has added new features you want to study.

**Q: Can I crawl other TMS systems?**  
A: Yes! Just modify `config.json` with different login URL and seed paths.

---

✨ **Happy crawling!**
