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

# Mirror the pattern-prune that sync-repos.sh applies to the real export.
find "$EXPORT" -type d \( -name '.turbo' -o -name 'node_modules' \) -exec rm -rf {} + 2>/dev/null || true

mkdir -p "$EXPORT/packages/relay-core/src" "$EXPORT/apps/backend/src/modules/orchestrator"
printf '%s\n' 'export class MasterClockStub { async start() { console.warn("[MasterClock] stub mode"); } }' > "$EXPORT/packages/relay-core/src/master-clock.ts"
printf '%s\n' 'export class BrokerAgentStub { async start() { console.warn("[BrokerAgent] stub mode"); } }' > "$EXPORT/packages/relay-core/src/broker-agent.ts"
printf '%s\n' '// no-op implementation for open runtime' > "$EXPORT/apps/backend/src/modules/orchestrator/index.ts"

chmod +x "$SCRIPT_DIR/check-proprietary-leakage.sh"
"$SCRIPT_DIR/check-proprietary-leakage.sh" "$EXPORT"

# ─────────────────────────────────────────────────────────────────────
# Hard-coded operator paths must never ship in the public export.
#
# Resolving a personal path at RUNTIME is fine (os.homedir(), Path.home(),
# $HOME, path.resolve(__dirname, ...)). Baking the literal into source is not:
# it leaks the operator's filesystem layout and is broken for every other user.
#
# privacy-guard.cjs already detects this as `owner_home_path` but at severity
# "warn", so it never blocked — which is how 111 files reached the public repo.
# The export boundary is where the rule is absolute, so it is enforced here.
# ─────────────────────────────────────────────────────────────────────
echo "Checking for hard-coded operator paths..."
PERSONAL_HITS="$(grep -rIl -E '/Users/[a-zA-Z0-9._-]+/' "$EXPORT" 2>/dev/null || true)"
if [ -n "$PERSONAL_HITS" ]; then
  COUNT="$(printf '%s\n' "$PERSONAL_HITS" | grep -c . || true)"
  echo "FAIL: $COUNT file(s) in the export contain a hard-coded /Users/<name>/ path."
  echo "      Replace the literal with runtime resolution, or exclude the file."
  echo "      First 20:"
  FIRST20="$(printf '%s\n' "$PERSONAL_HITS" | sed "s#^$EXPORT/##" | sed -n '1,20p')"
  printf '%s\n' "$FIRST20" | sed 's/^/        /'
  exit 1
fi
echo "PASS: no hard-coded operator paths in export"

echo "PASS: open-runtime export verification"
