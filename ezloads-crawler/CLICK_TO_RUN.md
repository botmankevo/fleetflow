# 🚀 How to Run the Crawler

## The Problem
Running the crawler through the AI agent doesn't work well because:
- It requires an interactive browser
- You need to log in manually
- Background processes can't handle this properly

## ✅ The Solution

**Open PowerShell yourself** and run these commands:

### Option 1: One Command (Easiest)
```powershell
cd C:\Users\my self\.gemini\antigravity\scratch\MainTMS\ezloads-crawler
.\RUN_ALL.ps1
```

That's it! Everything is automated from there.

---

### Option 2: Step by Step
```powershell
cd C:\Users\my self\.gemini\antigravity\scratch\MainTMS\ezloads-crawler

# Step 1: Login (browser opens, log in, closes automatically)
node login-auto.js

# Step 2: Crawl (takes 10-20 min)
node crawl.js

# Step 3: Analyze
node analyze.js
```

---

## What Will Happen

### During Login:
1. Chrome browser opens
2. You log in to ezloads.net
3. Script detects when you're logged in
4. Browser closes, session saved

### During Crawl:
- Visits all pages (loads, drivers, equipment, etc.)
- Takes screenshots
- Saves HTML
- Records API calls
- Shows progress: `[12/400] Crawling: /loads/1656`

### During Analyze:
- Creates implementation checklist
- Generates sitemap
- Extracts API endpoints
- Compares with MainTMS

---

## Expected Output

```
snapshot/
├── screenshots/              ← 100+ PNG images
│   ├── loads.png
│   ├── loads_id_1656.png
│   ├── drivers.png
│   └── ...
├── html/                    ← Page sources
├── metadata/                ← Page info JSON
├── network.har              ← All API calls
├── api-endpoints.json       ← Endpoint list
├── sitemap.txt              ← All URLs found
└── IMPLEMENTATION_CHECKLIST.md  ← What to build
```

---

## Time Required
- **Login**: 30 seconds
- **Crawl**: 10-20 minutes
- **Analyze**: 10 seconds

**Total: ~20 minutes**

---

## After Crawling

Come back and tell me: **"Crawler finished"**

I'll help you:
1. Review the screenshots
2. Identify features to implement
3. Build them in MainTMS!

---

## Troubleshooting

### "Script won't run"
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

### "Playwright not installed"
```powershell
npx playwright install chromium
```

### "Node not found"
Download from: https://nodejs.org

---

## 🎯 Ready?

Open PowerShell and run:
```powershell
cd C:\Users\my self\.gemini\antigravity\scratch\MainTMS\ezloads-crawler
.\RUN_ALL.ps1
```

See you when it's done! 🚀
