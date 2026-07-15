#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <input.json> [output.json]" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INPUT_JSON="$1"
OUTPUT_JSON="${2:-$SCRIPT_DIR/../output/value_ladder_report.json}"

mkdir -p "$(dirname "$OUTPUT_JSON")"

python3 "$SCRIPT_DIR/build_value_ladder_report.py" "$INPUT_JSON" --out "$OUTPUT_JSON" --pretty
python3 "$SCRIPT_DIR/validate_value_ladder_report.py" "$OUTPUT_JSON"

echo "pipeline_ok: $OUTPUT_JSON"
