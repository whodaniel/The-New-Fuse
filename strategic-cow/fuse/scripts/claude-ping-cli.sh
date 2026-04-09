#!/bin/bash

# Claude Ping Controller - Unified Command Line Interface
# Provides CLI access to the consolidated AppleScript controller

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UNIFIED_SCRIPT="$SCRIPT_DIR/claude-ping-controller-unified.scpt"
CONFIG_FILE="$HOME/.claude_ping_config"
LOG_FILE="/tmp/claude_ping_unified.log"
PID_FILE="/tmp/claude_ping_unified.pid"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_header() {
    echo -e "${CYAN}===============================================${NC}"
    echo -e "${CYAN}🎯 Claude Ping Controller - Unified CLI${NC}"
    echo -e "${CYAN}===============================================${NC}"
}

# Function to check if ping system is running
is_running() {
    ps aux | grep -v grep | grep -q "claude.*ping" && return 0 || return 1
}

# Function to start the ping system
start_ping() {
    print_status "Starting Claude Ping Controller..."
    
    if is_running; then
        print_warning "Ping system is already running!"
        return 1
    fi
    
    # Set environment mode for headless operation
    export CLAUDE_PING_MODE="headless"
    
    # Start the unified controller in headless mode
    osascript "$UNIFIED_SCRIPT" > "$LOG_FILE" 2>&1 &
    
    # Wait a moment and check if it started
    sleep 2
    
    if is_running; then
        print_success "Claude Ping Controller started successfully!"
        print_status "Process ID: $(pgrep -f 'claude.*ping' | head -1)"
        print_status "Log file: $LOG_FILE"
        return 0
    else
        print_error "Failed to start ping system. Check logs: $LOG_FILE"
        return 1
    fi
}

# Function to stop the ping system
stop_ping() {
    print_status "Stopping Claude Ping Controller..."
    
    if ! is_running; then
        print_warning "Ping system is not running!"
        return 1
    fi
    
    # Create stop signal
    touch /tmp/claude_ping_stop_signal
    
    # Kill processes
    pkill -f "claude.*ping" 2>/dev/null
    pkill -f "claude-ping" 2>/dev/null
    
    # Wait for graceful shutdown
    sleep 3
    
    # Force kill if still running
    if is_running; then
        print_warning "Forcing shutdown..."
        pkill -9 -f "claude.*ping" 2>/dev/null
        killall -9 osascript 2>/dev/null
    fi
    
    # Cleanup
    rm -f "$PID_FILE" /tmp/claude_ping_stop_signal 2>/dev/null
    
    print_success "Claude Ping Controller stopped!"
}

# Function to restart the ping system
restart_ping() {
    print_status "Restarting Claude Ping Controller..."
    stop_ping
    sleep 2
    start_ping
}

# Function to show status
show_status() {
    print_header
    
    if is_running; then
        echo -e "${GREEN}Status: 🟢 RUNNING${NC}"
        
        # Get process info
        local pid=$(pgrep -f 'claude.*ping' | head -1)
        if [ -n "$pid" ]; then
            echo -e "${BLUE}Process ID:${NC} $pid"
            
            # Get process start time
            if command -v ps >/dev/null; then
                local start_time=$(ps -o lstart= -p "$pid" 2>/dev/null)
                echo -e "${BLUE}Started:${NC} $start_time"
            fi
        fi
        
    else
        echo -e "${RED}Status: 🔴 STOPPED${NC}"
    fi
    
    # Show configuration if available
    if [ -f "$CONFIG_FILE" ]; then
        echo -e "${BLUE}Configuration:${NC}"
        while IFS='=' read -r key value; do
            if [ -n "$key" ] && [ -n "$value" ]; then
                echo -e "  ${CYAN}$key:${NC} $value"
            fi
        done < "$CONFIG_FILE"
    fi
    
    # Show recent log entries
    if [ -f "$LOG_FILE" ]; then
        echo -e "${BLUE}Recent Logs:${NC}"
        tail -5 "$LOG_FILE" 2>/dev/null | sed 's/^/  /'
    fi
}

# Function to show logs
show_logs() {
    print_status "Showing recent log entries..."
    
    if [ -f "$LOG_FILE" ]; then
        echo -e "${BLUE}Log file: $LOG_FILE${NC}"
        echo -e "${CYAN}==================== LOGS ====================${NC}"
        tail -20 "$LOG_FILE" 2>/dev/null || echo "No logs available"
        echo -e "${CYAN}===============================================${NC}"
    else
        print_warning "No log file found at $LOG_FILE"
    fi
}

# Function to follow logs in real-time
follow_logs() {
    print_status "Following logs in real-time (Ctrl+C to stop)..."
    
    if [ -f "$LOG_FILE" ]; then
        tail -f "$LOG_FILE"
    else
        print_warning "No log file found. Starting ping system first might help."
    fi
}

# Function to open GUI
open_gui() {
    print_status "Opening GUI interface..."
    
    # Set environment mode for GUI operation
    export CLAUDE_PING_MODE="gui"
    
    # Launch GUI version
    osascript "$UNIFIED_SCRIPT" &
    
    print_success "GUI interface launched!"
}

# Function to open menu bar interface
open_menubar() {
    print_status "Opening menu bar interface..."
    
    # Set environment mode for menu bar operation
    export CLAUDE_PING_MODE="menubar"
    
    # Launch menu bar version
    osascript "$UNIFIED_SCRIPT" &
    
    print_success "Menu bar interface launched!"
}

# Function to open dock interface
open_dock() {
    print_status "Opening dock interface..."
    
    # Set environment mode for dock operation
    export CLAUDE_PING_MODE="dock"
    
    # Launch dock version
    osascript "$UNIFIED_SCRIPT" &
    
    print_success "Dock interface launched!"
}

# Function to configure settings
configure_settings() {
    print_status "Configure settings through CLI..."
    
    echo "Current configuration:"
    if [ -f "$CONFIG_FILE" ]; then
        cat "$CONFIG_FILE"
    else
        echo "No configuration file found. Creating default..."
        cat > "$CONFIG_FILE" << EOF
pingInterval=10
autoRestart=true
notificationsEnabled=true
soundEnabled=true
debugMode=false
EOF
    fi
    
    echo ""
    echo "Edit configuration file? (y/n)"
    read -r response
    
    if [[ "$response" =~ ^[Yy]$ ]]; then
        if command -v nano >/dev/null; then
            nano "$CONFIG_FILE"
        elif command -v vi >/dev/null; then
            vi "$CONFIG_FILE"
        else
            print_error "No text editor found. Please edit $CONFIG_FILE manually."
        fi
        
        print_success "Configuration updated!"
        
        # Restart if running to apply changes
        if is_running; then
            echo "Restart ping system to apply changes? (y/n)"
            read -r restart_response
            if [[ "$restart_response" =~ ^[Yy]$ ]]; then
                restart_ping
            fi
        fi
    fi
}

# Function to perform emergency stop
emergency_stop() {
    print_warning "Performing emergency stop..."
    
    # Kill all related processes
    pkill -9 -f "claude" 2>/dev/null || true
    pkill -9 -f "ping" 2>/dev/null || true
    killall -9 osascript 2>/dev/null || true
    
    # Remove all temp files
    rm -f /tmp/claude_ping_* 2>/dev/null || true
    
    print_success "Emergency stop completed!"
}

# Function to install as system service (macOS)
install_service() {
    print_status "Installing Claude Ping Controller as system service..."
    
    local plist_file="$HOME/Library/LaunchAgents/com.thenewfuse.claudeping.plist"
    
    cat > "$plist_file" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.thenewfuse.claudeping</string>
    <key>ProgramArguments</key>
    <array>
        <string>$0</string>
        <string>start</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <dict>
        <key>SuccessfulExit</key>
        <false/>
    </dict>
    <key>StandardErrorPath</key>
    <string>/tmp/claude_ping_service.log</string>
    <key>StandardOutPath</key>
    <string>/tmp/claude_ping_service.log</string>
</dict>
</plist>
EOF
    
    # Load the service
    launchctl load "$plist_file" 2>/dev/null || true
    
    print_success "Service installed! Use 'launchctl start com.thenewfuse.claudeping' to start."
}

# Function to uninstall system service
uninstall_service() {
    print_status "Uninstalling Claude Ping Controller service..."
    
    local plist_file="$HOME/Library/LaunchAgents/com.thenewfuse.claudeping.plist"
    
    # Stop and unload the service
    launchctl stop com.thenewfuse.claudeping 2>/dev/null || true
    launchctl unload "$plist_file" 2>/dev/null || true
    
    # Remove the plist file
    rm -f "$plist_file"
    
    print_success "Service uninstalled!"
}

# Function to run system diagnostics
run_diagnostics() {
    print_header
    echo -e "${BLUE}Running system diagnostics...${NC}"
    echo ""
    
    # Check if Claude app is installed
    if [ -d "/Applications/Claude.app" ]; then
        print_success "Claude app found: /Applications/Claude.app"
    else
        print_error "Claude app not found in /Applications/"
    fi
    
    # Check AppleScript support
    if command -v osascript >/dev/null; then
        print_success "AppleScript support: Available"
    else
        print_error "AppleScript support: Not available"
    fi
    
    # Check permissions
    if [ -r "$UNIFIED_SCRIPT" ]; then
        print_success "Unified script: Readable"
    else
        print_error "Unified script: Not readable at $UNIFIED_SCRIPT"
    fi
    
    # Check running processes
    local ping_processes=$(ps aux | grep -v grep | grep -c "claude.*ping" || echo "0")
    echo -e "${BLUE}Active ping processes:${NC} $ping_processes"
    
    # Check log file
    if [ -f "$LOG_FILE" ]; then
        local log_size=$(wc -l < "$LOG_FILE" 2>/dev/null || echo "0")
        echo -e "${BLUE}Log entries:${NC} $log_size lines"
    else
        echo -e "${BLUE}Log file:${NC} Not created yet"
    fi
    
    # Check system resources
    echo -e "${BLUE}System load:${NC} $(uptime | awk -F'load average:' '{print $2}')"
    
    print_success "Diagnostics complete!"
}

# Function to show help
show_help() {
    print_header
    echo ""
    echo -e "${BLUE}Usage:${NC} $0 [COMMAND]"
    echo ""
    echo -e "${BLUE}Commands:${NC}"
    echo -e "  ${CYAN}start${NC}           Start the ping system"
    echo -e "  ${CYAN}stop${NC}            Stop the ping system"
    echo -e "  ${CYAN}restart${NC}         Restart the ping system"
    echo -e "  ${CYAN}status${NC}          Show current status"
    echo -e "  ${CYAN}logs${NC}            Show recent log entries"
    echo -e "  ${CYAN}follow${NC}          Follow logs in real-time"
    echo -e "  ${CYAN}gui${NC}             Open GUI interface"
    echo -e "  ${CYAN}menubar${NC}         Open menu bar interface"
    echo -e "  ${CYAN}dock${NC}            Open dock interface"
    echo -e "  ${CYAN}config${NC}          Configure settings"
    echo -e "  ${CYAN}emergency-stop${NC}  Force stop all processes"
    echo -e "  ${CYAN}install-service${NC} Install as system service"
    echo -e "  ${CYAN}uninstall-service${NC} Uninstall system service"
    echo -e "  ${CYAN}diagnostics${NC}     Run system diagnostics"
    echo -e "  ${CYAN}help${NC}            Show this help message"
    echo ""
    echo -e "${BLUE}Examples:${NC}"
    echo -e "  $0 start              # Start ping system"
    echo -e "  $0 status             # Check status"
    echo -e "  $0 logs               # View logs"
    echo -e "  $0 gui                # Open GUI"
    echo ""
    echo -e "${BLUE}Configuration file:${NC} $CONFIG_FILE"
    echo -e "${BLUE}Log file:${NC} $LOG_FILE"
    echo -e "${BLUE}Unified script:${NC} $UNIFIED_SCRIPT"
}

# Main function
main() {
    local command="${1:-help}"
    
    case "$command" in
        start)
            start_ping
            ;;
        stop)
            stop_ping
            ;;
        restart)
            restart_ping
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs
            ;;
        follow)
            follow_logs
            ;;
        gui)
            open_gui
            ;;
        menubar)
            open_menubar
            ;;
        dock)
            open_dock
            ;;
        config|configure)
            configure_settings
            ;;
        emergency-stop)
            emergency_stop
            ;;
        install-service)
            install_service
            ;;
        uninstall-service)
            uninstall_service
            ;;
        diagnostics)
            run_diagnostics
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Unknown command: $command"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
