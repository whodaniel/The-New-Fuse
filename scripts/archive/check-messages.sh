#!/bin/bash

# Check for incoming messages in TNF Relay
# Usage: ./check-messages.sh <instance_id>

if [ -z "$1" ]; then
    echo "Usage: ./check-messages.sh <instance_id>"
    echo "Example: ./check-messages.sh instance_A"
    exit 1
fi

INSTANCE_ID="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INBOX_DIR="$SCRIPT_DIR/cli-relay-queue/$INSTANCE_ID/inbox"

if [ ! -d "$INBOX_DIR" ]; then
    echo "No inbox found for $INSTANCE_ID"
    exit 1
fi

MESSAGE_COUNT=$(find "$INBOX_DIR" -name "*.json" | wc -l)

if [ "$MESSAGE_COUNT" -eq 0 ]; then
    echo "No new messages for $INSTANCE_ID"
    exit 0
fi

echo "📬 Found $MESSAGE_COUNT new message(s) for $INSTANCE_ID:"
echo ""

for message_file in "$INBOX_DIR"/*.json; do
    if [ -f "$message_file" ]; then
        echo "📄 Message: $(basename "$message_file")"
        echo "   Content:"
        cat "$message_file" | jq '.' 2>/dev/null || cat "$message_file"
        echo ""
        
        # Automatically mark the message as read and delete it
        rm "$message_file"
        echo "   ✅ Message marked as read and deleted"
        echo "---"
    fi
done
