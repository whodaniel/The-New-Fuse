#!/bin/bash
set -e

echo "🚀 Starting The New Fuse standalone frontend application using Docker..."

# Build the Docker image
docker build -t fuse-frontend -f Dockerfile.standalone-frontend .

# Run the Docker container
docker run -p 3000:3000 -v $(pwd)/apps/frontend:/app fuse-frontend

echo "✅ Frontend application is running at http://localhost:3000"
