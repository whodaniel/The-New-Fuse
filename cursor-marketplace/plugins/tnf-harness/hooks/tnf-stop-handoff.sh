#!/usr/bin/env bash
# TNF Turn End reminder. Observe-only: fires when the agent finishes a turn and
# nudges toward writing a durable session handoff. Never blocks.
set -euo pipefail
cat >/dev/null 2>&1 || true
printf '{}\n'
exit 0
