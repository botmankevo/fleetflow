# MainTMS Login Credentials

## ✅ Login is Working!

Your MainTMS system is accessible at: **http://localhost:3001**

---

## 🔐 Available Accounts

### Admin Account
- **Email**: `admin@coxtnl.com`
- **Password**: `admin123`
- **Role**: Administrator
- **Access**: Full system access (payroll, drivers, loads, docs, etc.)

### Driver Account
- **Email**: `driver@coxtnl.com`
- **Password**: `admin123`
- **Role**: Driver
- **Access**: Driver portal (POD submission, expenses, pay history)

---

## 🌐 System URLs

| Service | URL | Status |
|---------|-----|--------|
| **Frontend** | http://localhost:3001 | ✅ Running |
| **Backend API** | http://localhost:8000 | ✅ Running |
| **API Documentation** | http://localhost:8000/docs | ✅ Running |

---

## 📱 How to Login

1. Open your browser to **http://localhost:3001**
2. You should see the login page
3. Enter credentials:
   - Email: `admin@coxtnl.com`
   - Password: `admin123`
4. Click "Sign In"

---

## 🎯 After Login - What You Can Do

### Admin Features Available:
- ✅ **Drivers** - Add Manuel and manage driver records
- ✅ **Loads** - Enter your real load data
- ✅ **Payroll** - Generate settlements and pay drivers
- ✅ **Documents Exchange** - Upload/review documents
- ✅ **Dispatch** - Manage load assignments
- ✅ **Analytics** - View performance metrics
- ✅ **Equipment** - Track trucks and trailers
- ✅ **Customers** - Manage broker relationships

---

## ⚠️ Important Notes

1. **Data Status**: The database currently has demo data (4 test drivers, 15 sample loads)
2. **Manuel is Missing**: You'll need to add Manuel as a new driver
3. **Real Loads**: Your real load data needs to be re-entered
4. **Password Security**: Consider changing the password after first login

---

## 🔄 Next Steps

1. **Login** with admin credentials
2. **Add Manuel** - Go to Drivers section and create new driver
3. **Enter Loads** - Add your real load data
4. **Test Features** - Try payroll, docs exchange, and other new features

---

## 🆘 Troubleshooting

**Can't access http://localhost:3001?**
- Check if containers are running: `docker ps`
- Restart if needed: `cd "C:\Users\my self\.gemini\antigravity\scratch\MainTMS" ; docker-compose up -d`

**Login fails?**
- Verify you're using `admin@coxtnl.com` (not admin@maintms.com)
- Password is `admin123` (all lowercase)

**Need to reset password?**
- Contact support or use the change password feature in the UI

---

**Last Updated**: February 5, 2026
**System Status**: ✅ All services running and healthy
