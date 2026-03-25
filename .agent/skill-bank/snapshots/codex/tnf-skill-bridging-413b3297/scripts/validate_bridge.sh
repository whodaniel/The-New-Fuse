#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: validate_bridge.sh <spec.yml>" >&2
  exit 1
fi

spec="$1"
if [ ! -f "$spec" ]; then
  echo "Spec not found: $spec" >&2
  exit 1
fi

required=("name:" "from:" "to:" "validate:" "fail:" "log:")
missing=0

for key in "${required[@]}"; do
  if ! rg -q "^${key}" "$spec"; then
    echo "Missing key: ${key}"
    missing=1
  fi
done

if [ $missing -ne 0 ]; then
  echo "Bridge spec invalid: $spec" >&2
  exit 1
fi

echo "Bridge spec OK: $spec"
