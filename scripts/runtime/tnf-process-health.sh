#!/usr/bin/env bash
# =============================================================================
# tnf-process-health.sh — TNF process health monitor.
#
# Usage:
#   tnf-process-health.sh            # display health table
#   tnf-process-health.sh --kill-stuck   # offer to kill stuck vite builds
#
# macOS compatible (uses ps, sysctl, vm_stat).
# =============================================================================

KILL_STUCK=false
[[ "${1:-}" == "--kill-stuck" ]] && KILL_STUCK=true

# ---------------------------------------------------------------------------
# ANSI colours (disabled when not a tty)
# ---------------------------------------------------------------------------
if [[ -t 1 ]]; then
  RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'
  CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'; DIM='\033[2m'
else
  RED=''; YELLOW=''; GREEN=''; CYAN=''; BOLD=''; RESET=''; DIM=''
fi

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
hr() { printf '%.0s─' {1..78}; echo; }

human_mem() {
  local kb=$1
  local mb=$(( kb / 1024 ))
  if [[ $mb -ge 1024 ]]; then
    printf '%d.%dGB' "$(( mb / 1024 ))" "$(( (mb % 1024) * 10 / 1024 ))"
  else
    printf '%dMB' "$mb"
  fi
}

# Parse etime string [[DD-]HH:]MM:SS → total seconds
etime_to_secs() {
  local et="${1:-0:00}"
  local total=0
  # Use 10# prefix to force decimal base (avoids octal errors for 08, 09)
  if [[ "$et" =~ ^([0-9]+)-([0-9]+):([0-9]+):([0-9]+)$ ]]; then
    total=$(( 10#${BASH_REMATCH[1]}*86400 + 10#${BASH_REMATCH[2]}*3600 + 10#${BASH_REMATCH[3]}*60 + 10#${BASH_REMATCH[4]} ))
  elif [[ "$et" =~ ^([0-9]+):([0-9]+):([0-9]+)$ ]]; then
    total=$(( 10#${BASH_REMATCH[1]}*3600 + 10#${BASH_REMATCH[2]}*60 + 10#${BASH_REMATCH[3]} ))
  elif [[ "$et" =~ ^([0-9]+):([0-9]+)$ ]]; then
    total=$(( 10#${BASH_REMATCH[1]}*60 + 10#${BASH_REMATCH[2]} ))
  fi
  echo "$total"
}

STUCK_VITE_PIDS=()

# ---------------------------------------------------------------------------
# System-wide stats
# ---------------------------------------------------------------------------
print_system_health() {
  echo -e "${BOLD}${CYAN}System Health${RESET}"
  hr

  local loadavg
  loadavg=$(sysctl -n vm.loadavg 2>/dev/null | awk '{print $2, $3, $4}')
  local load1
  load1=$(echo "$loadavg" | awk '{print $1}' | cut -d. -f1)
  local load_color="$GREEN"
  [[ ${load1:-0} -ge 8  ]] && load_color="$YELLOW"
  [[ ${load1:-0} -ge 20 ]] && load_color="$RED"
  printf "  %-22s %b%s%b\n" "Load avg (1/5/15):" "$load_color" "$loadavg" "$RESET"

  local page_size pages_free pages_inactive total_pages free_mb
  page_size=$(sysctl -n hw.pagesize 2>/dev/null || echo 4096)
  pages_free=$(vm_stat | awk '/^Pages free:/ { gsub(/\./, "", $3); print $3 }')
  pages_inactive=$(vm_stat | awk '/^Pages inactive:/ { gsub(/\./, "", $3); print $3 }')
  total_pages=$(( ${pages_free:-0} + ${pages_inactive:-0} ))
  free_mb=$(( total_pages * page_size / 1024 / 1024 ))
  local ram_color="$GREEN"
  [[ $free_mb -lt 2048 ]] && ram_color="$YELLOW"
  [[ $free_mb -lt 512  ]] && ram_color="$RED"
  printf "  %-22s %b%dMB available%b\n" "Free RAM:" "$ram_color" "$free_mb" "$RESET"

  local swap_info swap_used swap_total
  swap_info=$(sysctl vm.swapusage 2>/dev/null)
  swap_used=$(echo "$swap_info"  | grep -oE 'used = [0-9.]+M' | grep -oE '[0-9.]+' || echo "0")
  swap_total=$(echo "$swap_info" | grep -oE 'total = [0-9.]+M' | grep -oE '[0-9.]+' || echo "0")
  local swap_color="$GREEN"
  (( $(echo "$swap_used > 512" | bc -l 2>/dev/null || echo 0) )) && swap_color="$YELLOW"
  printf "  %-22s %b%sM used / %sM total%b\n" "Swap:" "$swap_color" "$swap_used" "$swap_total" "$RESET"

  echo
}

# ---------------------------------------------------------------------------
# Process table — uses full args to catch node/vite/esbuild etc.
# ---------------------------------------------------------------------------
print_process_table() {
  echo -e "${BOLD}${CYAN}TNF Process Table${RESET}"
  hr
  printf "${BOLD}%-7s %-6s %-6s %-9s %-9s %s${RESET}\n" \
    "PID" "CPU%" "MEM%" "MEM" "ELAPSED" "COMMAND (truncated)"
  hr

  # Get all process info in one ps call (faster than per-pid)
  # Output: pid pcpu pmem rss etime args
  local ps_output
  ps_output=$(ps -eo pid,pcpu,pmem,rss,etime,args 2>/dev/null) || { echo "  (ps failed)"; return; }

  # Filter for TNF-related processes by matching args
  local pattern='vite|esbuild|vitest|tsc |pnpm.*build|pnpm.*dev|tnf-|claude|agy |\.tnf|relay-server|api-server|tauri'

  local found=0
  while IFS= read -r line; do
    # Skip header
    [[ "$line" =~ ^[[:space:]]*PID ]] && continue
    # Skip this script
    [[ "$line" =~ tnf-process-health ]] && continue

    local pid pcpu pmem rss etime args
    read -r pid pcpu pmem rss etime args <<< "$line"

    # Check if args match our pattern
    echo "$args" | grep -qiE "$pattern" 2>/dev/null || continue
    found=1

    local mem_human
    mem_human=$(human_mem "${rss:-0}")

    local total_secs
    total_secs=$(etime_to_secs "${etime:-0:00}")

    # Truncate command to 45 chars
    local short_args="${args:0:60}"

    local flags=""
    local row_color=""
    local mem_mb=$(( ${rss:-0} / 1024 ))
    local cpu_int
    cpu_int=$(echo "${pcpu:-0}" | cut -d. -f1)

    # > 1 GB RAM
    if [[ $mem_mb -ge 1024 ]]; then
      flags+="⚠️ RAM "
      row_color="$YELLOW"
    fi
    # > 50% CPU
    if [[ ${cpu_int:-0} -ge 50 ]]; then
      flags+="⚠️ CPU "
      row_color="$YELLOW"
    fi
    # Running > 5 min at high CPU
    if [[ $total_secs -ge 300 && ${cpu_int:-0} -ge 50 ]]; then
      flags+="⚠️ STUCK "
      row_color="$RED"
    fi
    # vite build > 3 min → stuck vite
    if echo "$args" | grep -qi 'vite build' && [[ $total_secs -ge 180 ]]; then
      flags+="💀 VITE>3m "
      row_color="$RED"
      STUCK_VITE_PIDS+=("$pid")
    fi

    printf "${row_color}%-7s %-6s %-6s %-9s %-9s %-60s %s${RESET}\n" \
      "$pid" "$pcpu" "$pmem" "$mem_human" "$etime" "$short_args" "$flags"
  done <<< "$ps_output"

  [[ $found -eq 0 ]] && echo "  (no TNF-related processes found)"
  echo
}

# ---------------------------------------------------------------------------
# Kill stuck vite builds
# ---------------------------------------------------------------------------
maybe_kill_stuck() {
  if [[ ${#STUCK_VITE_PIDS[@]} -eq 0 ]]; then
    echo -e "${GREEN}No stuck vite build processes detected.${RESET}"
    return
  fi

  echo -e "${RED}⚠  Stuck vite build PIDs: ${STUCK_VITE_PIDS[*]}${RESET}"

  if $KILL_STUCK; then
    if [[ -t 0 ]]; then
      read -r -p "Kill these processes? [y/N] " ans
      if [[ "${ans,,}" == "y" ]]; then
        for pid in "${STUCK_VITE_PIDS[@]}"; do
          echo "  Sending SIGTERM to $pid..."
          kill -TERM "$pid" 2>/dev/null || true
        done
        sleep 2
        for pid in "${STUCK_VITE_PIDS[@]}"; do
          kill -0 "$pid" 2>/dev/null && {
            echo "  SIGKILL $pid (still alive)"
            kill -KILL "$pid" 2>/dev/null || true
          } || true
        done
        echo "Done."
      else
        echo "Aborted."
      fi
    else
      for pid in "${STUCK_VITE_PIDS[@]}"; do
        echo "  SIGTERM → $pid"
        kill -TERM "$pid" 2>/dev/null || true
      done
    fi
  else
    echo "  Run with ${BOLD}--kill-stuck${RESET} to interactively terminate them."
  fi
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
echo
echo -e "${BOLD}╔══════════════════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}║    TNF Process Health Monitor   $(date '+%Y-%m-%d %H:%M:%S')                    ║${RESET}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════════════════════════╝${RESET}"
echo

print_system_health
print_process_table
maybe_kill_stuck

echo
echo -e "${DIM}Legend: ⚠️ RAM=>1GB  ⚠️ CPU=>50%  ⚠️ STUCK=>5m@highCPU  💀 VITE>3m=stuck build${RESET}"
echo
