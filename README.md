# MAIN TMS (Transportation Management System)

A modern, enterprise-grade transportation management and logistics platform built with Next.js 14, featuring real-time tracking, PWA capabilities, and a stunning DashSpace-inspired UI.

## 🚀 Features

- **Modern Dashboard**: Glassmorphism UI with real-time KPI widgets
- **Fleet Management**: Comprehensive vehicle tracking and maintenance scheduling
- **Progressive Web App**: Installable on mobile devices with offline capabilities
- **Real-time Updates**: WebSocket architecture for live fleet data
- **Mobile-First**: Touch-optimized with responsive design
- **Enterprise-Ready**: Role-based access control and multi-tenant support

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom DashSpace theme
- **Components**: Radix UI primitives + Shadcn UI
- **Icons**: Lucide React
- **State Management**: React Context + Hooks
- **Real-time**: WebSocket client with auto-reconnection

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL
- **ORM**: SQLAlchemy
- **Authentication**: JWT tokens

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- PostgreSQL 14+
- Docker & Docker Compose (for containerized deployment)

### Development Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd main-tms
```

2. **Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`

3. **Backend Setup**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The backend API will be available at `http://localhost:8000`

## 🐳 Docker Deployment

### Quick Start
```bash
docker-compose up -d
```

This will start:
- Frontend (Next.js) on port 3000
- Backend (FastAPI) on port 8000
- PostgreSQL database on port 5432

### Production Build
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.prod.yml up -d
```

## 📱 PWA Installation

MAIN TMS can be installed as a Progressive Web App:

1. Open the application in a mobile browser
2. Look for the "Install MAIN TMS" prompt
3. Tap "Install" to add to your home screen
4. Launch from your home screen for a native app experience

## 🎨 Theme Customization

The DashSpace theme can be customized in:
- `frontend/app/globals.css` - CSS variables for colors and effects
- `frontend/tailwind.config.js` - Tailwind theme configuration

## 📊 Key Components

### Dashboard Widgets
- **KPI Cards**: Active Loads, On-Duty Drivers, On-Time Rate, Safety Score
- **Fleet Status**: Real-time vehicle deployment overview
- **Maintenance Scheduler**: Upcoming service timeline
- **Live Shipments**: Active transport monitoring

### Navigation
- **Sidebar**: Categorized navigation with Lucide icons
- **Header**: Global search, notifications, user profile
- **Mobile**: Responsive hamburger menu with touch optimization

## 🔧 Configuration

### Environment Variables

**Frontend** (`.env.local`):
```env
NEXT_PUBLIC_API_BASE=/api
```

**Backend** (`.env`):
```env
DATABASE_URL=postgresql://user:password@localhost:5432/main_tms
SECRET_KEY=your-secret-key-here
```

## 🧪 Testing

```bash
# Frontend
cd frontend
npm run lint
npm run build

# Backend
cd backend
pytest
```

## 📈 Performance

- **Lighthouse Score**: 95+ (Performance, Accessibility, Best Practices, SEO)
- **Bundle Size**: ~87.5 kB shared JS (gzipped)
- **First Load**: < 2s on 3G
- **PWA**: Offline-ready with service worker

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For support, contact your system administrator or open an issue in the repository.

---

Built with ❤️ using the DashSpace design system
