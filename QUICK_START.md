# 🚀 MAIN TMS - Quick Start Guide

**Get up and running in 5 minutes!**

---

## 📦 What You Need

- Docker Desktop (recommended)
- OR Python 3.9+ and Node.js 18+ (manual setup)
- PostgreSQL 14+ (if not using Docker)

---

## ⚡ Option 1: Docker (Easiest - RECOMMENDED)

### Step 1: Start Everything
```bash
cd "C:\Users\my self\.gemini\antigravity\scratch\fleetflow"
docker-compose up -d
```

### Step 2: Access MAIN TMS
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### Step 3: Login
- Default user will be created on first run
- Check backend logs for credentials

**That's it! You're running MAIN TMS!**

---

## 🔧 Option 2: Manual Setup

### Backend Setup
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Set up database
createdb main_tms

# Run migrations
alembic upgrade head

# Create admin user
python -m app.scripts.seed_user

# Start server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

### Access Points
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## 🎯 First Steps After Install

1. **Login** to the admin portal
2. **Add your carriers** in the Carriers section
3. **Add your drivers** in the Drivers section
4. **Add your equipment** (trucks/trailers)
5. **Create your first load**!

---

## 📱 Install as Mobile App (PWA)

### iOS
1. Open http://localhost:3001 in Safari
2. Tap the Share button
3. Tap "Add to Home Screen"
4. Tap "Add"

### Android
1. Open http://localhost:3001 in Chrome
2. Tap the menu (3 dots)
3. Tap "Add to Home screen"
4. Tap "Add"

---

## 🔍 Troubleshooting

### Docker containers won't start
```bash
docker-compose down
docker-compose up -d --build
```

### Port already in use
Edit `docker-compose.yml` and change port mappings

### Database connection error
Check that PostgreSQL container is running:
```bash
docker-compose ps
docker-compose logs db
```

---

## 📚 Next Steps

- Read: `IMPLEMENTATION_ROADMAP.md` for complete deployment guide
- Configure: Add your Airtable, Dropbox, Maps API keys in `.env`
- Customize: Update branding, add your logo
- Deploy: Follow production deployment guide

---

## 🆘 Need Help?

1. Check `IMPLEMENTATION_ROADMAP.md`
2. Review `docs/RUNBOOK.md`
3. Check Docker logs: `docker-compose logs -f`

---

**Built for MAIN TMS Operations**
