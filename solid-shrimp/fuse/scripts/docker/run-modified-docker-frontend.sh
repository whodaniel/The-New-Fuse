#!/bin/bash
set -e

echo "🚀 Starting The New Fuse frontend application using modified Docker setup..."

# Build and start the Docker container
docker-compose -f docker-compose.frontend.modified.yml up --build

echo "✅ Frontend application is running at http://localhost:3000"
