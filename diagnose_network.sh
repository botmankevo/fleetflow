#!/bin/bash

echo "🔍 Diagnosing Docker network connectivity issues..."
echo ""

# Check if containers are running
echo "📊 Container Status:"
docker compose ps
echo ""

# Check network
echo "🌐 Network Configuration:"
docker network inspect fleetflow-network 2>/dev/null | grep -A 20 "Containers" || echo "Network not found"
echo ""

# Try to ping postgres from backend
echo "🧪 Testing connectivity from backend to postgres:"
docker compose exec backend ping -c 2 postgres 2>&1 || echo "Ping failed (this is expected)"
echo ""

# Try to connect to postgres by IP
echo "📍 Checking PostgreSQL network info:"
POSTGRES_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' fleetflow-postgres 2>/dev/null)
echo "PostgreSQL IP: $POSTGRES_IP"
echo ""

# Test direct IP connection
if [ -n "$POSTGRES_IP" ]; then
    echo "🧪 Testing direct IP connection:"
    docker compose exec backend psql -h "$POSTGRES_IP" -U postgres -d fleetflow -c "SELECT 1;" 2>&1 | head -5
fi
