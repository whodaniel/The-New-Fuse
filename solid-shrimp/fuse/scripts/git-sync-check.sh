#!/bin/bash
# Check git sync status - shows unpushed commits and uncommitted changes

echo "🔍 Checking sync status..."
echo ""

# Count unpushed commits
UNPUSHED=$(git log @{u}.. --oneline 2>/dev/null | wc -l | tr -d ' ')

# Count uncommitted changes
UNCOMMITTED=$(git status --porcelain | wc -l | tr -d ' ')

echo "📊 Status:"
echo "   Unpushed commits: $UNPUSHED"
echo "   Uncommitted changes: $UNCOMMITTED"
echo ""

# Show details if there are issues
if [ "$UNPUSHED" -gt 0 ]; then
  echo "⚠️  Unpushed commits:"
  git log @{u}.. --oneline
  echo ""
fi

if [ "$UNCOMMITTED" -gt 0 ]; then
  echo "⚠️  Uncommitted changes:"
  git status --short
  echo ""
fi

# Final verdict
if [ "$UNPUSHED" -gt 0 ] || [ "$UNCOMMITTED" -gt 0 ]; then
  echo "❌ Repository is NOT fully synced"
  exit 1
else
  echo "✅ Repository is fully synced with remote"
  exit 0
fi
