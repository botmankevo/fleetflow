#!/bin/bash
# Main TMS - Quick Start Script
# This script helps you get Main TMS running quickly

echo "🚀 Main TMS - Quick Start"
echo "========================="
echo ""

# Check if Docker is running
echo "Checking Docker..."
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi
echo "✅ Docker is running"
echo ""

# Check if .env files exist
echo "Checking environment files..."
if [ ! -f "backend/.env" ]; then
    echo "⚠️  backend/.env not found. Creating from example..."
    cp backend/.env.example backend/.env
    echo "📝 Please edit backend/.env and add your MAPBOX_API_KEY"
fi

if [ ! -f "frontend/.env.local" ]; then
    echo "⚠️  frontend/.env.local not found. Creating..."
    echo "NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000" > frontend/.env.local
    echo "NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here" >> frontend/.env.local
    echo "📝 Please edit frontend/.env.local and add your NEXT_PUBLIC_MAPBOX_TOKEN"
fi
echo ""

# Check if Mapbox token is set
if grep -q "your_mapbox_token_here" backend/.env 2>/dev/null; then
    echo "⚠️  WARNING: Mapbox token not set in backend/.env"
    echo "Get your token from https://mapbox.com and add it to backend/.env"
    echo ""
fi

if grep -q "your_mapbox_token_here" frontend/.env.local 2>/dev/null; then
    echo "⚠️  WARNING: Mapbox token not set in frontend/.env.local"
    echo "Get your token from https://mapbox.com and add it to frontend/.env.local"
    echo ""
fi

# Run migrations
echo "Running database migrations..."
cd backend
docker-compose run --rm backend alembic upgrade head
if [ $? -eq 0 ]; then
    echo "✅ Migrations complete"
else
    echo "⚠️  Migrations failed - you may need to run them manually"
fi
cd ..
echo ""

# Start services
echo "Starting services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to start (30 seconds)..."
sleep 30

# Check if services are running
echo ""
echo "Checking service status..."
docker-compose ps

echo ""
echo "========================="
echo "✅ Main TMS is starting!"
echo "========================="
echo ""
echo "Access your TMS at:"
echo "  Frontend: http://localhost:3001"
echo "  Backend:  http://localhost:8000"
echo "  API Docs: http://localhost:8000/docs"
echo ""
echo "View logs with: docker-compose logs -f"
echo "Stop services: docker-compose down"
echo ""
echo "First time? Create a user at: http://localhost:8000/docs"
echo "Use POST /auth/register"
echo ""
echo "Happy dispatching! 🚛"
