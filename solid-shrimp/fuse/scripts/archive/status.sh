#!/bin/bash

# Check TNF Relay System Status
# Usage: ./status.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_DIR="$SCRIPT_DIR/pids"

echo "🔍 TNF Relay System Status"
echo "=========================="

# Check relay server
echo ""
echo "📡 Relay Server:"
if curl -s http://localhost:3000/status > /dev/null 2>&1; then
    echo "   ✅ Running (HTTP API responsive)"
    curl -s http://localhost:3000/status | jq '.' 2>/dev/null || echo "   (Status details not available)"
else
    echo "   ❌ Not running or not responsive"
fi

# Check running adapters
echo ""
echo "🔌 Adapter Instances:"
if [ -d "$PID_DIR" ] && [ "$(ls -A "$PID_DIR" 2>/dev/null)" ]; then
    for pid_file in "$PID_DIR"/adapter-*.pid; do
        if [ -f "$pid_file" ]; then
            instance_name=$(basename "$pid_file" .pid | sed 's/adapter-//')
            pid_num=$(cat "$pid_file")
            
            if ps -p "$pid_num" > /dev/null 2>&1; then
                echo "   ✅ $instance_name (PID: $pid_num)"
            else
                echo "   ❌ $instance_name (PID file exists but process not running)"
            fi
        fi
    done
else
    echo "   ❌ No adapter instances running"
fi

# Check message queues
echo ""
echo "📬 Message Queues:"
QUEUE_DIR="$SCRIPT_DIR/cli-relay-queue"
if [ -d "$QUEUE_DIR" ]; then
    for instance_dir in "$QUEUE_DIR"/*/; do
        if [ -d "$instance_dir" ]; then
            instance_name=$(basename "$instance_dir")
            inbox_count=$(find "$instance_dir/inbox" -name "*.json" 2>/dev/null | wc -l)
            outbox_count=$(find "$instance_dir/outbox" -name "*.json" 2>/dev/null | wc -l)
            echo "   📁 $instance_name: $inbox_count inbox, $outbox_count outbox"
        fi
    done
else
    echo "   ❌ No message queues found"
fi

echo ""
echo "🔗 Quick Commands:"
echo "   Start adapter: ./start-adapter.sh <instance_id>"
echo "   Stop adapter:  ./stop-adapter.sh <instance_id>"
echo "   Send message:  ./send-message.sh <from> <to> <type> <content>"
echo "   Check messages: ./check-messages.sh <instance_id>"
