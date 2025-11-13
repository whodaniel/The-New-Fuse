#!/bin/bash
set -e

echo "🚀 Starting The New Fuse frontend in development mode using Docker..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker and try again."
  exit 1
fi

# Build and start the frontend container
echo "🐳 Building and starting frontend container..."
docker-compose -f docker-compose.dev.yml up --build frontend

echo "✅ Frontend is running at http://localhost:3000"
