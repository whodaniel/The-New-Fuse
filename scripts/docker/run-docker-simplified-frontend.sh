#!/bin/bash
set -e

echo "🚀 Starting simplified React frontend for The New Fuse using Docker..."

# Build and start the Docker container
docker-compose -f docker-compose.simplified-frontend.yml up --build

echo "✅ Frontend application is running at http://localhost:3000"
