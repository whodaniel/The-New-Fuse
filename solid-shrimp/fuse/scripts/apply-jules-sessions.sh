#!/bin/bash

# Script to pull and apply all completed Jules sessions
# Created: 2025-12-28

set -e

echo "🎯 Pulling all completed Jules sessions..."
echo ""

# Get list of completed sessions
COMPLETED_SESSIONS=$(jules remote list --session 2>&1 | grep "Completed" | awk '{print $1}')

if [ -z "$COMPLETED_SESSIONS" ]; then
    echo "❌ No completed sessions found"
    exit 0
fi

# Count sessions
SESSION_COUNT=$(echo "$COMPLETED_SESSIONS" | wc -l | tr -d ' ')
echo "📊 Found $SESSION_COUNT completed sessions"
echo ""

# Counter
COUNTER=1

# Pull and apply each session
for SESSION_ID in $COMPLETED_SESSIONS; do
    echo "[$COUNTER/$SESSION_COUNT] Processing session: $SESSION_ID"

    # Pull the session
    if jules remote pull --session "$SESSION_ID" --apply; then
        echo "✅ Successfully applied session $SESSION_ID"
    else
        echo "⚠️  Failed to apply session $SESSION_ID (may already be applied)"
    fi

    echo ""
    COUNTER=$((COUNTER + 1))
done

echo "🎉 Completed processing all sessions!"
echo ""
echo "Next steps:"
echo "1. Review changes: git status"
echo "2. Test the changes"
echo "3. Commit: git add . && git commit -m 'feat: Apply Jules completed tasks'"
echo "4. Push: git push origin main"
