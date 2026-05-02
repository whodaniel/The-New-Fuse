#!/bin/bash

# This script runs the entire application using Docker

echo "🐳 Starting The New Fuse using Docker..."

# Navigate to the project root
cd "$(dirname "$0")"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
  echo "❌ Docker is not installed. Please install Docker and try again."
  exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
  echo "❌ Docker Compose is not installed. Please install Docker Compose and try again."
  exit 1
fi

# Check if Docker daemon is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker daemon is not running. Please start Docker first."
  exit 1
fi

# Clean up any existing containers
echo "Cleaning up existing containers..."
docker-compose down --remove-orphans || echo "No containers to clean up"

# Run the application using Docker Compose
echo "Starting containers..."
COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 docker-compose up

echo "Docker containers stopped"
