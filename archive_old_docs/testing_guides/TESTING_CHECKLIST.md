# 🧪 Testing Checklist for New Features

## Prerequisites
- ✅ Backend running: http://localhost:8000
- ✅ Frontend running: http://localhost:3001
- ✅ Database migration applied (document_exchange table created)

---

## 1. 🎨 Logo & Branding Tests

### Visual Tests (Open Frontend)
1. **Login Page** (http://localhost:3001/login)
   - [ ] Logo appears in hero section with gradient "AI" and glowing dot
   - [ ] Logo in testimonial section
   - [ ] Hover over logo to see dot pulse animation

2. **Sidebar** (after login)
   - [ ] Full MAIN TMS logo with AI mark visible
   - [ ] Logo is properly sized and styled

---

## 2. 📄 Document Exchange System Tests

### Backend API Tests (http://localhost:8000/docs)
- `GET /pod/documents-exchange` - List documents for review
- `PATCH /pod/documents-exchange/{doc_id}` - Accept/reject documents
- `GET /loads/{load_id}/documents` - View accepted documents

### Frontend Workflow Test
1. Upload POD → Auto-creates document_exchange records
2. Admin reviews in Docs Exchange page
3. Accept/reject documents
4. Accepted documents appear in Load Details

---

## 3. 💰 Driver Payroll CRUD Tests

### New Endpoints (7 total)
- `POST /payroll/drivers/{driver_id}/pay-profile`
- `POST /payroll/drivers/{driver_id}/additional-payees`
- `DELETE /payroll/drivers/{driver_id}/additional-payees/{id}`
- `POST /payroll/drivers/{driver_id}/recurring-items`
- `PATCH /payroll/drivers/{driver_id}/recurring-items/{id}`
- `DELETE /payroll/drivers/{driver_id}/recurring-items/{id}`

---

## Quick Start Testing

1. **See the new logo:** Open http://localhost:3001/login
2. **Check API docs:** Open http://localhost:8000/docs
3. **Login credentials:** admin@coxtnl.com / admin123
4. **Test document exchange:** Navigate to Docs Exchange in admin menu
5. **Test payroll endpoints:** Use Swagger UI at /docs
