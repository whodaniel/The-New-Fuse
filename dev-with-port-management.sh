#!/bin/bash

echo "🚀 Starting The New Fuse with Port Management"
echo "============================================="

# Check for and resolve port conflicts
echo "Checking for port conflicts..."
tnf-ports conflicts --auto-resolve

# Show current port status
echo ""
tnf-ports status

echo ""
echo "Starting development servers..."

# Start API server
echo "Starting API server..."
yarn dev:api &
API_PID=$!

sleep 3

# Start frontend
echo "Starting frontend..."
yarn dev &
FRONTEND_PID=$!

echo ""
echo "✅ Development servers started!"
echo "Frontend: http://localhost:3000"
echo "API: http://localhost:3001"
echo ""
echo "Monitor ports: tnf-ports status"
echo "Check health: tnf-ports health"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for interrupt
trap "kill $API_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM

wait
