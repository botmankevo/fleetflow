#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Testing FleetFlow API${NC}\n"

# Test 1: Health check
echo -e "${BLUE}1. Testing health endpoint...${NC}"
HEALTH=$(curl -s http://localhost:8000/health)
echo "$HEALTH"
if echo "$HEALTH" | grep -q "ok"; then
    echo -e "${GREEN}✓ Health check passed${NC}\n"
else
    echo -e "${RED}✗ Health check failed${NC}\n"
    exit 1
fi

# Test 2: Root endpoint
echo -e "${BLUE}2. Testing root endpoint...${NC}"
ROOT=$(curl -s http://localhost:8000/)
echo "$ROOT"
if echo "$ROOT" | grep -q "FleetFlow"; then
    echo -e "${GREEN}✓ Root endpoint passed${NC}\n"
else
    echo -e "${RED}✗ Root endpoint failed${NC}\n"
    exit 1
fi

# Test 3: Swagger UI availability
echo -e "${BLUE}3. Testing Swagger UI...${NC}"
SWAGGER=$(curl -s http://localhost:8000/docs)
if echo "$SWAGGER" | grep -q "swagger-ui"; then
    echo -e "${GREEN}✓ Swagger UI is available at http://localhost:8000/docs${NC}\n"
else
    echo -e "${RED}✗ Swagger UI failed${NC}\n"
    exit 1
fi

# Test 4: ReDoc availability
echo -e "${BLUE}4. Testing ReDoc...${NC}"
REDOC=$(curl -s http://localhost:8000/redoc)
if echo "$REDOC" | grep -q "redoc"; then
    echo -e "${GREEN}✓ ReDoc is available at http://localhost:8000/redoc${NC}\n"
else
    echo -e "${RED}✗ ReDoc failed${NC}\n"
    exit 1
fi

echo -e "${GREEN}✨ All tests passed!${NC}"
echo -e "\n${BLUE}📚 API Documentation:${NC}"
echo "  - Swagger UI: http://localhost:8000/docs"
echo "  - ReDoc: http://localhost:8000/redoc"
echo "  - OpenAPI JSON: http://localhost:8000/openapi.json"
