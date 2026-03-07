#!/bin/bash

# Start Development Environment for A1-Inter-LLM-Com
# This script initializes all necessary services for development

set -e  # Exit on any error

# Color codes for output
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

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
check_port() {
    lsof -ti:$1 >/dev/null 2>&1
}

# Function to kill process on port
kill_port() {
    if check_port $1; then
        print_warning "Port $1 is in use. Killing existing process..."
        lsof -ti:$1 | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
}

# Main execution
main() {
    print_status "Starting A1-Inter-LLM-Com Development Environment..."
    
    # Check prerequisites
    print_status "Checking prerequisites..."
    
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js 18 or higher."
        exit 1
    fi
    
    if ! command_exists npm; then
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        print_error "Node.js version 16 or higher is required. Current version: $(node --version)"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        print_status "Installing dependencies..."
        pnpm install
        print_success "Dependencies installed"
    else
        print_status "Dependencies already installed"
    fi
    
    # Clean up any existing processes
    print_status "Cleaning up existing processes..."
    kill_port 3000  # Agency Hub
    kill_port 3001  # MCP Server
    kill_port 3002  # WebSocket Server
    kill_port 8080  # Frontend Dev Server
    kill_port 9090  # Prometheus (if running)
    
    # Create logs directory if it doesn't exist
    mkdir -p logs
    
    # Set up environment variables
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            print_status "Creating .env file from .env.example..."
            cp .env.example .env
        else
            print_status "Creating basic .env file..."
            cat > .env << EOF
# Development Environment Configuration
NODE_ENV=development
PORT=3000
HOST=localhost

# Database
DATABASE_URL=sqlite:./dev.db

# Authentication
JWT_SECRET=dev-secret-key-change-in-production
AUTH_EXPIRY=3600

# MCP Server
MCP_SERVER_PORT=3001
MCP_SERVER_HOST=localhost

# WebSocket
WEBSOCKET_PORT=3002

# Logging
LOG_LEVEL=debug
LOG_FILE=logs/app.log

# Development Features
HOT_RELOAD=true
DEBUG_MODE=true
METRICS_ENABLED=true
EOF
        fi
        print_success "Environment configuration created"
    fi
    
    # Build TypeScript if needed
    if [ -f "tsconfig.json" ]; then
        print_status "Checking TypeScript compilation..."
        if command_exists tsc; then
            pnpm run build || print_warning "TypeScript build failed, continuing with development mode"
        fi
    fi
    
    # Start services in background
    print_status "Starting services..."
    
    # Start Agency Hub
    if [ -f "packages/agency-hub/package.json" ]; then
        print_status "Starting Agency Hub on port 3000..."
        cd packages/agency-hub
        pnpm run dev > ../../logs/agency-hub.log 2>&1 &
        AGENCY_HUB_PID=$!
        cd ../..
        echo $AGENCY_HUB_PID > .pids/agency-hub.pid
    elif [ -f "agency.controller.ts" ]; then
        print_status "Starting Agency Hub (standalone)..."
        pnpm run start:agency-hub > logs/agency-hub.log 2>&1 &
        AGENCY_HUB_PID=$!
        echo $AGENCY_HUB_PID > .pids/agency-hub.pid
    fi
    
    # Start MCP Server
    if [ -f "mcp-server.js" ] || [ -f "src/mcp-server.ts" ]; then
        print_status "Starting MCP Server on port 3001..."
        pnpm run start:mcp > logs/mcp-server.log 2>&1 &
        MCP_PID=$!
        echo $MCP_PID > .pids/mcp-server.pid
    fi
    
    # Start WebSocket Server
    if [ -f "websocket-server.js" ] || [ -f "src/websocket-server.ts" ]; then
        print_status "Starting WebSocket Server on port 3002..."
        pnpm run start:ws > logs/websocket.log 2>&1 &
        WS_PID=$!
        echo $WS_PID > .pids/websocket.pid
    fi
    
    # Start Chrome Extension development if available
    if [ -d "chrome-extension" ]; then
        print_status "Chrome Extension development mode available"
        print_status "To load extension: Open Chrome -> More Tools -> Extensions -> Load unpacked -> Select chrome-extension folder"
    fi
    
    # Start Frontend if available
    if [ -f "frontend/package.json" ]; then
        print_status "Starting Frontend development server..."
        cd frontend
        pnpm run dev > ../logs/frontend.log 2>&1 &
        FRONTEND_PID=$!
        cd ..
        echo $FRONTEND_PID > .pids/frontend.pid
    fi
    
    # Create PID directory
    mkdir -p .pids
    
    # Wait for services to start
    print_status "Waiting for services to initialize..."
    sleep 5
    
    # Check service health
    print_status "Checking service health..."
    
    # Check Agency Hub
    if check_port 3000; then
        print_success "Agency Hub is running on http://localhost:3000"
    else
        print_warning "Agency Hub may not have started correctly"
    fi
    
    # Check MCP Server
    if check_port 3001; then
        print_success "MCP Server is running on http://localhost:3001"
    else
        print_warning "MCP Server may not have started correctly"
    fi
    
    # Check WebSocket Server
    if check_port 3002; then
        print_success "WebSocket Server is running on ws://localhost:3002"
    else
        print_warning "WebSocket Server may not have started correctly"
    fi
    
    # Check Frontend
    if check_port 8080; then
        print_success "Frontend is running on http://localhost:8080"
    fi
    
    # Display development information
    echo ""
    print_success "=== Development Environment Started ==="
    echo ""
    echo "Services:"
    echo "  • Agency Hub:      http://localhost:3000"
    echo "  • MCP Server:      http://localhost:3001"
    echo "  • WebSocket:       ws://localhost:3002"
    if check_port 8080; then
        echo "  • Frontend:        http://localhost:8080"
    fi
    echo ""
    echo "API Endpoints:"
    echo "  • Health Check:    GET http://localhost:3000/health"
    echo "  • Agent Register:  POST http://localhost:3000/api/agents/register"
    echo "  • Agent List:      GET http://localhost:3000/api/agents"
    echo "  • Swarm Create:    POST http://localhost:3000/api/swarms"
    echo ""
    echo "Development Tools:"
    echo "  • Logs Directory:  ./logs/"
    echo "  • PID Files:       ./.pids/"
    echo "  • Environment:     ./.env"
    echo ""
    echo "Useful Commands:"
    echo "  • Stop all:        ./stop-development.sh"
    echo "  • View logs:       tail -f logs/agency-hub.log"
    echo "  • Test API:        curl http://localhost:3000/health"
    echo "  • Monitor:         pnpm run monitor"
    echo ""
    
    # Create stop script
    cat > stop-development.sh << 'EOF'
#!/bin/bash

# Stop all development services

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${YELLOW}[STOP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[STOPPED]${NC} $1"
}

print_status "Stopping development services..."

# Kill processes by PID files
if [ -d ".pids" ]; then
    for pidfile in .pids/*.pid; do
        if [ -f "$pidfile" ]; then
            PID=$(cat "$pidfile")
            SERVICE=$(basename "$pidfile" .pid)
            if kill -0 "$PID" 2>/dev/null; then
                kill "$PID"
                print_success "$SERVICE (PID: $PID)"
            fi
            rm -f "$pidfile"
        fi
    done
    rmdir .pids 2>/dev/null || true
fi

# Kill by port as backup
for port in 3000 3001 3002 8080; do
    if lsof -ti:$port >/dev/null 2>&1; then
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        print_success "Process on port $port"
    fi
done

print_success "All services stopped"
EOF
    
    chmod +x stop-development.sh
    
    print_status "Development environment is ready!"
    print_status "Press Ctrl+C to stop all services, or run './stop-development.sh'"
    
    # Keep script running and monitor services
    trap 'print_status "Shutting down..."; ./stop-development.sh; exit 0' INT TERM
    
    while true; do
        sleep 10
        # Basic health check
        if ! check_port 3000 && [ -f ".pids/agency-hub.pid" ]; then
            print_warning "Agency Hub seems to have stopped unexpectedly"
        fi
    done
}

# Run main function
main "$@"