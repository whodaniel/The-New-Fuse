#!/bin/bash
#
# TNF MASTER ORCHESTRATION ACTIVATION SCRIPT
# ===========================================
# This script activates the full TNF autonomous orchestration system.
# It starts the relay server, connects to Redis, and enables continuous agent operations.
#
# Usage:
#   ./activate-tnf-orchestration.sh            # Local mode
#   ./activate-tnf-orchestration.sh --cloud    # Cloud mode (uses CloudRuntime Redis)
#   ./activate-tnf-orchestration.sh --status   # Check system status
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
RELAY_PORT=${RELAY_PORT:-3001}
REDIS_LOCAL_URL="redis://localhost:6380"
REDIS_CLOUD_URL="${REDIS_URL:-redis://localhost:6379}"

# Log file
LOG_DIR="$PROJECT_ROOT/.agent/orchestration-logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/activation-$(date +%Y%m%d-%H%M%S).log"

log() {
    echo -e "${GREEN}[TNF]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${CYAN}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

header() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                                                                ║${NC}"
    echo -e "${BLUE}║  ${CYAN}THE NEW FUSE - AUTONOMOUS ORCHESTRATION SYSTEM${NC}              ${BLUE}║${NC}"
    echo -e "${BLUE}║  ${NC}Activating distributed AI agent infrastructure${BLUE}              ║${NC}"
    echo -e "${BLUE}║                                                                ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

check_dependencies() {
    log "Checking dependencies..."

    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
        exit 1
    fi
    info "Node.js: $(node --version)"

    # Check pnpm
    if ! command -v pnpm &> /dev/null; then
        error "pnpm is not installed"
        exit 1
    fi
    info "pnpm: $(pnpm --version)"

    # Check Redis CLI (optional)
    if command -v redis-cli &> /dev/null; then
        info "Redis CLI: Available"
    else
        warn "Redis CLI not found - some features may be limited"
    fi
}

check_redis_connection() {
    local redis_url=$1
    log "Checking Redis connection: $redis_url"

    # Parse Redis URL to extract host and port
    if [[ "$redis_url" == redis://* ]]; then
        # Use Node.js to test connection
        node -e "
            const { createClient } = require('redis');
            const client = createClient({ url: '$redis_url' });
            client.on('error', (err) => { console.error('Redis error:', err.message); process.exit(1); });
            client.connect().then(() => {
                console.log('Redis connected successfully');
                client.quit();
                process.exit(0);
            }).catch((err) => {
                console.error('Failed to connect:', err.message);
                process.exit(1);
            });
        " 2>/dev/null && return 0 || return 1
    fi
    return 1
}

start_relay_server() {
    local mode=$1
    log "Starting TNF Relay Server (mode: $mode)..."

    cd "$PROJECT_ROOT"

    if [[ "$mode" == "cloud" ]]; then
        export REDIS_URL="$REDIS_CLOUD_URL"
        export ENABLE_REDIS_BRIDGE="true"
    else
        export REDIS_URL="$REDIS_LOCAL_URL"
        export ENABLE_REDIS_BRIDGE="true"
    fi

    # Check if relay is already running
    if lsof -i :$RELAY_PORT -t >/dev/null 2>&1; then
        warn "Relay already running on port $RELAY_PORT"
        return 0
    fi

    # Start relay in background
    export PORT=$RELAY_PORT
    nohup pnpm relay:start > "$LOG_DIR/relay-$(date +%Y%m%d-%H%M%S).log" 2>&1 &
    RELAY_PID=$!

    # Wait for relay to start
    sleep 3

    # Verify relay is running
    if curl -s "http://localhost:$RELAY_PORT/health" >/dev/null 2>&1; then
        log "✓ Relay server started successfully (PID: $RELAY_PID)"
        echo "$RELAY_PID" > "$LOG_DIR/relay.pid"
        return 0
    else
        error "Failed to start relay server"
        return 1
    fi
}

start_persistent_orchestrator() {
    local channel=${1:-"Green"}
    log "Starting persistent orchestrator on channel: $channel"

    cd "$PROJECT_ROOT"

    # Check if orchestrator script exists
    local orchestrator_script="$PROJECT_ROOT/apps/relay-server/scripts/orchestrator-persistent.js"

    if [[ ! -f "$orchestrator_script" ]]; then
        warn "Creating orchestrator-persistent.js..."
        create_orchestrator_script
    fi

    # Start orchestrator in background
    nohup node "$orchestrator_script" "$channel" > "$LOG_DIR/orchestrator-$(date +%Y%m%d-%H%M%S).log" 2>&1 &
    ORCH_PID=$!

    sleep 2

    log "✓ Orchestrator started (PID: $ORCH_PID)"
    echo "$ORCH_PID" > "$LOG_DIR/orchestrator.pid"
}

create_orchestrator_script() {
    cat > "$PROJECT_ROOT/apps/relay-server/scripts/orchestrator-persistent.js" << 'EOF'
#!/usr/bin/env node
/**
 * Persistent Orchestrator - DACC-v1 Protocol
 * Coordinates AI agents across federated channels
 */

const WebSocket = require('ws');

const RELAY_URL = process.env.RELAY_URL || 'ws://localhost:3001/ws';
const CHANNEL = process.argv[2] || 'Green';
const RECONNECT_DELAY = 5000;
const HEARTBEAT_INTERVAL = 25000;
const REMINDER_INTERVAL = 120000;

let ws = null;
let agentRegistry = new Map();
let nextAgentNumber = 1;
let sessionId = `orch-${Date.now()}`;

function log(msg) {
    console.log(`[${new Date().toISOString()}] [ORCHESTRATOR] ${msg}`);
}

function connect() {
    log(`Connecting to ${RELAY_URL}...`);
    ws = new WebSocket(RELAY_URL);

    ws.on('open', () => {
        log('Connected to relay');
        registerAsOrchestrator();
        joinChannel();
        startHeartbeat();
        startReminders();
        broadcastDiscovery();
    });

    ws.on('message', (data) => {
        try {
            const msg = JSON.parse(data.toString());
            handleMessage(msg);
        } catch (e) {
            // Ignore parse errors
        }
    });

    ws.on('close', () => {
        log('Disconnected. Reconnecting in 5 seconds...');
        setTimeout(connect, RECONNECT_DELAY);
    });

    ws.on('error', (err) => {
        log(`Error: ${err.message}`);
    });
}

function registerAsOrchestrator() {
    send({
        type: 'AGENT_REGISTER',
        payload: {
            agent: {
                id: sessionId,
                name: 'TNF Orchestrator',
                platform: 'orchestrator',
                capabilities: ['orchestration', 'task-distribution', 'agent-coordination'],
            }
        }
    });
}

function joinChannel() {
    send({
        type: 'CHANNEL_CREATE',
        payload: { name: CHANNEL }
    });
}

function broadcastDiscovery() {
    const discoveryMsg = `
═══════════════════════════════════════════════════════════════
🌐 ORCHESTRATOR ONLINE - DACC-v1 PROTOCOL
═══════════════════════════════════════════════════════════════
Session ID: ${sessionId}
Channel: ${CHANNEL}
Time: ${new Date().toISOString()}

📋 DISCOVERY & REGISTRATION

You will be assigned a unique **Agent ID** (AGENT-XX).

**⚠️ MANDATORY: SIGN ALL MESSAGES**

Format: \`[AGENT-XX] Your message\`

Please respond with:
1. Your name/type
2. Your capabilities
3. Pre-existing directives
4. Availability status
═══════════════════════════════════════════════════════════════`;

    broadcastToChannel(discoveryMsg);
}

function assignAgentId(sourceId, agentInfo) {
    const agentNum = String(nextAgentNumber++).padStart(2, '0');
    const assignedId = `AGENT-${agentNum}`;

    agentRegistry.set(sourceId, {
        assignedId,
        info: agentInfo,
        joinedAt: new Date().toISOString(),
        messageCount: 0,
        violations: 0
    });

    const assignmentMsg = `
╔═══════════════════════════════════════════════════════════════╗
║  🎫 AGENT ID ASSIGNMENT                                       ║
╚═══════════════════════════════════════════════════════════════╝

Your Assigned ID: ${assignedId}

⚠️ SIGN ALL MESSAGES: [${assignedId}] your message

Session Info:
• Session ID: ${sessionId}
• Active Agents: ${agentRegistry.size}

Please acknowledge with a signed message.`;

    log(`Assigned ${assignedId} to ${sourceId}`);
    return assignmentMsg;
}

function handleMessage(msg) {
    if (msg.type === 'CHANNEL_MESSAGE' && msg.payload) {
        const content = msg.payload.content || '';
        const sourceId = msg.payload.from || msg.source;

        // Check if this is a new agent responding to discovery
        if (!agentRegistry.has(sourceId) && content.includes('capabilities')) {
            const assignment = assignAgentId(sourceId, content);
            broadcastToChannel(assignment);
        }
    }
}

function broadcastToChannel(content) {
    send({
        type: 'MESSAGE_SEND',
        channel: CHANNEL,
        payload: {
            to: 'broadcast',
            content,
            messageType: 'text'
        }
    });
}

function startHeartbeat() {
    setInterval(() => {
        send({ type: 'HEARTBEAT', payload: { sessionId } });
    }, HEARTBEAT_INTERVAL);
}

function startReminders() {
    setInterval(() => {
        if (agentRegistry.size > 0) {
            broadcastToChannel('🔔 Reminder: Sign all messages with [AGENT-XX] format.');
        }
    }, REMINDER_INTERVAL);
}

function send(msg) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            ...msg,
            source: sessionId,
            timestamp: Date.now()
        }));
    }
}

// Graceful shutdown
process.on('SIGINT', () => {
    log('Shutting down orchestrator...');
    broadcastToChannel('🔴 ORCHESTRATOR GOING OFFLINE. Session ending.');
    setTimeout(() => process.exit(0), 1000);
});

// Start
log('TNF Persistent Orchestrator starting...');
connect();
EOF
    chmod +x "$PROJECT_ROOT/apps/relay-server/scripts/orchestrator-persistent.js"
}

show_status() {
    header
    log "System Status"
    echo ""

    # Check relay
    if curl -s "http://localhost:$RELAY_PORT/health" >/dev/null 2>&1; then
        local status=$(curl -s "http://localhost:$RELAY_PORT/status")
        echo -e "${GREEN}✓ Relay Server: RUNNING${NC}"
        echo "  - Agents: $(echo $status | node -pe "JSON.parse(require('fs').readFileSync('/dev/stdin').toString()).stats.agents")"
        echo "  - Connections: $(echo $status | node -pe "JSON.parse(require('fs').readFileSync('/dev/stdin').toString()).stats.activeConnections")"
    else
        echo -e "${RED}✗ Relay Server: OFFLINE${NC}"
    fi

    # Check Redis (cloud)
    if check_redis_connection "$REDIS_CLOUD_URL" 2>/dev/null; then
        echo -e "${GREEN}✓ Redis Cloud: CONNECTED${NC}"
    else
        echo -e "${YELLOW}! Redis Cloud: NOT CONNECTED${NC}"
    fi

    # Check orchestrator
    if [[ -f "$LOG_DIR/orchestrator.pid" ]]; then
        local orch_pid=$(cat "$LOG_DIR/orchestrator.pid")
        if kill -0 "$orch_pid" 2>/dev/null; then
            echo -e "${GREEN}✓ Orchestrator: RUNNING (PID: $orch_pid)${NC}"
        else
            echo -e "${YELLOW}! Orchestrator: STOPPED${NC}"
        fi
    else
        echo -e "${YELLOW}! Orchestrator: NOT STARTED${NC}"
    fi

    echo ""
    echo "Endpoints:"
    echo "  - Health: http://localhost:$RELAY_PORT/health"
    echo "  - Agents: http://localhost:$RELAY_PORT/agents"
    echo "  - Channels: http://localhost:$RELAY_PORT/channels"
    echo "  - WebSocket: ws://localhost:$RELAY_PORT/ws"
}

stop_all() {
    log "Stopping all services..."

    # Stop relay
    if [[ -f "$LOG_DIR/relay.pid" ]]; then
        local relay_pid=$(cat "$LOG_DIR/relay.pid")
        kill "$relay_pid" 2>/dev/null || true
        rm "$LOG_DIR/relay.pid"
        log "Stopped relay"
    fi

    # Stop orchestrator
    if [[ -f "$LOG_DIR/orchestrator.pid" ]]; then
        local orch_pid=$(cat "$LOG_DIR/orchestrator.pid")
        kill "$orch_pid" 2>/dev/null || true
        rm "$LOG_DIR/orchestrator.pid"
        log "Stopped orchestrator"
    fi

    log "All services stopped"
}

# Main
case "${1:-}" in
    --status)
        show_status
        ;;
    --stop)
        stop_all
        ;;
    --cloud)
        header
        check_dependencies
        log "CLOUD MODE - Using CloudRuntime Redis"
        check_redis_connection "$REDIS_CLOUD_URL"
        start_relay_server "cloud"
        start_persistent_orchestrator "Green"
        show_status
        ;;
    --help)
        echo "Usage: $0 [--status|--stop|--cloud|--help]"
        echo ""
        echo "Options:"
        echo "  --status    Show system status"
        echo "  --stop      Stop all services"
        echo "  --cloud     Use cloud Redis (CloudRuntime)"
        echo "  --help      Show this help"
        echo ""
        echo "Default: Start in local mode with local Redis"
        ;;
    *)
        header
        check_dependencies
        log "LOCAL MODE - Using local Redis"
        start_relay_server "local"
        start_persistent_orchestrator "Green"
        show_status
        ;;
esac
