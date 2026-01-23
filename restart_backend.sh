#!/bin/bash

echo "🔄 Restarting backend container..."
docker restart fleetflow-backend

echo "⏳ Waiting for backend to start..."
sleep 3

echo "📊 Checking backend health..."
for i in {1..10}; do
    RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:8000/health 2>/dev/null)
    HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ Backend is running!"
        echo ""
        echo "📚 API Documentation:"
        echo "   Swagger: http://localhost:8000/docs"
        echo "   ReDoc: http://localhost:8000/redoc"
        echo ""
        curl -s http://localhost:8000/health | jq .
        exit 0
    fi
    
    echo "Attempt $i/10... (HTTP $HTTP_CODE)"
    sleep 1
done

echo "❌ Backend failed to start"
echo ""
echo "Checking logs..."
docker logs fleetflow-backend | tail -20
exit 1
