# Main TMS - Implementation Plan

## 🎯 Project Overview

**Project Name**: Main TMS (formerly FleetFlow)  
**Focus**: AI-powered TMS with emphasis on "AI" in branding  
**Target**: Enterprise multi-tenant trucking management system  
**Status**: Testing with partner company, preparing for commercial sale

---

## 📋 Priority Features to Implement

### ✅ Phase 1: Branding & Core Infrastructure (In Progress)
1. **Rebrand to Main TMS**
   - Update all references from FleetFlow to Main TMS
   - Integrate AI-focused logo (blue gradient with upward arrow)
   - Update environment variables and configs
   - Update documentation

2. **Mapbox Integration for Commercial Truck Routing**
   - Replace Google Maps with Mapbox
   - Implement truck-specific routing (avoid restricted roads)
   - Calculate accurate mileage between stops
   - Support for multi-stop load optimization

---

## 🗺️ Phase 2: Mapping & Route Features

### Dashboard Mapping
- Real-time fleet location overview
- Active load routes visualization
- Driver status on map

### Load Details Page Mapping
- Full route visualization with all stops
- Mileage between each stop
- **Color-coded rate per mile**:
  - 🟢 Green: >$2.50/mile (excellent rate)
  - 🟡 Yellow: $1.50-$2.50/mile (acceptable)
  - 🔴 Red: <$1.50/mile (poor rate)
- Clickable addresses

### Driver Portal Mapping
- Current load route with turn-by-turn
- Clickable addresses that open navigation
- Next stop highlighted
- ETA calculations

---

## 🔍 Phase 3: Smart Data Entry

### Address Autocomplete
- Integration with address APIs (Mapbox Geocoding)
- Company name suggestions from database
- Historical address matching
- Auto-complete city, state, zip

### FMCSA Safer Integration
- Real-time broker verification
- MC/DOT number lookup
- Cross-reference with FMCSA database
- Display broker safety rating
- Fraud prevention

---

## 🤖 Phase 4: AI-Powered OCR & Document Extraction

### Rate Confirmation OCR
- Train on existing rate cons in Dropbox/Rate Cons folder
- Extract key fields automatically:
  - Load number
  - Broker name & MC/DOT
  - Rate amount
  - Pickup/delivery addresses
  - Dates and times
  - PO numbers
- Confidence scoring
- Manual review for low-confidence extractions

---

## 🎨 Phase 5: Beautiful UX Enhancement

### Admin Portal
- Refined color schemes
- Smooth animations and transitions
- Improved data visualization
- Enhanced mobile responsiveness

### Driver Portal
- Simple, touch-friendly interface
- Large, easy-to-read text
- Quick actions (POD upload, expenses)
- Offline capability

---

## 📊 Technical Architecture

### Backend Updates Needed
- New Mapbox service integration
- FMCSA API client
- Enhanced OCR/AI extraction service
- Mileage calculation engine

### Frontend Updates Needed
- Mapbox GL JS components
- Interactive map widgets
- Enhanced load detail views
- Address autocomplete components

### Database Changes
- Add mileage fields to LoadStop model
- Add broker verification fields to Load model
- Add OCR confidence scores to LoadExtraction

---

## 🚀 Next Steps

1. Start with Mapbox integration (backend + frontend)
2. Rebrand all FleetFlow references to Main TMS
3. Implement mileage calculations and color-coding
4. Add address autocomplete
5. Integrate FMCSA API
6. Train OCR on rate confirmations
7. Polish UX/UI

---

**Created**: February 2026  
**Last Updated**: February 2026
