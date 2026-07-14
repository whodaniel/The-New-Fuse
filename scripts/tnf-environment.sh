#!/usr/bin/env bash
# TNF environment subcommand surface — thin wrapper over the in-tree adapter.
#
# Usage:
#   tnf environment discover           # run the adapter, print the manifest path
#   tnf environment show [--summary]   # render the existing manifest
#   tnf environment reconcile          # re-run + diff vs. previous
#
# Idempotent, read-only, never blocks the caller.

set -uo pipefail

ADAPTER="$ROOT/scripts/tnf-environment-adapter.mjs"
MANIFEST="$HOME/.tnf/environment-manifest.json"
PREV="$HOME/.tnf/environment-manifest.previous.json"

cmd=${1:-}
shift || true

case "$cmd" in
  discover)
    [[ -f "$MANIFEST" ]] && cp -f "$MANIFEST" "$PREV"
    node "$ADAPTER" "$@"
    ;;
  show)
    [[ -f "$MANIFEST" ]] || { echo "[tnf environment] no manifest yet -- run discover"; exit 0; }
    if [[ "${1:-}" == "--summary" ]]; then
      node -e '
        const m = JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));
        const c = m.decisions;
        console.log("host:", m.host.hostname, "(" + m.host.platform + "/" + m.host.arch + ")");
        console.log("agents alive:     ", c.mountable_agents.length, c.mountable_agents.join(", "));
        console.log("infrastructure:   ", (m.surfaces.infrastructure || []).length, "items");
        console.log("providers detected:", (m.surfaces.providers || []).length);
        console.log("apps discovered:  ", (m.surfaces.apps || []).length);
        console.log("running-models:   ", (m.surfaces["running-models"] || []).length);
        console.log("fallback_chain:   ", c.fallback_chain.join(" -> "));
        console.log("feature_parity:   ", c.feature_parity.join(", "));
      ' "$MANIFEST"
    else
      cat "$MANIFEST"
    fi
    ;;
  reconcile)
    node "$ADAPTER"
    if [[ -f "$PREV" ]] && command -v jq >/dev/null 2>&1; then
      echo "[tnf environment] diff vs. previous:"
      diff <(jq -S . "$PREV") <(jq -S . "$MANIFEST") || true
    else
      echo "[tnf environment] reconcile complete (no previous snapshot to diff against)"
    fi
    ;;
  --help|"")
    cat <<USAGE
tnf environment — operate on the TNF environment discovery manifest

Commands:
  discover                  Run the adapter, write ~/.tnf/environment-manifest.json
  show [--summary]          Render the manifest (JSON or summary)
  reconcile                 Re-run and diff vs. the previous snapshot

Manifest location: ~/.tnf/environment-manifest.json
USAGE
    ;;
  *)
    echo "[tnf environment] unknown subcommand: $cmd" >&2
    exit 2
    ;;
esac
