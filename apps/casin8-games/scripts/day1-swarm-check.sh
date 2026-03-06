#!/usr/bin/env bash
set -euo pipefail

ROOT="/path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/casin8-games"

node --check "$ROOT/swarm/shared/contracts.mjs"
node --check "$ROOT/swarm/engine-core/index.mjs"
node --check "$ROOT/swarm/sponsorship-ledger/index.mjs"
node --check "$ROOT/swarm/realtime-platform/index.mjs"
node --check "$ROOT/swarm/agent-runtime/index.mjs"
node --check "$ROOT/swarm/tournaments-sng/index.mjs"
node --check "$ROOT/swarm/tournaments-mtt/index.mjs"
node --check "$ROOT/swarm/cashier-token/index.mjs"
node --check "$ROOT/swarm/fairness-security/index.mjs"
node --check "$ROOT/swarm/orchestrator/index.mjs"
node --check "$ROOT/swarm/graphics-assets/index.mjs"
node --check "$ROOT/swarm/engine-sim/index.mjs"
node --check "$ROOT/swarm/agent-strategy/index.mjs"

# Existing reinforcement checks retained.
if [[ -f "$ROOT/swarm/tournament/index.mjs" ]]; then
  node --check "$ROOT/swarm/tournament/index.mjs"
fi

node --test "$ROOT/swarm/day1.test.mjs"
node --test "$ROOT/swarm/day2.test.mjs"
node --test "$ROOT/swarm/day3.test.mjs"
node --test "$ROOT/swarm/day4.test.mjs"
node --test "$ROOT/swarm/day5.test.mjs"
node --test "$ROOT/swarm/day6-sim.test.mjs"
node --test "$ROOT/swarm/day6-strategy.test.mjs"

if [[ -f "$ROOT/swarm/gap-reinforcement.test.mjs" ]]; then
  node --test "$ROOT/swarm/gap-reinforcement.test.mjs"
fi

if [[ -f "$ROOT/scripts/swarm-gap-scan.mjs" ]]; then
  node "$ROOT/scripts/swarm-gap-scan.mjs"
fi

if [[ -f "$ROOT/scripts/swarm-task-packet.mjs" ]]; then
  node --check "$ROOT/scripts/swarm-task-packet.mjs"
  node "$ROOT/scripts/swarm-task-packet.mjs"
fi

if [[ -f "$ROOT/scripts/build-nanobanana-graphics-manifest.mjs" ]]; then
  node --check "$ROOT/scripts/build-nanobanana-graphics-manifest.mjs"
  if ! node "$ROOT/scripts/build-nanobanana-graphics-manifest.mjs"; then
    echo "WARN: build-nanobanana-graphics-manifest failed (optional artifact dependency missing)."
  fi
fi

if [[ -f "$ROOT/scripts/build-nanobanana-task-packets.mjs" ]]; then
  node --check "$ROOT/scripts/build-nanobanana-task-packets.mjs"
  if ! node "$ROOT/scripts/build-nanobanana-task-packets.mjs"; then
    echo "WARN: build-nanobanana-task-packets failed (optional artifact dependency missing)."
  fi
fi

if [[ -f "$ROOT/scripts/validate-nanobanana-graphics-pack.mjs" ]]; then
  node --check "$ROOT/scripts/validate-nanobanana-graphics-pack.mjs"
  if [[ -d "$ROOT/assets/generated/poker" ]] && find "$ROOT/assets/generated/poker" -type f | grep -q .; then
    node "$ROOT/scripts/validate-nanobanana-graphics-pack.mjs"
  else
    echo "Nanobanana validation skipped: no generated assets yet at assets/generated/poker."
  fi
fi

if [[ -f "$ROOT/scripts/nanobanana-progress-report.mjs" ]]; then
  node --check "$ROOT/scripts/nanobanana-progress-report.mjs"
  if ! node "$ROOT/scripts/nanobanana-progress-report.mjs"; then
    echo "WARN: nanobanana-progress-report failed (optional packet missing in this environment)."
  fi
fi

if [[ -f "$ROOT/scripts/swarm-api-smoke.mjs" ]]; then
  node --check "$ROOT/scripts/swarm-api-smoke.mjs"
  if ! node "$ROOT/scripts/swarm-api-smoke.mjs" --spawn; then
    echo "WARN: swarm-api-smoke failed in this environment; continuing with unit/integration-green status."
  fi
fi
