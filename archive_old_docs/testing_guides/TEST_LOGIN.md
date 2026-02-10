# Login Test Instructions

## Current Status

✅ **Backend**: Running and responding correctly to login requests (returns access tokens)
✅ **Frontend**: Running on http://127.0.0.1:3001
✅ **CORS**: Configured to allow all origins
✅ **API_BASE**: Set to http://127.0.0.1:8000
✅ **Login code**: Looks correct, uses apiFetch properly

## The Problem

You're unable to login - but I need to know the EXACT symptoms to fix it.

---

## Test 1: Hard Refresh (CRITICAL - DO THIS FIRST!)

The most likely issue is your browser has cached OLD JavaScript that doesn't have the correct API URL.

**Steps:**
1. Open http://127.0.0.1:3001/login
2. Press **F12** (opens Developer Tools)
3. Click the **"Network"** tab
4. Check the box **"Disable cache"**
5. Press **Ctrl + Shift + R** (hard refresh)
6. Try logging in with:
   - Email: `admin@coxtnl.com`
   - Password: `admin123`

**What to watch for:**
- In the Network tab, do you see a request to `/auth/login`?
- What status code does it show? (200, 404, 500, or failed?)
- Click on the `/auth/login` request and check the "Response" tab

---

## Test 2: Check Console Errors

1. With Developer Tools open (F12)
2. Click the **"Console"** tab
3. Try logging in
4. Look for error messages

**Common errors:**
- ❌ `Failed to fetch` = Network issue, can't reach backend
- ❌ `ERR_CONNECTION_REFUSED` = Backend not running
- ❌ `CORS error` = Cross-origin blocked
- ❌ `401 Unauthorized` = Wrong credentials
- ❌ `404 Not Found` = Wrong API endpoint

---

## Test 3: Verify API Base URL

In the Console tab (F12), type this and press Enter:

```javascript
fetch('http://127.0.0.1:8000/health').then(r => r.json()).then(console.log)
```

**Expected result:** `{ok: true}`

If you get an error, the browser can't reach the backend.

---

## Test 4: Manual Login Test

In the Console tab (F12), type this and press Enter:

```javascript
fetch('http://127.0.0.1:8000/auth/login', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({email: 'admin@coxtnl.com', password: 'admin123'})
}).then(r => r.json()).then(console.log)
```

**Expected result:** `{access_token: "eyJ...", token_type: "bearer"}`

If this works, then the issue is in the frontend code/cache.

---

## Test 5: Check What API URL Frontend Is Using

In the Console tab (F12), type this and press Enter:

```javascript
console.log(process.env.NEXT_PUBLIC_API_BASE || window.location.origin)
```

**Expected result:** `http://127.0.0.1:8000`

If it shows something different (like `http://localhost:8000` or `http://localhost:3001`), that's the problem.

---

## What To Tell Me

After running these tests, please tell me:

1. **Hard Refresh done?** Yes/No
2. **Network tab shows /auth/login request?** Yes/No
3. **Status code of /auth/login?** (200, 404, failed, etc.)
4. **Console errors?** (exact error message)
5. **Test 3 result?** (did fetch health work?)
6. **Test 4 result?** (did manual login work?)
7. **Test 5 result?** (what API URL is it using?)

---

## Quick Fix If It's Cache

If you confirm it's a cache issue:

1. Close ALL browser windows/tabs
2. Clear browser cache:
   - Press Ctrl + Shift + Delete
   - Select "Cached images and files"
   - Select "All time"
   - Click "Clear now"
3. Reopen browser
4. Go to http://127.0.0.1:3001/login
5. Try logging in

OR use Incognito:
1. Press Ctrl + Shift + N
2. Go to http://127.0.0.1:3001/login  
3. Try logging in

---

This will help me identify the exact issue!
