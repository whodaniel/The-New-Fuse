#!/bin/bash
# Lightweight open-runtime export verification (no git init — disk-safe).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MONO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
EXPORT="/tmp/tnf-open-export-$$"
trap 'rm -rf "$EXPORT"' EXIT

mkdir -p "$EXPORT"
(cd "$MONO_ROOT" && git archive HEAD) | tar -x -C "$EXPORT"

# Source proprietary arrays from sync-repos.sh
eval "$(awk '
  /^PROPRIETARY_FILES=\(/,/^\)/ { print }
  /^PROPRIETARY_DIRS=\(/,/^\)/ { print }
  /^PROPRIETARY_SCRIPTS=\(/,/^\)/ { print }
  /^ALWAYS_EXCLUDE=\(/,/^\)/ { print }
' "$MONO_ROOT/scripts/sync-repos.sh")"

for f in "${PROPRIETARY_FILES[@]}"; do [ -e "$EXPORT/$f" ] && rm -f "$EXPORT/$f" || true; done
for d in "${PROPRIETARY_DIRS[@]}"; do [ -d "$EXPORT/$d" ] && rm -rf "$EXPORT/$d" || true; done
for f in "${PROPRIETARY_SCRIPTS[@]}"; do [ -e "$EXPORT/$f" ] && rm -f "$EXPORT/$f" || true; done
for f in "${ALWAYS_EXCLUDE[@]}"; do [ -e "$EXPORT/$f" ] && rm -rf "$EXPORT/$f" || true; done

mkdir -p "$EXPORT/packages/relay-core/src" "$EXPORT/apps/backend/src/modules/orchestrator"
printf '%s\n' 'export class MasterClockStub { async start() { console.warn("[MasterClock] stub mode"); } }' > "$EXPORT/packages/relay-core/src/master-clock.ts"
printf '%s\n' 'export class BrokerAgentStub { async start() { console.warn("[BrokerAgent] stub mode"); } }' > "$EXPORT/packages/relay-core/src/broker-agent.ts"
printf '%s\n' '// no-op implementation for open runtime' > "$EXPORT/apps/backend/src/modules/orchestrator/index.ts"

chmod +x "$SCRIPT_DIR/check-proprietary-leakage.sh"
"$SCRIPT_DIR/check-proprietary-leakage.sh" "$EXPORT"
echo "PASS: open-runtime export verification"
