#!/bin/bash
set -e

cd /workspaces/fleetflow

echo "📝 Checking git status..."
git status

echo ""
echo "🔄 Adding files..."
git add README.md .env.example docker-compose.yml backend/Dockerfile frontend/package.json frontend/Dockerfile

echo ""
echo "✅ Staging complete. Files to commit:"
git status --short

echo ""
echo "📦 Committing changes..."
git commit -m "docs: Add comprehensive README with setup instructions and environment config

- Created detailed README.md with prerequisites, quick start guide, manual setup, database migrations
- Added .env.example with all required environment variables
- Created docker-compose.yml for local development (PostgreSQL, backend, frontend)
- Added Dockerfiles for backend (FastAPI) and frontend (Next.js)
- Updated frontend package.json with Next.js and dependencies
- Includes end-to-end POD submission testing guide
- Added API documentation and troubleshooting sections
- Includes deployment guide for production environments"

echo ""
echo "🚀 Pushing to main branch..."
git push origin main

echo ""
echo "✨ Done! Changes pushed to GitHub."
