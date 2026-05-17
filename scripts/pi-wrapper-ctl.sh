#!/bin/bash
# Pi Redis Wrapper control script
# Usage: ./pi-wrapper-ctl.sh [start|stop|status|restart|logs]
set -euo pipefail

PLIST_NAME="com.tnf.pi-redis-wrapper"
PLIST_PATH="$HOME/Library/LaunchAgents/${PLIST_NAME}.plist"
TNF_ROOT="/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse"
STDOUT_LOG="/tmp/pi-wrapper-stdout.log"
STDERR_LOG="/tmp/pi-wrapper-stderr.log"

case "${1:-status}" in
    start)
        echo "Loading Pi Redis Wrapper daemon..."
        launchctl load "$PLIST_PATH" 2>/dev/null || echo "Already loaded or error"
        sleep 2
        # Verify it's running
        if launchctl list | grep -q "$PLIST_NAME"; then
            echo "✅ Pi wrapper daemon started"
        else
            echo "❌ Failed to start — check logs: $STDERR_LOG"
        fi
        ;;

    stop)
        echo "Stopping Pi Redis Wrapper daemon..."
        launchctl unload "$PLIST_PATH" 2>/dev/null || echo "Not loaded"
        echo "✅ Pi wrapper daemon stopped"
        ;;

    restart)
        $0 stop
        sleep 2
        rm -f "$STDOUT_LOG" "$STDERR_LOG"
        $0 start
        ;;

    status)
        if launchctl list 2>/dev/null | grep -q "$PLIST_NAME"; then
            PID=$(launchctl list | grep "$PLIST_NAME" | awk '{print $1}')
            echo "✅ Pi wrapper daemon running (PID: $PID)"
        else
            echo "❌ Pi wrapper daemon not running"
        fi
        # Also check redis subscription
        SUBS=$(redis-cli PUBSUB CHANNELS "tnf:*" 2>/dev/null | wc -l | tr -d ' ')
        echo "Redis tnf:* channels active: $SUBS"
        ;;

    logs)
        echo "=== STDOUT (last 20) ==="
        tail -20 "$STDOUT_LOG" 2>/dev/null || echo "(no stdout log)"
        echo ""
        echo "=== STDERR (last 10) ==="
        tail -10 "$STDERR_LOG" 2>/dev/null || echo "(no stderr log)"
        ;;

    test)
        echo "Sending test task to Pi via Redis..."
        TASK_ID="ctl-test-$(date +%s)"
        redis-cli PUBLISH "tnf:agents" "{\"id\":\"${TASK_ID}\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"from\":{\"agentId\":\"hermes-ctl\",\"agentName\":\"hermes\",\"role\":\"orchestrator\"},\"to\":{\"agentId\":\"pi\",\"agentName\":\"pi\"},\"content\":\"What is 2+2?\",\"type\":\"task\",\"expectsResponse\":true}"
        echo "Published task: $TASK_ID"
        echo "Waiting 15s for response..."
        sleep 15
        tail -10 "$STDOUT_LOG" 2>/dev/null
        ;;

    *)
        echo "Usage: $0 {start|stop|status|restart|logs|test}"
        exit 1
        ;;
esac
