#!/bin/bash

# =============================================================================
# TNF Agent Network Startup Script
# =============================================================================
#
# Starts all components needed for the full multi-agent network:
#   1. Redis server
#   2. Redis WebSocket Bridge (for browser/extension connections)
#   3. Antigravity Orchestrator
#   4. Optional: Claude, Gemini, Jules, Pi wrappers
#   5. Optional: Model watchdog failover consumer
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
WS_BRIDGE_PORT=3005

# PID file for tracking
PID_FILE="$SCRIPT_DIR/.agent-network-pids"
WS_BRIDGE_LAUNCHD_LABEL="com.thenewfuse.redis-ws-bridge"
WS_BRIDGE_LAUNCHD_PLIST="$HOME/Library/LaunchAgents/${WS_BRIDGE_LAUNCHD_LABEL}.plist"

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
    echo "  --all        Start default agent wrappers (Gemini, Jules, Pi, Watchdog)"
    echo "  --claude     Also start Claude wrapper when quota/auth are available"
    echo "  --gemini     Also start Gemini wrapper"
    echo "  --jules      Also start Jules wrapper"
    echo "  --pi         Also start Pi wrapper"
    echo "  --watchdog   Also start model-watchdog failover consumer"
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

check_ws_bridge_health() {
    curl -fsS --max-time 2 "http://127.0.0.1:$WS_BRIDGE_PORT/health" 2>/dev/null | grep -q '"status":"ok"'
}

is_wrapper_running() {
    local script_name=$1
    pgrep -f "$SCRIPT_DIR/$script_name" > /dev/null 2>&1 || pgrep -f "$script_name" > /dev/null 2>&1
}

command_available() {
    local command_name=$1
    command -v "$command_name" > /dev/null 2>&1
}

contains_csv_token() {
    local csv=$1
    local token=$2
    local entry

    IFS=',' read -ra entries <<< "$csv"
    for entry in "${entries[@]}"; do
        entry="$(echo "$entry" | xargs)"
        if [ "$entry" = "$token" ]; then
            return 0
        fi
    done

    return 1
}

append_csv_token() {
    local csv=$1
    local token=$2

    if [ -z "$token" ] || contains_csv_token "$csv" "$token"; then
        echo "$csv"
        return
    fi

    if [ -z "$csv" ]; then
        echo "$token"
    else
        echo "$csv,$token"
    fi
}

build_watchdog_provider_chain() {
    local default_chain="${MODEL_WATCHDOG_PROVIDER_CHAIN:-google,anthropic,openai,openrouter,nvidia,deepseek}"
    local disabled="${MODEL_WATCHDOG_DISABLED_PROVIDERS:-${TNF_DISABLED_PROVIDERS:-}}"
    local claude_cmd="${CLAUDE_CMD:-claude}"
    local chain=""
    local provider

    if [ "$START_CLAUDE" != true ] || ! command_available "$claude_cmd"; then
        disabled="$(append_csv_token "$disabled" "anthropic")"
    fi

    IFS=',' read -ra providers <<< "$default_chain"
    for provider in "${providers[@]}"; do
        provider="$(echo "$provider" | xargs)"
        if [ -z "$provider" ] || contains_csv_token "$disabled" "$provider"; then
            continue
        fi

        chain="$(append_csv_token "$chain" "$provider")"
    done

    echo "$chain"
}

wait_for_wrapper() {
    local name=$1
    local script_name=$2
    local timeout_seconds=${3:-20}
    local elapsed=0

    while [ "$elapsed" -lt "$timeout_seconds" ]; do
        if is_wrapper_running "$script_name"; then
            echo -e "  ${GREEN}✓${NC} $name wrapper is running"
            return 0
        fi
        sleep 1
        elapsed=$((elapsed + 1))
    done

    echo -e "  ${RED}✗${NC} $name tab launched but wrapper is not running after ${timeout_seconds}s"
    return 1
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
        if check_ws_bridge_health; then
            echo -e "  ${GREEN}✓${NC} WS Bridge is already healthy"
        else
            echo -e "  ${RED}✗${NC} Port $WS_BRIDGE_PORT is occupied but WS Bridge health check failed"
            return 1
        fi
    else
        if [[ "$OSTYPE" == "darwin"* ]] && command -v launchctl >/dev/null 2>&1; then
            mkdir -p "$HOME/Library/LaunchAgents" "$PROJECT_ROOT/.agent/runtime-logs"
            NODE_BIN="$(command -v node)"
            cat > "$WS_BRIDGE_LAUNCHD_PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${WS_BRIDGE_LAUNCHD_LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${NODE_BIN}</string>
    <string>${SCRIPT_DIR}/redis-ws-bridge.cjs</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${SCRIPT_DIR}</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PORT</key>
    <string>${WS_BRIDGE_PORT}</string>
  </dict>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${PROJECT_ROOT}/.agent/runtime-logs/redis-ws-bridge.log</string>
  <key>StandardErrorPath</key>
  <string>${PROJECT_ROOT}/.agent/runtime-logs/redis-ws-bridge.log</string>
</dict>
</plist>
PLIST
            launchctl bootout "gui/$(id -u)" "$WS_BRIDGE_LAUNCHD_PLIST" >/dev/null 2>&1 || true
            launchctl bootstrap "gui/$(id -u)" "$WS_BRIDGE_LAUNCHD_PLIST" >/dev/null 2>&1 || true
            launchctl kickstart -k "gui/$(id -u)/${WS_BRIDGE_LAUNCHD_LABEL}" >/dev/null 2>&1 || true
            sleep 3
        else
            cd "$SCRIPT_DIR"
            PORT=$WS_BRIDGE_PORT node redis-ws-bridge.cjs > /dev/null 2>&1 &
            WS_PID=$!
            echo $WS_PID >> "$PID_FILE"
            sleep 2
        fi

        if lsof -i :$WS_BRIDGE_PORT > /dev/null 2>&1; then
            echo -e "  ${GREEN}✓${NC} WS Bridge started on port $WS_BRIDGE_PORT"
        else
            echo -e "  ${RED}✗${NC} Failed to start WS Bridge"
        fi
    fi
}

start_antigravity() {
    echo -e "${BLUE}[3/4]${NC} Starting Antigravity Orchestrator..."

    cd "$PROJECT_ROOT"

    if is_wrapper_running "antigravity-redis-wrapper.cjs"; then
        echo -e "  ${GREEN}✓${NC} Antigravity is already running"
        return 0
    fi

    # Run in a new terminal or background
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS - open in new Terminal tab
        osascript -e "tell application \"Terminal\" to do script \"export TNF_ONBOARDED=1 && cd '$PROJECT_ROOT' && node '$SCRIPT_DIR/antigravity-redis-wrapper.cjs'\""
        wait_for_wrapper "Antigravity" "antigravity-redis-wrapper.cjs" 20
    else
        # Linux - run in background with logs
        node "$SCRIPT_DIR/antigravity-redis-wrapper.cjs" > /tmp/antigravity.log 2>&1 &
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

    cd "$PROJECT_ROOT"

    if is_wrapper_running "$script"; then
        echo -e "  ${GREEN}✓${NC} $name is already running"
        return 0
    fi

    local agent_id="tnf-${script%.*}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        osascript -e "tell application \"Terminal\" to do script \"export TNF_ONBOARDED=1 && export AGENT_ID='$agent_id' && cd '$PROJECT_ROOT' && node '$SCRIPT_DIR/$script'\""
        wait_for_wrapper "$name" "$script" 25
    else
        bash -c "source ~/.zshrc && source ~/.tnf-claude-env && AGENT_ID='$agent_id' node '$SCRIPT_DIR/$script' > '/tmp/$(echo "$name" | tr A-Z a-z).log' 2>&1 & echo \$! >> '$PID_FILE'"
        echo -e "  ${GREEN}✓${NC} $name started (headless fallback)"
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
    if [[ "$OSTYPE" == "darwin"* ]] && command -v launchctl >/dev/null 2>&1; then
        launchctl bootout "gui/$(id -u)" "$WS_BRIDGE_LAUNCHD_PLIST" >/dev/null 2>&1 || true
    fi
    pkill -f "redis-ws-bridge.cjs" 2>/dev/null || true
    pkill -f "antigravity-redis-wrapper.cjs" 2>/dev/null || true
    pkill -f "claude-redis-wrapper.cjs" 2>/dev/null || true
    pkill -f "gemini-redis-wrapper.cjs" 2>/dev/null || true
    pkill -f "jules-redis-wrapper.cjs" 2>/dev/null || true
    pkill -f "pi-redis-wrapper.cjs" 2>/dev/null || true
    pkill -f "model-watchdog-failover-consumer.cjs" 2>/dev/null || true

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
    if check_ws_bridge_health; then
        echo -e "  ${GREEN}●${NC} WS Bridge      - Running on port $WS_BRIDGE_PORT"
    else
        echo -e "  ${RED}○${NC} WS Bridge      - Not running"
    fi

    # Antigravity
    if is_wrapper_running "antigravity-redis-wrapper.cjs"; then
        echo -e "  ${GREEN}●${NC} Antigravity    - Running"
    else
        echo -e "  ${RED}○${NC} Antigravity    - Not running"
    fi

    # Claude
    if is_wrapper_running "claude-redis-wrapper.cjs"; then
        echo -e "  ${GREEN}●${NC} Claude         - Running"
    else
        echo -e "  ${YELLOW}○${NC} Claude         - Not running"
    fi

    # Gemini
    if is_wrapper_running "gemini-redis-wrapper.cjs"; then
        echo -e "  ${GREEN}●${NC} Gemini         - Running"
    else
        echo -e "  ${YELLOW}○${NC} Gemini         - Not running"
    fi

    # Jules
    if is_wrapper_running "jules-redis-wrapper.cjs"; then
        echo -e "  ${GREEN}●${NC} Jules          - Running"
    else
        echo -e "  ${YELLOW}○${NC} Jules          - Not running"
    fi

    # Pi
    if is_wrapper_running "pi-redis-wrapper.cjs"; then
        echo -e "  ${GREEN}●${NC} Pi             - Running"
    else
        echo -e "  ${YELLOW}○${NC} Pi             - Not running"
    fi

    # Model Watchdog
    if is_wrapper_running "model-watchdog-failover-consumer.cjs"; then
        echo -e "  ${GREEN}●${NC} Model Watchdog - Running"
    else
        echo -e "  ${YELLOW}○${NC} Model Watchdog - Not running"
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
START_PI=false
START_WATCHDOG=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --all)
            START_GEMINI=true
            START_JULES=true
            START_PI=true
            START_WATCHDOG=true
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
        --pi)
            START_PI=true
            shift
            ;;
        --watchdog)
            START_WATCHDOG=true
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

if [ "$START_PI" = true ]; then
    start_agent_wrapper "Pi" "pi-redis-wrapper.cjs"
fi

if [ "$START_WATCHDOG" = true ]; then
    export MODEL_WATCHDOG_PROVIDER_CHAIN="$(build_watchdog_provider_chain)"
    echo -e "  ${CYAN}ℹ${NC}  Model watchdog provider chain: ${MODEL_WATCHDOG_PROVIDER_CHAIN:-none}"
    start_agent_wrapper "ModelWatchdog" "model-watchdog-failover-consumer.cjs"
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
