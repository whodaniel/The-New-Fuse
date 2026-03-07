#!/bin/bash

# =============================================================================
# TNF Agent Network Startup Script
# =============================================================================
#
# Starts all components needed for the full multi-agent network:
#   1. Redis server
#   2. Redis WebSocket Bridge (for browser/extension connections)
#   3. Antigravity Orchestrator
#   4. Optional: Claude, Gemini, Jules wrappers
#
# Usage:
#   ./start-agent-network.sh           # Start core components
#   ./start-agent-network.sh --all     # Start all agents
#   ./start-agent-network.sh --help    # Show help
#
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Ports
REDIS_PORT=6379
WS_BRIDGE_PORT=3000

# PID file for tracking
PID_FILE="$SCRIPT_DIR/.agent-network-pids"

# =============================================================================
# FUNCTIONS
# =============================================================================

print_banner() {
    echo -e "${CYAN}"
    echo "╔═══════════════════════════════════════════════════════════════════╗"
    echo "║                    TNF Agent Network Startup                       ║"
    echo "║               Multi-Agent AI Orchestration System                  ║"
    echo "╚═══════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_help() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --all        Start all agent wrappers (Claude, Gemini, Jules)"
    echo "  --claude     Also start Claude wrapper"
    echo "  --gemini     Also start Gemini wrapper"
    echo "  --jules      Also start Jules wrapper"
    echo "  --stop       Stop all running components"
    echo "  --status     Show status of all components"
    echo "  --help       Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0               # Start core (Redis, Bridge, Antigravity)"
    echo "  $0 --all         # Start everything"
    echo "  $0 --stop        # Stop all components"
}

check_redis() {
    if redis-cli ping > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

start_redis() {
    echo -e "${BLUE}[1/4]${NC} Starting Redis server..."

    if check_redis; then
        echo -e "  ${GREEN}✓${NC} Redis is already running"
    else
        redis-server --daemonize yes
        sleep 1
        if check_redis; then
            echo -e "  ${GREEN}✓${NC} Redis started on port $REDIS_PORT"
        else
            echo -e "  ${RED}✗${NC} Failed to start Redis"
            exit 1
        fi
    fi
}

start_ws_bridge() {
    echo -e "${BLUE}[2/4]${NC} Starting WebSocket Bridge..."

    # Check if already running
    if lsof -i :$WS_BRIDGE_PORT > /dev/null 2>&1; then
        echo -e "  ${YELLOW}!${NC} Port $WS_BRIDGE_PORT is already in use"
        echo -e "  ${GREEN}✓${NC} Assuming WS Bridge is running"
    else
        cd "$SCRIPT_DIR"
        PORT=$WS_BRIDGE_PORT node redis-ws-bridge.cjs > /dev/null 2>&1 &
        WS_PID=$!
        echo $WS_PID >> "$PID_FILE"
        sleep 2

        if lsof -i :$WS_BRIDGE_PORT > /dev/null 2>&1; then
            echo -e "  ${GREEN}✓${NC} WS Bridge started on port $WS_BRIDGE_PORT (PID: $WS_PID)"
        else
            echo -e "  ${RED}✗${NC} Failed to start WS Bridge"
        fi
    fi
}

start_antigravity() {
    echo -e "${BLUE}[3/4]${NC} Starting Antigravity Orchestrator..."

    cd "$SCRIPT_DIR"

    # Run in a new terminal or background
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS - open in new Terminal tab
        osascript -e "tell application \"Terminal\" to do script \"cd '$SCRIPT_DIR' && node antigravity-redis-wrapper.cjs\""
        echo -e "  ${GREEN}✓${NC} Antigravity started in new Terminal tab"
    else
        # Linux - run in background with logs
        node antigravity-redis-wrapper.cjs > /tmp/antigravity.log 2>&1 &
        AG_PID=$!
        echo $AG_PID >> "$PID_FILE"
        echo -e "  ${GREEN}✓${NC} Antigravity started (PID: $AG_PID)"
        echo -e "  ${CYAN}ℹ${NC}  Logs: /tmp/antigravity.log"
    fi
}

start_agent_wrapper() {
    local name=$1
    local script=$2
    local cmd_var=$3

    echo -e "${PURPLE}[Agent]${NC} Starting $name..."

    cd "$SCRIPT_DIR"

    if [[ "$OSTYPE" == "darwin"* ]]; then
        osascript -e "tell application \"Terminal\" to do script \"cd '$SCRIPT_DIR' && node $script\""
        echo -e "  ${GREEN}✓${NC} $name started in new Terminal tab"
    else
        node "$script" > "/tmp/${name,,}.log" 2>&1 &
        local pid=$!
        echo $pid >> "$PID_FILE"
        echo -e "  ${GREEN}✓${NC} $name started (PID: $pid)"
    fi
}

stop_all() {
    echo -e "${YELLOW}Stopping all agent network components...${NC}"

    # Kill tracked PIDs
    if [ -f "$PID_FILE" ]; then
        while read pid; do
            if ps -p $pid > /dev/null 2>&1; then
                kill $pid 2>/dev/null || true
                echo -e "  ${RED}✗${NC} Killed process $pid"
            fi
        done < "$PID_FILE"
        rm "$PID_FILE"
    fi

    # Kill node processes by name
    pkill -f "redis-ws-bridge.cjs" 2>/dev/null || true
    pkill -f "antigravity-redis-wrapper.cjs" 2>/dev/null || true
    pkill -f "claude-redis-wrapper.cjs" 2>/dev/null || true
    pkill -f "gemini-redis-wrapper.cjs" 2>/dev/null || true
    pkill -f "jules-redis-wrapper.cjs" 2>/dev/null || true

    echo -e "${GREEN}All components stopped${NC}"
}

show_status() {
    echo -e "${CYAN}Agent Network Status${NC}"
    echo ""

    # Redis
    if check_redis; then
        echo -e "  ${GREEN}●${NC} Redis          - Running on port $REDIS_PORT"
    else
        echo -e "  ${RED}○${NC} Redis          - Not running"
    fi

    # WS Bridge
    if lsof -i :$WS_BRIDGE_PORT > /dev/null 2>&1; then
        echo -e "  ${GREEN}●${NC} WS Bridge      - Running on port $WS_BRIDGE_PORT"
    else
        echo -e "  ${RED}○${NC} WS Bridge      - Not running"
    fi

    # Antigravity
    if pgrep -f "antigravity-redis-wrapper" > /dev/null; then
        echo -e "  ${GREEN}●${NC} Antigravity    - Running"
    else
        echo -e "  ${RED}○${NC} Antigravity    - Not running"
    fi

    # Claude
    if pgrep -f "claude-redis-wrapper" > /dev/null; then
        echo -e "  ${GREEN}●${NC} Claude         - Running"
    else
        echo -e "  ${YELLOW}○${NC} Claude         - Not running"
    fi

    # Gemini
    if pgrep -f "gemini-redis-wrapper" > /dev/null; then
        echo -e "  ${GREEN}●${NC} Gemini         - Running"
    else
        echo -e "  ${YELLOW}○${NC} Gemini         - Not running"
    fi

    # Jules
    if pgrep -f "jules-redis-wrapper" > /dev/null; then
        echo -e "  ${GREEN}●${NC} Jules          - Running"
    else
        echo -e "  ${YELLOW}○${NC} Jules          - Not running"
    fi

    echo ""
    echo -e "${CYAN}Endpoints:${NC}"
    echo "  WS Bridge:    ws://localhost:$WS_BRIDGE_PORT/redis-bridge"
    echo "  Health:       http://localhost:$WS_BRIDGE_PORT/health"
    echo "  Agents:       http://localhost:$WS_BRIDGE_PORT/agents"
}

# =============================================================================
# MAIN
# =============================================================================

# Parse arguments
START_CLAUDE=false
START_GEMINI=false
START_JULES=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --all)
            START_CLAUDE=true
            START_GEMINI=true
            START_JULES=true
            shift
            ;;
        --claude)
            START_CLAUDE=true
            shift
            ;;
        --gemini)
            START_GEMINI=true
            shift
            ;;
        --jules)
            START_JULES=true
            shift
            ;;
        --stop)
            stop_all
            exit 0
            ;;
        --status)
            show_status
            exit 0
            ;;
        --help|-h)
            print_help
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            print_help
            exit 1
            ;;
    esac
done

# Start network
print_banner

# Clear old PIDs
rm -f "$PID_FILE"
touch "$PID_FILE"

# Start core components
start_redis
start_ws_bridge
start_antigravity

# Start optional agents
if [ "$START_CLAUDE" = true ]; then
    start_agent_wrapper "Claude" "claude-redis-wrapper.cjs"
fi

if [ "$START_GEMINI" = true ]; then
    start_agent_wrapper "Gemini" "gemini-redis-wrapper.cjs"
fi

if [ "$START_JULES" = true ]; then
    start_agent_wrapper "Jules" "jules-redis-wrapper.cjs"
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Agent Network Started Successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${CYAN}Quick Commands:${NC}"
echo "  Check status:   $0 --status"
echo "  Stop all:       $0 --stop"
echo ""
echo -e "${CYAN}Connect Chrome Extension:${NC}"
echo "  1. Open chrome://extensions"
echo "  2. Load unpacked: $PROJECT_ROOT/apps/chrome-extension/dist"
echo "  3. Click extension icon -> Connect"
echo ""
echo -e "${CYAN}Available Workflows in Antigravity:${NC}"
echo "  • code-review"
echo "  • feature-implementation"
echo "  • codebase-analysis"
echo "  • documentation"
echo ""
