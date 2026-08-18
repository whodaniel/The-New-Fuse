#!/usr/bin/env bash

set -euo pipefail

ALPHABET="123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"

FILES=(
  "packages/a2a-core/src/federated-identity.service.ts"
  "packages/gemini-browser-skill/src/TranscriptProcessorV2.ts"
  "packages/database/scripts/seed-agent-registry.ts"
  "apps/chrome-extension/src/v6/shared/federation-identity.ts"
  "scripts/lib/federation-protocol.cjs"
)

# Navigate to TNF root
cd "$(dirname "$0")/../.."

ERROR=0

for file in "${FILES[@]}"; do
  if ! grep -q "$ALPHABET" "$file"; then
    echo "ERROR: FEDERATED_BASE58_ALPHABET mismatch or missing in $file"
    ERROR=1
  else
    echo "OK: $file"
  fi
done

if [ $ERROR -ne 0 ]; then
  echo "CI Check Failed: One or more files are missing the canonical alphabet."
  exit 1
fi

echo "Success: All files contain the correct FEDERATED_BASE58_ALPHABET."
