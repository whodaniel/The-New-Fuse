#!/usr/bin/env bash
# Stage 1 wrapper - delegates to robust discovery implementation.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"${SCRIPT_DIR}/01-discover-simple.sh" "$@"
