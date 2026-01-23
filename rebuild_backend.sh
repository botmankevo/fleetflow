#!/bin/bash

echo "🔨 Rebuilding backend container..."
docker compose build backend

echo ""
echo "🚀 Starting backend..."
docker compose up -d backend

echo "⏳ Waiting for backend to start..."
sleep 4

echo ""
echo "🧪 Testing health endpoint..."
for i in {1..5}; do
    RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:8000/health 2>/dev/null || echo "failed\n000")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ Backend is running!"
        echo ""
        echo "📊 API Status:"
        curl -s http://localhost:8000/health | jq .
        echo ""
        echo "📚 Documentation available at:"
        echo "   - Swagger: http://localhost:8000/docs"
        echo "   - ReDoc: http://localhost:8000/redoc"
        exit 0
    fi
    
    echo "Attempt $i/5... (got HTTP $HTTP_CODE)"
    sleep 1
done

echo ""
echo "❌ Backend failed to start. Checking logs..."
docker logs fleetflow-backend 2>&1 | tail -30
exit 1
