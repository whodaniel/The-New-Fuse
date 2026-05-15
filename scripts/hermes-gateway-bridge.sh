#!/bin/bash
#
# Hermes-TNF Gateway Bridge Script
# Starts both Hermes gateway and TNF relay if not running, then bridges them
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${TNF_ROOT_DIR:-$(cd "$SCRIPT_DIR/.." && pwd)}"
RELAY_SERVER_DIR="${PROJECT_ROOT}/apps/relay-server"
CONFIG_DIR="${HOME}/.tnf"
CONFIG_FILE="${CONFIG_DIR}/gateway-bridge.json"

# Ports
HERMES_PORT=7788
TNF_PORT=3000
BRIDGE_PORT=4000

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if a port is in use
is_port_in_use() {
    local port=$1
    if command -v lsof &> /dev/null; then
        lsof -i :"$port" &> /dev/null
    elif command -v netstat &> /dev/null; then
        netstat -an | grep ":$port" &> /dev/null
    else
        # Fallback: try to connect
        timeout 1 bash -c "echo > /dev/tcp/localhost/$port" 2>/dev/null
    fi
}

# Check if Hermes gateway is running
check_hermes() {
    if is_port_in_use $HERMES_PORT; then
        log_success "Hermes gateway is running on port $HERMES_PORT"
        return 0
    else
        log_warning "Hermes gateway is NOT running on port $HERMES_PORT"
        return 1
    fi
}

# Check if TNF relay is running
check_tnf() {
    if is_port_in_use $TNF_PORT; then
        log_success "TNF relay is running on port $TNF_PORT"
        return 0
    else
        log_warning "TNF relay is NOT running on port $TNF_PORT"
        return 1
    fi
}

# Start Hermes gateway
start_hermes() {
    log_info "Starting Hermes gateway..."
    if command -v hermes &> /dev/null; then
        hermes gateway start
        if [ $? -eq 0 ]; then
            log_success "Hermes gateway started"
            return 0
        else
            log_error "Failed to start Hermes gateway"
            return 1
        fi
    else
        log_error "hermes command not found. Please install Hermes Agent first."
        return 1
    fi
}

# Start TNF relay
start_tnf() {
    log_info "Starting TNF relay..."
    if [ -f "${RELAY_SERVER_DIR}/src/comprehensive-tnf-relay.js" ]; then
        cd "$RELAY_SERVER_DIR"
        node src/comprehensive-tnf-relay.js start &
        TNF_PID=$!
        log_info "TNF relay started with PID $TNF_PID"
        
        # Wait for TNF to be ready
        local attempts=0
        local max_attempts=30
        while [ $attempts -lt $max_attempts ]; do
            if is_port_in_use $TNF_PORT; then
                log_success "TNF relay is ready on port $TNF_PORT"
                return 0
            fi
            sleep 1
            attempts=$((attempts + 1))
        done
        
        log_error "TNF relay failed to start within timeout"
        return 1
    else
        log_error "TNF relay script not found at ${RELAY_SERVER_DIR}/src/comprehensive-tnf-relay.js"
        return 1
    fi
}

# Create default config if it doesn't exist
create_config() {
    if [ ! -f "$CONFIG_FILE" ]; then
        log_info "Creating default config at $CONFIG_FILE"
        mkdir -p "$CONFIG_DIR"
        cat > "$CONFIG_FILE" <<EOF
{
  "hermesWsUrl": "ws://localhost:7788",
  "tnfWsUrl": "ws://localhost:3000",
  "bridgePort": 4000,
  "autoStart": true,
  "logLevel": "info"
}
EOF
        log_success "Config created at $CONFIG_FILE"
    fi
}

# Start the bridge
start_bridge() {
    log_info "Starting WebSocket bridge..."
    cd "$SCRIPT_DIR"
    
    # Export config path
    export BRIDGE_CONFIG="$CONFIG_FILE"
    
    # Start the bridge in background
    node hermes-gateway-bridge.js &
    BRIDGE_PID=$!
    log_info "Bridge started with PID $BRIDGE_PID"
    
    # Wait for bridge to be ready
    local attempts=0
    local max_attempts=30
    while [ $attempts -lt $max_attempts ]; do
        if is_port_in_use $BRIDGE_PORT; then
            log_success "Bridge is ready on port $BRIDGE_PORT"
            log_info "Health check: http://localhost:$BRIDGE_PORT/health"
            log_info "Status: http://localhost:$BRIDGE_PORT/status"
            return 0
        fi
        sleep 1
        attempts=$((attempts + 1))
    done
    
    log_error "Bridge failed to start within timeout"
    return 1
}

# Show status
show_status() {
    echo ""
    echo "=== Hermes-TNF Gateway Bridge Status ==="
    echo ""
    
    check_hermes || true
    check_tnf || true
    
    if is_port_in_use $BRIDGE_PORT; then
        log_success "Bridge is running on port $BRIDGE_PORT"
        echo ""
        echo "Bridge endpoints:"
        echo "  Health: http://localhost:$BRIDGE_PORT/health"
        echo "  Status: http://localhost:$BRIDGE_PORT/status"
    else
        log_warning "Bridge is NOT running"
    fi
    
    echo ""
    echo "Config file: $CONFIG_FILE"
    echo ""
}

# Main function
main() {
    local action="${1:-start}"
    
    case "$action" in
        start)
            log_info "=== Hermes-TNF Gateway Bridge ==="
            
            # Create config if needed
            create_config
            
            # Check and start Hermes
            if ! check_hermes; then
                start_hermes || {
                    log_error "Cannot continue without Hermes gateway"
                    exit 1
                }
                # Wait for Hermes to be ready
                sleep 3
            fi
            
            # Check and start TNF
            if ! check_tnf; then
                start_tnf || {
                    log_error "Cannot continue without TNF relay"
                    exit 1
                }
                # Wait for TNF to be ready
                sleep 3
            fi
            
            # Start the bridge
            start_bridge
            
            log_success "=== All services started successfully ==="
            show_status
            ;;
            
        stop)
            log_info "Stopping bridge services..."
            pkill -f "hermes-gateway-bridge.js" 2>/dev/null || true
            log_success "Bridge stopped"
            ;;
            
        restart)
            "$0" stop
            sleep 2
            "$0" start
            ;;
            
        status)
            show_status
            ;;
            
        config)
            create_config
            log_info "Config file: $CONFIG_FILE"
            if [ -f "$CONFIG_FILE" ]; then
                cat "$CONFIG_FILE"
            fi
            ;;
            
        *)
            echo "Usage: $0 {start|stop|restart|status|config}"
            echo ""
            echo "Commands:"
            echo "  start   - Start Hermes gateway, TNF relay, and bridge (if not running)"
            echo "  stop    - Stop the bridge"
            echo "  restart - Restart all services"
            echo "  status  - Show status of all services"
            echo "  config  - Show/create config file"
            exit 1
            ;;
    esac
}

# Run main
main "$@"
