#!/bin/bash

echo "🛑 Stopping all containers..."
docker compose down

echo ""
echo "🧹 Removing old network and volumes..."
docker network rm fleetflow-network 2>/dev/null || true
# Note: NOT removing postgres_data volume to preserve data

echo ""
echo "🚀 Starting fresh..."
docker compose up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 5

echo ""
echo "📊 Checking status..."
docker compose ps

echo ""
echo "✅ Services started. Testing connectivity..."
sleep 2

echo ""
echo "🧪 Testing backend health..."
curl -s http://localhost:8000/health | jq .

echo ""
echo "🚀 Ready to seed user:"
echo "docker compose exec backend python -m app.scripts.seed_user --email admin@fleetflow.app --password admin123 --role platform_owner"
