# Main TMS Rebranding Checklist

## Overview
Rebranding from FleetFlow to **Main TMS** with focus on AI-powered features.

## ✅ Completed

### Backend
- [x] Updated `app/main.py` app title to "MAIN TMS"
- [x] Updated `app/core/config.py` app_name to "MAIN TMS"
- [x] Added Mapbox API integration
- [x] Added FMCSA API integration
- [x] Created database migrations for new fields

### Frontend
- [x] Package.json already renamed to "main-tms-frontend"
- [x] Added Mapbox GL dependencies
- [x] Created Mapbox map components
- [x] Created address autocomplete component
- [x] Created broker verification component

## 🔄 To Do

### Environment Variables
- [ ] Rename `.env` references from FleetFlow to Main TMS
- [ ] Update DROPBOX_ROOT_FOLDER from `/FleetFlow` to `/MainTMS`
- [ ] Add MAPBOX_API_KEY to .env files
- [ ] Add FMCSA_API_KEY to .env files (optional)

### Frontend UI
- [ ] Update logo.jpeg references to show Main TMS logo
- [ ] Update page titles and metadata
- [ ] Update manifest.json app name
- [ ] Update any "FleetFlow" text in components

### Documentation
- [ ] Update README.md with Main TMS branding
- [ ] Update all documentation files
- [ ] Update deployment guides

### Docker
- [ ] Update docker-compose.yml service names
- [ ] Update Docker container names
- [ ] Update volume names

### Database
- [ ] Run new migration: `add_mapbox_broker_fields.py`
- [ ] Consider renaming database from `fleetflow` to `maintms` (optional)

## 🎨 Logo Integration

The Main TMS logo emphasizes "AI" with:
- Blue gradient on the "AI" letters
- Upward growth arrow
- Professional black/blue color scheme

Location: `.gemini/antigravity/scratch/fleetflow/frontend/public/logo.jpeg`

## 📝 Notes

- Keep backwards compatibility during transition
- Update user-facing text first
- Database rename can be done later if needed
- Focus on getting features working with new branding

---
**Last Updated**: February 3, 2026
