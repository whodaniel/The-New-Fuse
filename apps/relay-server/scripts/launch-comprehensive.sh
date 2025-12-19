#!/bin/bash
set -e

echo "🚀 Launching The New Fuse..."

# Check Docker status first
echo "🐳 Checking Docker status..."
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi
echo "✅ Docker is running!"

# Check and setup environment
if [ ! -f ".env" ]; then
    echo "⚙️ Creating .env file from example..."
    cp .env.example .env
    echo "⚠️ Please update the .env file with your actual configuration values."
    echo "   Press Enter to continue or Ctrl+C to abort and update the .env file."
    read -r
fi

# Stop any existing services
echo "🛑 Stopping any existing services..."
docker-compose down --remove-orphans || true
for port in 3000 3001 3002 3003; do
    pid=$(lsof -ti :$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        echo "Stopping process on port $port (PID: $pid)"
        kill -9 $pid 2>/dev/null || true
    fi
done

# Clean install dependencies
echo "📦 Installing dependencies..."
bun clean
pnpm install --frozen-lockfile

# Build core packages in correct order
echo "🔨 Building core packages..."
bun --filter @the-new-fuse/types run build
bun --filter @the-new-fuse/utils run build
bun --filter @the-new-fuse/core run build
bun --filter @the-new-fuse/database run build
bun --filter @the-new-fuse/feature-tracker run build
bun --filter @the-new-fuse/feature-suggestions run build
bun --filter @the-new-fuse/ui run build

# Setup database
echo "🗄️ Setting up database..."
bun --filter @the-new-fuse/database run generate
bun --filter @the-new-fuse/database run migrate

# Start infrastructure services
echo "🛠️ Starting infrastructure services..."
docker-compose -f docker/development.yml up -d

# Wait for infrastructure to be ready
echo "⏳ Waiting for infrastructure services to be ready..."
sleep 10

# Start all services
echo "🚀 Starting all services..."
bun --filter @the-new-fuse/api run dev &
bun --filter @the-new-fuse/backend run dev &
bun --filter @the-new-fuse/frontend run dev &

# Verify services health
echo "🏥 Verifying services health..."
max_attempts=30
attempt=1
while [ $attempt -le $max_attempts ]; do
    echo "Checking services (attempt $attempt/$max_attempts)..."
    
    frontend_health=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "down")
    api_health=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health || echo "down")
    backend_health=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/health || echo "down")
    
    if [[ "$frontend_health" == "200" && "$api_health" == "200" && "$backend_health" == "200" ]]; then
        echo "✅ All services are healthy!"
        break
    fi
    
    attempt=$((attempt + 1))
    sleep 2
done

echo "✨ The New Fuse is now running!"
echo "
📝 Service URLs:
- Frontend: http://localhost:3000
- API: http://localhost:3001
- Backend: http://localhost:3002
- Health Dashboard: http://localhost:3003/health-dashboard
"

# Keep script running and capture logs
echo "📊 Streaming logs..."
trap "docker-compose down && pkill -P $$" EXIT
wait