#!/bin/bash

# Monitor Architecture Implementation Jules Sessions
# Usage: ./scripts/monitor-architecture-sessions.sh

set -e

echo "🔍 Monitoring Architecture Implementation Sessions"
echo "=================================================="
echo ""

# Session IDs
SESSIONS=(
  "12681794388171220622:Skills Registry"
  "8832352615178580952:Semantic Discovery"
  "9592980209651635510:Context Orchestration"
  "18444080063981355866:Conversation Memory"
  "3678960754732421363:Resource Index"
  "14127836508155926428:Jules Callbacks"
  "8866599419311843752:Callback Registry"
  "2360640896316535115:Orchestrator Integration"
  "7919695092976520973:Resource Taxonomy"
  "13575005454623601038:Resource Registry"
  "9303642807083098638:MCP Adapter"
  "4381519450509394085:Extended Thinking"
  "4453608915608887606:Prompt Caching"
  "3107088659349072754:Skill Migration"
)

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
COMPLETED=0
RUNNING=0
FAILED=0
AWAITING=0

echo "📊 Session Status:"
echo "─────────────────────────────────────────────────────────────────"

# Get full session list once
FULL_LIST=$(jules remote list --session 2>/dev/null || echo "")

for session_info in "${SESSIONS[@]}"; do
  IFS=':' read -r SESSION_ID NAME <<< "$session_info"

  # Extract status from full list
  STATUS_LINE=$(echo "$FULL_LIST" | grep "$SESSION_ID" || echo "")

  if echo "$STATUS_LINE" | grep -q "Completed"; then
    echo -e "${GREEN}✅ COMPLETED${NC} - $NAME (ID: $SESSION_ID)"
    ((COMPLETED++))
  elif echo "$STATUS_LINE" | grep -q "Failed"; then
    echo -e "${RED}❌ FAILED${NC}    - $NAME (ID: $SESSION_ID)"
    ((FAILED++))
  elif echo "$STATUS_LINE" | grep -q "Running"; then
    echo -e "${YELLOW}⏳ RUNNING${NC}   - $NAME (ID: $SESSION_ID)"
    ((RUNNING++))
  elif echo "$STATUS_LINE" | grep -q "Awaiting"; then
    echo -e "${BLUE}⏸️  AWAITING${NC}  - $NAME (ID: $SESSION_ID)"
    ((AWAITING++))
  else
    echo -e "❓ UNKNOWN   - $NAME (ID: $SESSION_ID)"
  fi
done

echo "─────────────────────────────────────────────────────────────────"
echo ""

# Summary
TOTAL=${#SESSIONS[@]}
echo "📈 Summary:"
echo "  Total Sessions:     $TOTAL"
echo -e "  ${GREEN}Completed:${NC}          $COMPLETED"
echo -e "  ${YELLOW}Running:${NC}            $RUNNING"
echo -e "  ${BLUE}Awaiting Approval:${NC}  $AWAITING"
echo -e "  ${RED}Failed:${NC}             $FAILED"
echo ""

# Progress bar
PROGRESS=$((COMPLETED * 100 / TOTAL))
echo "Progress: [$PROGRESS%] $COMPLETED/$TOTAL complete"

# Completion bar
FILLED=$((PROGRESS / 5))
BAR=""
for i in $(seq 1 20); do
  if [ $i -le $FILLED ]; then
    BAR="${BAR}█"
  else
    BAR="${BAR}░"
  fi
done
echo "$BAR"
echo ""

# Next actions
if [ $COMPLETED -eq $TOTAL ]; then
  echo -e "${GREEN}🎉 All sessions complete!${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Review results: docs/JULES_ARCHITECTURE_SESSIONS.md"
  echo "2. Pull sessions: jules remote pull --session [ID]"
  echo "3. Apply patches: jules remote pull --session [ID] --apply"
  echo "4. Run migrations: cd prisma && npx prisma migrate dev"
  echo ""
elif [ $FAILED -gt 0 ]; then
  echo -e "${RED}⚠️  Some sessions failed${NC}"
  echo ""
  echo "Review failed sessions and relaunch if needed"
  echo ""
elif [ $AWAITING -gt 0 ]; then
  echo -e "${BLUE}⏸️  Sessions awaiting plan approval${NC}"
  echo ""
  echo "Visit session URLs to approve plans:"
  for session_info in "${SESSIONS[@]}"; do
    IFS=':' read -r SESSION_ID NAME <<< "$session_info"
    STATUS_LINE=$(echo "$FULL_LIST" | grep "$SESSION_ID" || echo "")
    if echo "$STATUS_LINE" | grep -q "Awaiting"; then
      echo "  https://jules.google.com/session/$SESSION_ID"
    fi
  done
  echo ""
else
  echo -e "${YELLOW}⏳ Sessions still running${NC}"
  echo ""
  echo "Estimated time remaining: 15-45 minutes"
  echo "Run this script again to check progress"
  echo ""
fi

# Detailed view option
echo "For detailed status:"
echo "  jules remote list --session"
echo ""
echo "For specific session:"
echo "  jules remote pull --session [SESSION_ID]"
echo ""
