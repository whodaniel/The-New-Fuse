#!/bin/bash

# Start TNF Relay Adapter Script
# Usage: ./start-adapter.sh instance_A

if [ -z "$1" ]; then
    echo "Error: Please provide an instance ID"
    echo "Usage: ./start-adapter.sh <instance_id>"
    echo "Example: ./start-adapter.sh instance_A"
    exit 1
fi

INSTANCE_ID="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
PID_DIR="$SCRIPT_DIR/pids"

# Create directories if they don't exist
mkdir -p "$LOG_DIR"
mkdir -p "$PID_DIR"

# Define file paths
ADAPTER_LOG="$LOG_DIR/adapter-$INSTANCE_ID.log"
ADAPTER_PID="$PID_DIR/adapter-$INSTANCE_ID.pid"

# Check if adapter is already running
if [ -f "$ADAPTER_PID" ]; then
    if ps -p "$(cat "$ADAPTER_PID")" > /dev/null 2>&1; then
        echo "Adapter for $INSTANCE_ID is already running (PID: $(cat "$ADAPTER_PID"))"
        exit 0
    else
        # Remove stale PID file
        rm "$ADAPTER_PID"
    fi
fi

echo "Starting TNF Relay Adapter for $INSTANCE_ID..."

# Start the adapter in the background
cd "$SCRIPT_DIR"
nohup npx pnpm run relay-adapter.js --instance-id="$INSTANCE_ID" > "$ADAPTER_LOG" 2>&1 &
ADAPTER_PID_NUM=$!

# Save the PID
echo "$ADAPTER_PID_NUM" > "$ADAPTER_PID"

echo "✅ Adapter started successfully!"
echo "   Instance ID: $INSTANCE_ID"
echo "   PID: $ADAPTER_PID_NUM"
echo "   Log file: $ADAPTER_LOG"
echo "   PID file: $ADAPTER_PID"
echo ""
echo "To stop the adapter, run: ./stop-adapter.sh $INSTANCE_ID"
echo "To view logs, run: tail -f $ADAPTER_LOG"
