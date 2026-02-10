# 📱 MainTMS Sidebar Navigation - Complete Page List

**Updated:** February 6, 2026  
**Total Pages:** 27+

---

## 🗂️ SIDEBAR MENU STRUCTURE

### 📊 **Operations** (5 pages)
- **Overview** → `/admin` - Dashboard
- **Dispatch** → `/admin/dispatch` - Dispatch board
- **Loads** → `/admin/loads` - Load management
- **Docs Exchange** → `/admin/docs-exchange` - Document management
- **Analytics** → `/admin/analytics` - Business analytics

### 👥 **Partners** (3 pages)
- **Drivers** → `/admin/drivers` - Driver management
- **Customers** → `/admin/customers` - **846 real customers here!**
- **Vendors** → `/admin/vendors` - Vendor management

### 🚛 **Fleet** (2 pages)
- **Equipment** → `/admin/equipment` - Trucks & trailers
- **Maintenance** → `/admin/maintenance` - Maintenance tracking

### ⛽ **Logistics** (3 pages)
- **Fuel Cards** → `/admin/fuel/cards` - Fuel card management
- **Fuel Logs** → `/admin/fuel/transactions` - Transaction logs
- **Tolls** → `/admin/tolls` - Toll tracking

### 💰 **Financials** (4 pages)
- **Payroll** → `/admin/payroll` - Settlement system
- **Accounting** → `/admin/accounting` - Financial reports
- **Invoices** → `/admin/invoices` - Invoice generation
- **Expenses** → `/admin/expenses` - Expense tracking

### 🔌 **Integrations** (4 pages) **← NEW SECTION!**
- **QuickBooks** → `/admin/quickbooks` - QuickBooks OAuth & Sync
- **Load Boards** → `/admin/loadboards` - DAT & TruckStop search
- **Communications** → `/admin/communications` - Email & SMS
- **Live Tracking** → `/admin/tracking` - GPS & HOS monitoring

### 🛡️ **Admin** (3 pages)
- **Safety** → `/admin/safety` - Safety compliance
- **IFTA** → `/admin/ifta` - IFTA reporting
- **User Management** → `/admin/users` - User accounts

### 📄 **Additional Pages** (3 pages)
- **POD History** → `/admin/pod-history` - Proof of delivery
- **Account** → `/admin/account` - User profile
- **Settings** → Various settings pages

---

## 🎯 **NEW PAGES YOU SHOULD SEE**

After restarting the frontend, you should see these in the sidebar:

### **Integrations Section:**
1. ✨ **QuickBooks** - Connect and sync with QuickBooks
2. ✨ **Load Boards** - Search DAT & TruckStop for loads
3. ✨ **Communications** - Send emails and SMS
4. ✨ **Live Tracking** - View driver locations and HOS

---

## 🔍 **WHERE TO FIND YOUR 846 CUSTOMERS**

**Main Path:**
1. Look for **"Partners"** section in sidebar
2. Click **"Customers"**
3. You'll see all 846 real customers!

**Direct URL:**
```
http://localhost:3000/admin/customers
```

---

## 🐛 **IF YOU DON'T SEE THE NEW PAGES**

### Try these steps:

1. **Hard Refresh Browser:**
   - Press `Ctrl + Shift + R` (Chrome/Edge)
   - Or `Ctrl + F5` (Firefox)

2. **Clear Browser Cache:**
   - Open DevTools (F12)
   - Right-click refresh button
   - Select "Empty Cache and Hard Reload"

3. **Check the Frontend Build:**
   - Look at the PowerShell window
   - Wait for "✓ Ready in XXms"
   - Should show no errors

4. **Restart Frontend Again:**
   ```bash
   # In the frontend folder
   rm -rf .next
   npm run dev
   ```

5. **Check URL:**
   - Make sure you're on `http://localhost:3000`
   - Not `http://localhost:3001` or another port

---

## 📸 **WHAT YOU SHOULD SEE**

### Sidebar Structure:
```
📊 Operations
   - Overview
   - Dispatch
   - Loads
   - Docs Exchange
   - Analytics

👥 Partners
   - Drivers
   - Customers ← 846 CUSTOMERS HERE!
   - Vendors

🚛 Fleet
   - Equipment
   - Maintenance

⛽ Logistics
   - Fuel Cards
   - Fuel Logs
   - Tolls

💰 Financials
   - Payroll
   - Accounting
   - Invoices
   - Expenses

🔌 Integrations ← NEW!
   - QuickBooks ← NEW!
   - Load Boards ← NEW!
   - Communications ← NEW!
   - Live Tracking ← NEW!

🛡️ Admin
   - Safety
   - IFTA
   - User Management
```

---

## ✅ **VERIFICATION CHECKLIST**

After refresh, check:
- [ ] Can see "Integrations" section in sidebar
- [ ] Can click "QuickBooks" and page loads
- [ ] Can click "Load Boards" and page loads
- [ ] Can click "Communications" and page loads
- [ ] Can click "Live Tracking" and page loads
- [ ] Can click "Customers" and see 846 customers

---

## 🎯 **DIRECT URLS TO TEST**

Test these URLs directly in your browser:

```
http://localhost:3000/admin/customers          ← 846 customers
http://localhost:3000/admin/quickbooks         ← QuickBooks page
http://localhost:3000/admin/loadboards         ← Load boards
http://localhost:3000/admin/communications     ← Email/SMS
http://localhost:3000/admin/tracking           ← GPS tracking
http://localhost:3000/admin/accounting         ← Accounting
http://localhost:3000/admin/invoices           ← Invoices
```

If these pages load directly, the issue is just the sidebar not refreshing.

---

## 💡 **QUICK FIX**

If sidebar still doesn't update after cache clear:

1. Stop the dev server (Ctrl+C in PowerShell)
2. Delete `.next` folder
3. Run `npm run dev` again
4. Hard refresh browser (Ctrl+Shift+R)

---

**The pages exist and work! You just need to clear the cache to see them in the sidebar.** ✅
