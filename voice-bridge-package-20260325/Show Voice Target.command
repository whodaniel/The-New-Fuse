#!/bin/bash
set -euo pipefail
if [[ ! -x "$HOME/bin/voice-target-show" ]]; then
  echo "voice-target-show is not installed yet. Run installer first."
  exit 1
fi
exec "$HOME/bin/voice-target-show"
