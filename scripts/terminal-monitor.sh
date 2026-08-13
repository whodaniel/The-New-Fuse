#!/bin/bash

# Terminal PID Monitoring and Management System
# Implements the enhanced monitoring patterns from CLAUDE.md
# Optimized for Terminal.app on macOS

TERMINAL_LOG="/tmp/gemini_terminals.log"
MONITORING_LOG="/tmp/terminal_monitoring.log"
CONTENT_DIR="/tmp/terminal_content"

mkdir -p "$CONTENT_DIR"

echo "=== TERMINAL MONITORING SYSTEM INITIALIZED ===" >> "$MONITORING_LOG"
echo "Timestamp: $(date)" >> "$MONITORING_LOG"

# --- Autonomy safety gates (mirrors orchestrator-system.sh pattern) ---
# System-wide "is a human actively at the keyboard/mouse right now" check
# (macOS HIDIdleTime, seconds since last input event, any app). Conservative:
# on error, treat as "active" (i.e. block) rather than risk injecting.
check_human_idle() {
    local min_idle="${TNF_TERMINAL_MONITOR_MIN_IDLE_SECONDS:-20}"
    local idle_seconds
    idle_seconds=$(ioreg -c IOHIDSystem 2>/dev/null | awk '/HIDIdleTime/ {print int($NF/1000000000); exit}')
    if [[ -z "$idle_seconds" ]]; then
        echo "$(date): idle check failed to read HIDIdleTime; treating as active (blocking injection)" >> "$MONITORING_LOG"
        return 1
    fi
    if (( idle_seconds < min_idle )); then
        echo "$(date): system active ${idle_seconds}s ago (< ${min_idle}s threshold); a human may be present, blocking injection" >> "$MONITORING_LOG"
        return 1
    fi
    return 0
}

# Fleet-wide injection pause gate (~/.tnf/fleet/mode.json).
# Reads the mode.json file written by `tnf harness pause [--injection-only]`.
# When mode is 'paused' or 'injection-paused', returns 0 (skip); otherwise 1.
check_fleet_injection_pause() {
    local mode_file="${HOME}/.tnf/fleet/mode.json"
    if [[ -f "$mode_file" ]]; then
        local mode
        mode=$(node -e "try{const f=require('fs').readFileSync('$mode_file','utf8');const j=JSON.parse(f);process.stdout.write(typeof j.mode==='string'?j.mode:'running');}catch(e){process.stdout.write('running');}" 2>/dev/null)
        if [[ "$mode" == "paused" || "$mode" == "injection-paused" ]]; then
            echo "$(date): fleet-mode='$mode' — blocking injection" >> "$MONITORING_LOG"
            return 0
        fi
    fi
    return 1
}

# Function to get and track terminal PID
track_terminal_pid() {
    local terminal_number="$1"
    local terminal_name="$2"
    
    # Attempt to get PID of Terminal or a specific agent process
    # Fallback to Terminal.app if specific process not found
    PID=$(osascript -e 'tell application "System Events" to get unix id of first process whose name is "Terminal"')
    
    echo "Terminal $terminal_number ($terminal_name) PID: $PID" >> "$TERMINAL_LOG"
    echo "$(date): Tracked Terminal $terminal_number - PID: $PID - Task: $terminal_name" >> "$MONITORING_LOG"
    
    export "TERMINAL_${terminal_number}_PID=$PID"
    
    return 0
}

# Function to get terminal content via AppleScript
get_terminal_content() {
    local terminal_number="$1"
    
    # For Terminal.app, we can get the contents of the selected tab of the front window
    # Note: This assumes the terminal of interest is the frontmost one when this is called,
    # or we can iterate through windows if we had window IDs.
    # For now, we'll capture the current frontmost terminal content.
    local content
    content=$(osascript -e 'tell application "Terminal" to get contents of selected tab of front window')
    
    echo "$content" > "$CONTENT_DIR/terminal_${terminal_number}.txt"
}

# Function to focus specific terminal by PID
focus_terminal_by_pid() {
    local terminal_number="$1"
    local pid_var="TERMINAL_${terminal_number}_PID"
    local target_pid="${!pid_var}"
    
    if [ -n "$target_pid" ]; then
        echo "$(date): Focusing Terminal $terminal_number (PID: $target_pid)" >> "$MONITORING_LOG"
        osascript -e "tell application \"System Events\" to set frontmost of first process whose unix id is $target_pid to true"
        return 0
    else
        echo "$(date): ERROR - No PID found for Terminal $terminal_number" >> "$MONITORING_LOG"
        return 1
    fi
}

# Function to monitor terminal for Gemini responses
monitor_gemini_response() {
    local terminal_number="$1"
    local timeout_seconds="${2:-30}"
    local interval=5
    local elapsed=0
    
    echo "$(date): Monitoring Terminal $terminal_number for Gemini response (timeout: ${timeout_seconds}s)" >> "$MONITORING_LOG"
    
    local initial_hash
    get_terminal_content "$terminal_number"
    initial_hash=$(md5 -q "$CONTENT_DIR/terminal_${terminal_number}.txt")
    
    while [ $elapsed -lt $timeout_seconds ]; do
        sleep $interval
        elapsed=$((elapsed + interval))
        
        get_terminal_content "$terminal_number"
        local current_hash
        current_hash=$(md5 -q "$CONTENT_DIR/terminal_${terminal_number}.txt")
        
        if [ "$initial_hash" != "$current_hash" ]; then
            echo "$(date): Activity detected in Terminal $terminal_number" >> "$MONITORING_LOG"
            # Potential response detected
            return 0
        fi
    done
    
    echo "$(date): Timeout reached for Terminal $terminal_number" >> "$MONITORING_LOG"
    return 1
}

# Function to detect common error patterns
detect_errors() {
    local terminal_number="$1"
    local content_file="$CONTENT_DIR/terminal_${terminal_number}.txt"
    
    get_terminal_content "$terminal_number"
    
    echo "$(date): Checking Terminal $terminal_number for error patterns" >> "$MONITORING_LOG"
    
    # Check for model switch
    if grep -q "switching from gemini-2.5-pro to gemini-2.5-flash" "$content_file"; then
        echo "$(date): ALERT - Model switch detected in Terminal $terminal_number" >> "$MONITORING_LOG"
        return 2
    fi
    
    # Check for resubmission prompt
    if grep -q "Please submit a new query to continue with the Flash model" "$content_file"; then
        echo "$(date): ALERT - Resubmission required in Terminal $terminal_number" >> "$MONITORING_LOG"
        return 3
    fi
    
    # Check for API errors
    if grep -Ei "API Error|Quota Exceeded|Rate Limit" "$content_file"; then
        echo "$(date): ALERT - API Error detected in Terminal $terminal_number" >> "$MONITORING_LOG"
        return 4
    fi
    
    echo "$(date): No immediate error patterns detected in Terminal $terminal_number" >> "$MONITORING_LOG"
    return 0
}

# Function to auto-resubmit on Flash model switch
auto_resubmit_flash() {
    local terminal_number="$1"
    local original_task="$2"

    echo "$(date): Auto-resubmitting task to Flash model in Terminal $terminal_number" >> "$MONITORING_LOG"

    # Fleet-pause gate — if operator paused the fleet, skip cleanly.
    if check_fleet_injection_pause; then
        echo "$(date): Skipping Flash resubmission for Terminal $terminal_number (fleet injection paused)" >> "$MONITORING_LOG"
        return 5
    fi

    # HIDIdleTime gate — if a human may be present, refuse to inject.
    if ! check_human_idle; then
        echo "$(date): Skipping Flash resubmission for Terminal $terminal_number (human may be active)" >> "$MONITORING_LOG"
        return 6
    fi

    # Focus the terminal
    focus_terminal_by_pid "$terminal_number"

    # Send resubmission
    # Escaping double quotes for AppleScript
    local escaped_task
    escaped_task=$(echo "$original_task" | sed 's/"/\\"/g')
    
    osascript -e "tell application \"System Events\" to keystroke \"RESUBMITTING TASK for Flash model:

$escaped_task

Please proceed with this analysis using Gemini Flash 2.5.\"" -e 'delay 0.5' -e 'tell application "System Events" to keystroke return'
    
    echo "$(date): Resubmission completed for Terminal $terminal_number" >> "$MONITORING_LOG"
}

# Initialize tracking for existing terminals
echo "=== INITIALIZING PID TRACKING FOR EXISTING TERMINALS ===" >> "$TERMINAL_LOG"

# Track current terminals (assuming 5 are active)
for i in {1..5}; do
    case $i in
        1) task_name="Production Configuration Audit" ;;
        2) task_name="Prompt Templating Analysis" ;;
        3) task_name="Feature Management Audit" ;;
        4) task_name="FairTable System Review" ;;
        5) task_name="Integration Tests Assessment" ;;
    esac
    
    track_terminal_pid "$i" "$task_name"
done

echo "=== TERMINAL MONITORING SYSTEM READY ===" >> "$MONITORING_LOG"
echo "PID tracking completed. Logs available at:"
echo "- Terminal PIDs: $TERMINAL_LOG"
echo "- Monitoring Log: $MONITORING_LOG"
echo "- Content Snapshots: $CONTENT_DIR"
