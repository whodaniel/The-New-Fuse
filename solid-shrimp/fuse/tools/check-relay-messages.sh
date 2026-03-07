#!/bin/bash

# Check for new relay messages and display them
# Usage: ./check-relay-messages.sh [--clear]

MESSAGE_FILE="$HOME/.fuse/relay_messages.json"
LAST_CHECK_FILE="$HOME/.fuse/last_message_check"

if [ ! -f "$MESSAGE_FILE" ]; then
    echo "No messages file found"
    exit 0
fi

# Get timestamp of last check
if [ -f "$LAST_CHECK_FILE" ]; then
    LAST_CHECK=$(cat "$LAST_CHECK_FILE")
else
    LAST_CHECK="1970-01-01T00:00:00.000Z"
fi

# Get new messages since last check
NEW_MESSAGES=$(cat "$MESSAGE_FILE" | python3 -c "
import sys, json
from datetime import datetime

data = json.load(sys.stdin)
last_check = '$LAST_CHECK'

new_msgs = [m for m in data if m.get('receivedAt', '') > last_check]

if new_msgs:
    print(json.dumps(new_msgs, indent=2))
else:
    print('[]')
")

if [ "$NEW_MESSAGES" != "[]" ]; then
    echo "=== NEW RELAY MESSAGES ==="
    echo "$NEW_MESSAGES"
    echo "=========================="

    # Update last check timestamp
    date -u +"%Y-%m-%dT%H:%M:%S.000Z" > "$LAST_CHECK_FILE"

    # If --clear flag, clear the messages
    if [ "$1" = "--clear" ]; then
        echo "[]" > "$MESSAGE_FILE"
        echo "Messages cleared"
    fi
else
    echo "No new messages"
fi
