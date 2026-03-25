#!/usr/bin/env bash
set -euo pipefail

export CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
export VLA_DIR="$CODEX_HOME/skills/imported-claude-agents/value-ladder-architect-agent"

INPUT_JSON="${1:-$VLA_DIR/references/input-template.json}"
REPORT_JSON="$VLA_DIR/output/value_ladder_report.json"
MANIFEST_JSON="$VLA_DIR/output/agent_dispatch_manifest.json"
STATUS_JSON="$VLA_DIR/output/task_status.json"
READY_JSON="$VLA_DIR/output/ready_tasks.json"

bash "$VLA_DIR/scripts/run_pipeline.sh" "$INPUT_JSON" "$REPORT_JSON"
python3 "$VLA_DIR/scripts/orchestrator_tick.py" \
  --manifest "$MANIFEST_JSON" \
  --status "$STATUS_JSON" \
  --out "$READY_JSON"

echo "30m_cycle_ok: $READY_JSON"
