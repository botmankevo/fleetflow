# 🚀 Enhanced Crawler Features

## ✅ What's New

### 1. **Link Graph Extraction**
- Captures all outgoing links from each page
- Stores as adjacency list: `{ pageUrl: [linkedUrl1, linkedUrl2, ...] }`
- Includes:
  - `<a href>` elements
  - Navigation items (`nav a`, `.sidebar a`, `.menu a`)
  - Elements with `role="navigation"`
- **Output:** `snapshot/link-graph.json`

### 2. **Per-Page Endpoint Attribution**
- Tracks which API endpoints are called on each page
- Listens to all XHR/fetch requests
- Records for each request:
  - URL
  - HTTP method (GET, POST, etc.)
  - Status code
  - Content-Type
  - Source page URL
- **Output:** `snapshot/page-endpoints.json`

### 3. **Enhanced Endpoint Tracking**
- **Global deduped list:** `snapshot/api-endpoints.json`
- **Full details with attribution:** `snapshot/endpoint-details.json`
- Shows which pages trigger which API calls

### 4. **Comprehensive Statistics**
Enhanced `summary.json` now includes:

```json
{
  "statistics": {
    "pagesVisited": 13,
    "uniqueLinks": 45,
    "uniqueEndpoints": 27,
    "totalEndpointCalls": 156
  },
  "topPagesByEndpoints": [
    { "page": "https://...loads", "count": 23 },
    { "page": "https://...drivers", "count": 18 }
  ]
}
```

---

## 📊 Output Files

| File | Description |
|------|-------------|
| `link-graph.json` | Page-to-page navigation structure |
| `page-endpoints.json` | API endpoints grouped by page |
| `api-endpoints.json` | Deduplicated list of all endpoints |
| `endpoint-details.json` | Full endpoint data with page attribution |
| `summary.json` | Statistics and analysis |
| `sitemap.txt` | Human-readable page list |
| `metadata.json` | Page metadata (title, URL, etc.) |

---

## 🎯 Use Cases

### **1. Build Navigation Menu**
```javascript
// Read link-graph.json to understand site structure
const linkGraph = require('./snapshot/link-graph.json');
const homepageLinks = linkGraph['https://tenant.ezloads.net/'];
// Use to build your sidebar menu
```

### **2. Understand API Architecture**
```javascript
// See which endpoints each page uses
const pageEndpoints = require('./snapshot/page-endpoints.json');
const loadsPageAPIs = pageEndpoints['https://tenant.ezloads.net/loads'];
// Implement the same API calls in MainTMS
```

### **3. Analyze Data Flow**
```javascript
// Find most API-intensive pages
const summary = require('./snapshot/summary.json');
console.log(summary.topPagesByEndpoints);
// Optimize these pages first
```

---

## 🚀 How to Run

```powershell
cd ezloads-crawler
.\run_crawler.ps1
```

**The crawler will now:**
1. ✅ Map all page links
2. ✅ Track API calls per page
3. ✅ Generate comprehensive statistics
4. ✅ Show you exactly how ezLoads works!

---

## 📈 What You'll Learn

After crawling, you'll know:
- 🗺️ **Site structure** - How pages connect
- 🔌 **API architecture** - What endpoints exist
- 📊 **Data patterns** - Which pages load what data
- 🎯 **Implementation roadmap** - What to build first

---

## 🎉 Ready to Test!

Run the enhanced crawler and come back with the results!
