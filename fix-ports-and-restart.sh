#!/bin/bash

echo "🔧 The New Fuse - Port Configuration Fix & Restart"
echo "=================================================="

# Kill any existing processes on our target ports
echo "1. Stopping existing servers..."
pkill -f "node.*3000" 2>/dev/null || true
pkill -f "node.*3001" 2>/dev/null || true  
pkill -f "node.*3002" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
pkill -f "turbo" 2>/dev/null || true

# Wait a moment for processes to stop
sleep 2

# Check what's still running on our ports
echo "2. Checking port availability..."
PORT_3000=$(lsof -ti :3000)
PORT_3001=$(lsof -ti :3001)
PORT_3002=$(lsof -ti :3002)

if [ ! -z "$PORT_3000" ]; then
    echo "⚠️  Port 3000 still in use by PID $PORT_3000"
    kill -9 $PORT_3000 2>/dev/null || true
fi

if [ ! -z "$PORT_3001" ]; then
    echo "⚠️  Port 3001 still in use by PID $PORT_3001"
    kill -9 $PORT_3001 2>/dev/null || true
fi

if [ ! -z "$PORT_3002" ]; then
    echo "⚠️  Port 3002 still in use by PID $PORT_3002" 
    kill -9 $PORT_3002 2>/dev/null || true
fi

echo "3. Installing dependencies..."
yarn install

echo "4. Starting servers with correct port configuration..."
echo "   Frontend: http://localhost:3000"
echo "   API:      http://localhost:3001"
echo ""

# Start the development servers
echo "Starting API server on port 3001..."
yarn dev:api &
API_PID=$!

# Wait a moment for API to start
sleep 3

echo "Starting frontend on port 3000..."
yarn dev &
FRONTEND_PID=$!

# Wait a moment for frontend to start
sleep 5

echo ""
echo "✅ Servers should now be running:"
echo "   Frontend: http://localhost:3000"
echo "   API:      http://localhost:3001"
echo ""
echo "Process IDs:"
echo "   API PID: $API_PID"
echo "   Frontend PID: $FRONTEND_PID"
echo ""
echo "To stop servers: kill $API_PID $FRONTEND_PID"
echo "Or use: yarn dev:stop (if available)"

# Keep script running to monitor
echo "Press Ctrl+C to stop all servers..."
wait
