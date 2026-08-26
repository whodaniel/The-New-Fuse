#!/usr/bin/env bash
# =============================================================================
# tnf-preflight-check.sh — System resource pre-flight check before TNF builds.
#
# Checks free RAM, load average, and conflicting processes.
#
# Exit codes:
#   0 — OK     (all checks passed)
#   1 — WARN   (marginal resources; caller may choose to proceed)
#   2 — ABORT  (critical resources missing; do NOT proceed)
#
# Designed to run in < 1 second on macOS.
# =============================================================================

# ---------------------------------------------------------------------------
# Thresholds (all in MB / unit-less for load)
# ---------------------------------------------------------------------------
RAM_WARN_MB=2048       # warn if free RAM < 2 GB
RAM_ABORT_MB=512       # abort if free RAM < 512 MB
LOAD_WARN=8            # warn if 1-min load avg > 8
LOAD_ABORT=20          # abort if 1-min load avg > 20

# ---------------------------------------------------------------------------
# ANSI colours (disabled when not a tty)
# ---------------------------------------------------------------------------
if [[ -t 1 ]]; then
  RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'; RESET='\033[0m'
else
  RED=''; YELLOW=''; GREEN=''; RESET=''
fi

# ---------------------------------------------------------------------------
# State tracking
# ---------------------------------------------------------------------------
STATUS=0   # 0=OK, 1=WARN, 2=ABORT
REASONS=()

bump_status() {
  local new="$1"
  [[ $new -gt $STATUS ]] && STATUS=$new
}

ok()   { echo -e "  ${GREEN}[OK]${RESET}    $*"; }
warn() { echo -e "  ${YELLOW}[WARN]${RESET}  $*"; REASONS+=("WARN: $*"); bump_status 1; }
abort(){ echo -e "  ${RED}[ABORT]${RESET} $*"; REASONS+=("ABORT: $*"); bump_status 2; }

# ---------------------------------------------------------------------------
# 1. Free RAM  (macOS vm_stat approach)
# ---------------------------------------------------------------------------
check_ram() {
  local page_size pages_free pages_inactive
  page_size=$(sysctl -n hw.pagesize 2>/dev/null || echo 4096)

  # vm_stat outputs lines like: "Pages free:       12345."
  pages_free=$(vm_stat | awk '/^Pages free:/ { gsub(/\./, "", $3); print $3 }')
  pages_inactive=$(vm_stat | awk '/^Pages inactive:/ { gsub(/\./, "", $3); print $3 }')

  # "Free" available = free + inactive (inactive pages are reclaimable)
  local total_pages=$(( ${pages_free:-0} + ${pages_inactive:-0} ))
  local free_mb=$(( total_pages * page_size / 1024 / 1024 ))

  if [[ $free_mb -lt $RAM_ABORT_MB ]]; then
    abort "Free RAM critically low: ${free_mb}MB available (need ≥${RAM_ABORT_MB}MB to safely build)"
  elif [[ $free_mb -lt $RAM_WARN_MB ]]; then
    warn  "Free RAM is low: ${free_mb}MB available (recommend ≥${RAM_WARN_MB}MB)"
  else
    ok    "Free RAM: ${free_mb}MB available"
  fi
}

# ---------------------------------------------------------------------------
# 2. Load average
# ---------------------------------------------------------------------------
check_load() {
  # sysctl gives load as fixed-point integer (scaled by 2^FSHIFT = 2048 on macOS)
  local raw
  raw=$(sysctl -n vm.loadavg 2>/dev/null || echo "{ 0 0 0 }")
  # Output: "{ 1.23 2.34 3.45 }" — grab first value
  local load1
  load1=$(echo "$raw" | awk '{ print $2 }' | cut -d. -f1)
  local load1_full
  load1_full=$(echo "$raw" | awk '{ print $2 }')

  if [[ ${load1:-0} -ge $LOAD_ABORT ]]; then
    abort "System load critically high: ${load1_full} (threshold: ${LOAD_ABORT})"
  elif [[ ${load1:-0} -ge $LOAD_WARN ]]; then
    warn  "System load is elevated: ${load1_full} (warn threshold: ${LOAD_WARN})"
  else
    ok    "Load average: ${load1_full}"
  fi
}

# ---------------------------------------------------------------------------
# 3. Existing vite build processes
# ---------------------------------------------------------------------------
check_vite_builds() {
  local pids
  pids=$(pgrep -af 'vite build' 2>/dev/null | grep -v 'grep' | awk '{print $1}' || true)
  if [[ -n "$pids" ]]; then
    local count
    count=$(echo "$pids" | wc -l | tr -d ' ')
    abort "Found ${count} running vite build process(es): PIDs ${pids//$'\n'/, }
         Kill them first:  kill ${pids//$'\n'/ }"
  else
    ok "No running vite build processes"
  fi
}

# ---------------------------------------------------------------------------
# 4. Existing eslint full-scan processes
# ---------------------------------------------------------------------------
check_eslint_scans() {
  local pids
  pids=$(pgrep -af 'eslint' 2>/dev/null | grep -v 'grep' | awk '{print $1}' || true)
  if [[ -n "$pids" ]]; then
    local count
    count=$(echo "$pids" | wc -l | tr -d ' ')
    warn "Found ${count} running eslint process(es): PIDs ${pids//$'\n'/, }
         (may compete for memory — consider waiting for it to finish)"
  else
    ok "No running eslint scan processes"
  fi
}

# ---------------------------------------------------------------------------
# Run all checks
# ---------------------------------------------------------------------------
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  TNF Build Pre-flight Check  $(date '+%Y-%m-%d %H:%M:%S')"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_ram
check_load
check_vite_builds
check_eslint_scans

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

case $STATUS in
  0)
    echo -e "  ${GREEN}Result: OK${RESET} — system resources look healthy."
    ;;
  1)
    echo -e "  ${YELLOW}Result: WARN${RESET} — marginal resources detected."
    for r in "${REASONS[@]}"; do echo "    → $r"; done
    ;;
  2)
    echo -e "  ${RED}Result: ABORT${RESET} — critical issues detected. Do not build."
    for r in "${REASONS[@]}"; do echo "    → $r"; done
    ;;
esac

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
exit "$STATUS"
