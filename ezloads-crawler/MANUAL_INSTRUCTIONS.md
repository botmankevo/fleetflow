# 🎯 Manual Crawler Instructions

Since the automated scripts need interactive terminal input, follow these **manual steps** directly in PowerShell:

---

## 📍 Step 1: Open PowerShell in Crawler Directory

```powershell
cd C:\Users\my self\.gemini\antigravity\scratch\MainTMS\ezloads-crawler
```

---

## 🔐 Step 2: Run Login (MANUAL)

**Copy and paste this command:**

```powershell
npm run login
```

**What will happen:**
1. Browser opens to https://ezloads.net/apps
2. **You log in manually with your credentials**
3. **Wait until you see your ezLoads dashboard**
4. **Come back to PowerShell terminal**
5. **Press ENTER key**
6. Browser closes and saves session

⚠️ **IMPORTANT:**
- Do NOT close the browser manually
- Only press ENTER after you see your dashboard
- The terminal is waiting for your ENTER keypress

---

## 🕷️ Step 3: Run Crawler

**After login succeeds, run:**

```powershell
npm run crawl
```

**What will happen:**
- Crawls ~400 pages
- Takes 10-20 minutes
- Progress shown in terminal
- Everything saved to `snapshot/` folder

**Progress indicators:**
```
[1/400] Crawling: https://s1-cox-transportation01.ezloads.net/loads
📸 Capturing: https://...
  ✅ Captured: Loads (47 links found)
💾 Progress saved (10 pages)
```

---

## 📊 Step 4: Analyze Results

**After crawl completes, run:**

```powershell
npm run analyze
```

**Generates:**
- Implementation checklist
- API endpoints list
- Sitemap
- Statistics

---

## 📂 Step 5: View Results

**Open screenshots folder:**

```powershell
explorer snapshot\screenshots
```

**View implementation checklist:**

```powershell
code snapshot\IMPLEMENTATION_CHECKLIST.md
# or
notepad snapshot\IMPLEMENTATION_CHECKLIST.md
```

---

## ✅ Verification

**Check if login worked:**

```powershell
# Should show storageState.json and tenant.json
Get-ChildItem *.json
```

**Check crawl results:**

```powershell
# Should show snapshot folder
Get-ChildItem snapshot
```

---

## 🔧 Troubleshooting

### Login doesn't start
**Solution:** Make sure you're in the right directory:
```powershell
cd C:\Users\my self\.gemini\antigravity\scratch\MainTMS\ezloads-crawler
npm run login
```

### Browser closes immediately
**Cause:** You pressed ENTER too early or closed the browser manually

**Solution:** 
1. Run `npm run login` again
2. Log in to ezLoads
3. **Wait for dashboard to fully load**
4. Then press ENTER in PowerShell

### "tenant.json not found" error
**Cause:** Login didn't complete successfully

**Solution:** Re-run login process

### Crawl is slow
**Normal!** It takes 10-20 minutes to crawl 400 pages with random delays

---

## 🎯 Full Command Sequence

**Just copy-paste these one at a time:**

```powershell
# 1. Navigate
cd C:\Users\my self\.gemini\antigravity\scratch\MainTMS\ezloads-crawler

# 2. Login (browser opens, you log in, press ENTER)
npm run login

# 3. Crawl (takes 10-20 min)
npm run crawl

# 4. Analyze
npm run analyze

# 5. View results
explorer snapshot\screenshots
```

---

## 📞 Next Steps After Crawling

1. Browse screenshots to see all ezLoads pages
2. Review `IMPLEMENTATION_CHECKLIST.md` for feature comparison
3. Identify features you want to implement in MainTMS
4. Come back and we'll build them together!

---

✨ **Start now by running:** `npm run login`
