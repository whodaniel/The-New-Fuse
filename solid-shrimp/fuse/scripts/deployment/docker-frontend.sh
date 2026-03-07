#!/bin/bash
set -e

echo "🚀 Starting The New Fuse frontend application using Docker..."

# Build and start the Docker container
docker-compose -f docker-compose.frontend.yml up --build

echo "✅ Frontend application is running at http://localhost:3000"
