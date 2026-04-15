#!/bin/bash

# Send Message via TNF Relay
# Usage: ./send-message.sh <from_instance> <to_instance> <message_type> <content>

if [ $# -lt 4 ]; then
    echo "Usage: ./send-message.sh <from_instance> <to_instance> <message_type> <content>"
    echo "Example: ./send-message.sh instance_A instance_B greeting 'Hello Instance B!'"
    exit 1
fi

FROM_INSTANCE="$1"
TO_INSTANCE="$2"
MESSAGE_TYPE="$3"
CONTENT="$4"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTBOX_DIR="$SCRIPT_DIR/cli-relay-queue/$FROM_INSTANCE/outbox"

# Create outbox directory if it doesn't exist
mkdir -p "$OUTBOX_DIR"

# Generate message ID with timestamp
TIMESTAMP=$(date +%s)
MESSAGE_ID="msg_${TIMESTAMP}_$$"
MESSAGE_FILE="$OUTBOX_DIR/${MESSAGE_ID}.json"

# Create the message JSON with proper format
cat > "$MESSAGE_FILE" << EOF
{
  "id": "$MESSAGE_ID",
  "source": "$FROM_INSTANCE",
  "target": "$TO_INSTANCE",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "type": "$MESSAGE_TYPE",
  "content": "$CONTENT"
}
EOF

echo "✅ Message sent from $FROM_INSTANCE to $TO_INSTANCE"
echo "   Message ID: $MESSAGE_ID"
echo "   Type: $MESSAGE_TYPE"
echo "   Content: $CONTENT"
echo "   File: $MESSAGE_FILE"

# Debug: Show the actual JSON generated
echo ""
echo "📄 Generated JSON:"
cat "$MESSAGE_FILE"
