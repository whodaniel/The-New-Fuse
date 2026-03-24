#!/usr/bin/env bash
set -euo pipefail

name="${1:-}"
if [[ -z "$name" ]]; then
  echo "usage: new_bridge_spec.sh <bridge-name>"
  exit 2
fi

out="${PWD}/${name}.BRIDGE.md"
if [[ -f "$out" ]]; then
  echo "FAIL: already exists: $out"
  exit 1
fi

cat > "$out" <<'MD'
# BridgeSpec

## Purpose

## Inputs

- Files:
- Env:
- Services:

## Outputs

- Files:
- Logs:
- Artifacts:

## Steps

1.
2.
3.

## Guards

- Pre:
- Post:

## Failure Modes

## Verification
MD

echo "OK: wrote $out"

