#!/bin/bash
set -euo pipefail
if [[ ! -x "$HOME/bin/voice" ]]; then
  echo "voice is not installed yet. Run 'Install Voice Bridge.command' first."
  exit 1
fi
exec "$HOME/bin/voice"
