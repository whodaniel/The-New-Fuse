#!/bin/bash

# Stop TNF Relay Adapter Script
# Usage: ./stop-adapter.sh instance_A

if [ -z "$1" ]; then
    echo "Error: Please provide an instance ID"
    echo "Usage: ./stop-adapter.sh <instance_id>"
    echo "Example: ./stop-adapter.sh instance_A"
    exit 1
fi

INSTANCE_ID="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_DIR="$SCRIPT_DIR/pids"
ADAPTER_PID="$PID_DIR/adapter-$INSTANCE_ID.pid"

if [ ! -f "$ADAPTER_PID" ]; then
    echo "No adapter running for $INSTANCE_ID (PID file not found)"
    exit 1
fi

PID_NUM=$(cat "$ADAPTER_PID")

if ps -p "$PID_NUM" > /dev/null 2>&1; then
    echo "Stopping adapter for $INSTANCE_ID (PID: $PID_NUM)..."
    kill "$PID_NUM"
    
    # Wait for process to stop
    sleep 2
    
    if ps -p "$PID_NUM" > /dev/null 2>&1; then
        echo "Process didn't stop gracefully, forcing..."
        kill -9 "$PID_NUM"
    fi
    
    rm "$ADAPTER_PID"
    echo "✅ Adapter stopped successfully!"
else
    echo "Adapter process not found (PID: $PID_NUM)"
    rm "$ADAPTER_PID"
fi
