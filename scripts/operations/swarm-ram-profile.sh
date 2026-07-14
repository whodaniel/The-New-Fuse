#!/usr/bin/env bash
# TNF swarm RAM profile — source before factory-boot or wrapper launches on 16GB hosts.
# Override any value via environment before sourcing.

export TNF_SWARM_RAM_PROFILE="${TNF_SWARM_RAM_PROFILE:-conservative-16gb}"

# Node heap caps for long-lived swarm daemons (MB)
export TNF_NODE_MEMORY_RELAY_MB="${TNF_NODE_MEMORY_RELAY_MB:-384}"
export TNF_NODE_MEMORY_BRIDGE_MB="${TNF_NODE_MEMORY_BRIDGE_MB:-256}"
export TNF_NODE_MEMORY_WRAPPER_MB="${TNF_NODE_MEMORY_WRAPPER_MB:-256}"
export TNF_NODE_MEMORY_FULL_AUTO_MB="${TNF_NODE_MEMORY_FULL_AUTO_MB:-512}"
export TNF_NODE_MEMORY_SUPERVISOR_MB="${TNF_NODE_MEMORY_SUPERVISOR_MB:-256}"

# Cron / heartbeat concurrency throttles under memory pressure
export TNF_TERMINAL_HEARTBEAT_MAX_TARGETS="${TNF_TERMINAL_HEARTBEAT_MAX_TARGETS:-3}"
export TNF_SWARM_SKIP_DUPLICATE_LSP="${TNF_SWARM_SKIP_DUPLICATE_LSP:-true}"

apply_node_cap() {
  local cap_mb="$1"
  local existing="${NODE_OPTIONS:-}"
  if [[ "$existing" != *"max-old-space-size"* ]]; then
    if [[ -n "$existing" ]]; then
      export NODE_OPTIONS="${existing} --max-old-space-size=${cap_mb}"
    else
      export NODE_OPTIONS="--max-old-space-size=${cap_mb}"
    fi
  fi
}

case "${TNF_SWARM_ROLE:-}" in
  relay)
    apply_node_cap "${TNF_NODE_MEMORY_RELAY_MB}"
    ;;
  bridge|redis-ws-bridge)
    apply_node_cap "${TNF_NODE_MEMORY_BRIDGE_MB}"
    ;;
  wrapper|gemini|pi|antigravity)
    apply_node_cap "${TNF_NODE_MEMORY_WRAPPER_MB}"
    ;;
  full-auto)
    apply_node_cap "${TNF_NODE_MEMORY_FULL_AUTO_MB}"
    ;;
  supervisor)
    apply_node_cap "${TNF_NODE_MEMORY_SUPERVISOR_MB}"
    ;;
esac

audit_swarm_memory() {
  echo "=== TNF Swarm RAM audit (${TNF_SWARM_RAM_PROFILE}) ==="
  vm_stat 2>/dev/null | head -6 || true
  echo ""
  ps aux -m 2>/dev/null | awk 'NR==1 || /danielgoldberg.*(tsserver|cursor-agent|hermes|relay|full-auto|gemini-redis|pi-redis|redis-ws|voice relay|standalone-relay)/ {printf "%s\n",$0}' | head -20
  echo ""
  local tsserver_count tsserver_rss_kb
  tsserver_count="$(pgrep -f 'tsserver.js' 2>/dev/null | wc -l | tr -d ' ')"
  tsserver_rss_kb="$(ps aux 2>/dev/null | awk '/tsserver.js/ {sum+=$6} END {print sum+0}')"
  echo "tsserver instances: ${tsserver_count} (~$((tsserver_rss_kb / 1024))MB RSS total)"
  if (( tsserver_count > 2 )); then
    echo "WARN: duplicate TypeScript language servers inflate RAM; close unused IDE/LSP terminals or restart Hermes lane."
  fi
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  audit_swarm_memory
fi
