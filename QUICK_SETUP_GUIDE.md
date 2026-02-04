# Main TMS - Quick Setup Guide

## 🚀 Get Your System Running in 5 Minutes

---

## Prerequisites

- Docker Desktop running
- At least 10GB free disk space
- Mapbox API token (free at https://mapbox.com)

---

## Step 1: Get Your Mapbox Token

1. Go to https://account.mapbox.com/
2. Sign up/login (free account)
3. Copy your **Default Public Token**
4. Keep it handy for Step 3

---

## Step 2: Configure Environment Variables

### Backend Configuration

Create `.env` file in `backend/` folder:

```env
# Copy from .env.example and fill in:
FLEETFLOW_ENV=dev
JWT_SECRET=your-secret-key-here
TOKEN_EXP_MINUTES=1440
DEBUG=false

DATABASE_URL=postgresql+psycopg2://fleetflow:fleetflow@db:5432/fleetflow
POSTGRES_DB=fleetflow
POSTGRES_USER=fleetflow
POSTGRES_PASSWORD=fleetflow

# NEW: Add your Mapbox key
MAPBOX_API_KEY=pk.your_actual_mapbox_token_here

# Optional: FMCSA key for higher rate limits
FMCSA_API_KEY=

# Keep existing keys
DROPBOX_ACCESS_TOKEN=
DROPBOX_ROOT_FOLDER=/MainTMS
GOOGLE_MAPS_API_KEY=

ENABLE_AIRTABLE=false
ENABLE_DROPBOX=true
ENABLE_GOOGLE_MAPS=false
ENABLE_MAPBOX=true
```

### Frontend Configuration

Create `.env.local` file in `frontend/` folder:

```env
NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_actual_mapbox_token_here
```

---

## Step 3: Run Database Migration

Open terminal in project root:

```bash
cd backend
alembic upgrade head
```

This adds the new fields for:
- Broker verification (MC, DOT, verified status)
- Mileage tracking (total miles, rate per mile)
- Enhanced stop data (coordinates, address details)

---

## Step 4: Start the System

### Option A: Docker (Recommended)

```bash
docker-compose up -d
```

Wait 30 seconds for services to start.

### Option B: Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install  # First time only
npm run dev
```

---

## Step 5: Test the New Features

### Open Your Browser

- **Frontend**: http://localhost:3001
- **Backend API Docs**: http://localhost:8000/docs

### Login

Use your existing credentials or create a new user.

### Test New Features

1. **Go to Loads Page** (`/admin/loads`)
   - Create or view a load
   - Click on load details

2. **Test Mapping**
   - Should see full route map
   - Color-coded rate badge
   - Mileage between stops

3. **Test Address Autocomplete**
   - Start typing an address
   - Should see suggestions appear

4. **Test Broker Verification**
   - Enter a broker MC or DOT number
   - Click "Verify Broker with FMCSA"
   - Should see verification results

---

## 🎨 What's New

### For Dispatchers/Admins:

1. **📍 Interactive Maps**
   - See full route with all stops
   - Visual markers for pickup/delivery
   - Auto-calculated mileage

2. **💰 Color-Coded Rates**
   - 🟢 Green: Excellent rate (>$2.50/mile)
   - 🟡 Yellow: Acceptable ($1.50-$2.50/mile)
   - 🔴 Red: Poor rate (<$1.50/mile)

3. **✅ Broker Verification**
   - Verify brokers with FMCSA database
   - Prevent fraud
   - See safety ratings

4. **🔍 Smart Address Entry**
   - Autocomplete as you type
   - Faster data entry
   - Fewer errors

### For Drivers:

1. **📱 Navigate Buttons**
   - One-click navigation to each stop
   - Opens in Google Maps
   - Works on mobile

2. **📍 Route Overview**
   - See entire route
   - Know what's next
   - Distance to each stop

---

## 🐛 Troubleshooting

### Maps Not Showing
- Check that `NEXT_PUBLIC_MAPBOX_TOKEN` is set in frontend `.env.local`
- Verify token is valid at https://account.mapbox.com/

### Address Autocomplete Not Working
- Check that `MAPBOX_API_KEY` is set in backend `.env`
- Check backend logs for API errors

### Broker Verification Failing
- FMCSA API is rate-limited (public endpoint)
- Try adding `FMCSA_API_KEY` for higher limits
- Check internet connection

### Database Errors
- Make sure you ran `alembic upgrade head`
- Check that PostgreSQL is running
- Verify DATABASE_URL is correct

### Docker Issues
- Make sure Docker Desktop is running
- Free up disk space (need 10GB+)
- Try: `docker-compose down && docker-compose up -d`

---

## 📚 Next Steps

1. **Add Your Mapbox Token** - This is the most important step!
2. **Test on Mobile** - Works great on phones/tablets
3. **Import Existing Loads** - See the mapping in action
4. **Train OCR** - Upload rate confirmations to improve extraction
5. **Customize Colors** - Adjust rate thresholds if needed

---

## 💡 Tips

- **Rate Thresholds**: Adjust in `backend/app/services/mapbox.py` `get_rate_color()` function
- **Map Style**: Change in `frontend/components/maps/MapboxMap.tsx` (line 33)
- **OCR Patterns**: Customize in `backend/app/services/rate_con_ocr.py`

---

## 🆘 Need Help?

Check these files:
- `IMPLEMENTATION_SUMMARY.md` - What we built
- `REBRANDING_CHECKLIST.md` - Remaining tasks
- `MAIN_TMS_IMPLEMENTATION_PLAN.md` - Full project plan

---

**You're ready to go! Happy dispatching! 🚛✨**
