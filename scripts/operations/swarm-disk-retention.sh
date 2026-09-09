#!/usr/bin/env bash
# TNF artifact retention: plan by default; --apply archives sealed logs losslessly.
# Authority: docs/protocols/AI_AGENT_ARTIFACT_RETENTION_PROTOCOL.md
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
exec python3 "${ROOT_DIR}/scripts/operations/artifact-retention.py" "$@"
