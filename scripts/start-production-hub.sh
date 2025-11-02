#!/bin/bash

# The New Fuse - Production Hub Startup Script
# This script ensures all services are properly started and connected

set -e

echo "🚀 Starting The New Fuse Production Hub..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v bun &> /dev/null; then
        print_error "Bun is not installed. Please install Bun first."
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    print_success "All dependencies are installed"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    pnpm install
    print_success "Dependencies installed"
}

# Build the project
build_project() {
    print_status "Building the project..."
    pnpm run build:packages
    print_success "Project built successfully"
}

# Start the API server
start_api_server() {
    print_status "Starting API server..."
    cd apps/api
    pnpm run dev &
    API_PID=$!
    cd ../..
    
    # Wait for API server to be ready
    print_status "Waiting for API server to be ready..."
    for i in {1..30}; do
        if curl -f http://localhost:3000/health &> /dev/null; then
            print_success "API server is ready"
            return 0
        fi
        sleep 2
    done
    
    print_error "API server failed to start"
    return 1
}

# Start the frontend
start_frontend() {
    print_status "Starting frontend..."
    cd apps/frontend
    pnpm run dev &
    FRONTEND_PID=$!
    cd ../..
    
    # Wait for frontend to be ready
    print_status "Waiting for frontend to be ready..."
    for i in {1..30}; do
        if curl -f http://localhost:5173 &> /dev/null; then
            print_success "Frontend is ready"
            return 0
        fi
        sleep 2
    done
    
    print_error "Frontend failed to start"
    return 1
}

# Start the WebSocket server
start_websocket_server() {
    print_status "Starting WebSocket server..."
    # WebSocket server is integrated into the API server
    # Send request to start it
    curl -X POST http://localhost:3000/api/websocket/start &> /dev/null || true
    print_success "WebSocket server started"
}

# Start the Browser Hub
start_browser_hub() {
    print_status "Starting Browser Hub..."
    
    if command -v live-server &> /dev/null; then
        cd apps/browser-hub
        live-server . --port=8080 --entry-file=enhanced-hub.html --no-browser &
        HUB_PID=$!
        cd ../..
        print_success "Browser Hub started on http://localhost:8080"
    else
        print_warning "live-server not found. Opening static file..."
        if command -v open &> /dev/null; then
            open apps/browser-hub/enhanced-hub.html
        elif command -v xdg-open &> /dev/null; then
            xdg-open apps/browser-hub/enhanced-hub.html
        else
            print_warning "Please open apps/browser-hub/enhanced-hub.html in your browser"
        fi
    fi
}

# Health check
health_check() {
    print_status "Performing health check..."
    
    # Check API
    if curl -f http://localhost:3000/health &> /dev/null; then
        print_success "✓ API server is healthy"
    else
        print_error "✗ API server is not responding"
    fi
    
    # Check Frontend
    if curl -f http://localhost:5173 &> /dev/null; then
        print_success "✓ Frontend is healthy"
    else
        print_error "✗ Frontend is not responding"
    fi
    
    # Check WebSocket
    if curl -f http://localhost:3000/api/websocket/status &> /dev/null; then
        print_success "✓ WebSocket server is healthy"
    else
        print_warning "⚠ WebSocket server status unknown"
    fi
}

# Cleanup function
cleanup() {
    print_status "Cleaning up..."
    if [ ! -z "$API_PID" ]; then
        kill $API_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$HUB_PID" ]; then
        kill $HUB_PID 2>/dev/null || true
    fi
    print_success "Cleanup completed"
}

# Set up signal handlers
trap cleanup EXIT INT TERM

# Main execution
main() {
    echo "=================================="
    echo "🚀 The New Fuse Production Hub"
    echo "=================================="
    echo ""
    
    check_dependencies
    install_dependencies
    build_project
    
    echo ""
    print_status "Starting services..."
    
    start_api_server
    start_frontend
    start_websocket_server
    start_browser_hub
    
    echo ""
    health_check
    
    echo ""
    echo "=================================="
    print_success "🎉 All services are running!"
    echo "=================================="
    echo ""
    echo "📊 Service URLs:"
    echo "   • Browser Hub:     http://localhost:8080"
    echo "   • Frontend:        http://localhost:5173"
    echo "   • API Server:      http://localhost:3000"
    echo "   • Workflow Builder: http://localhost:5173/workflows/builder"
    echo ""
    echo "🔧 Management:"
    echo "   • API Health:      http://localhost:3000/health"
    echo "   • System Status:   http://localhost:3000/api/system/status"
    echo "   • WebSocket:       ws://localhost:3001"
    echo ""
    print_status "Press Ctrl+C to stop all services"
    
    # Keep the script running
    while true; do
        sleep 10
        # Optional: periodic health checks
        # health_check
    done
}

# Run main function
main "$@"