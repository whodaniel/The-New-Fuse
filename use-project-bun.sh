#!/bin/bash
# Helper script to ensure correct Bun version is used

# Get the absolute path to the project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if bun is installed
if ! command -v bun &>/dev/null; then
  echo "⚠️  Warning: Bun not found. Installing Bun..." >&2
  
  # Install bun
  curl -fsSL https://bun.sh/install | bash
  export PATH="$HOME/.bun/bin:$PATH"
  
  # Check if installation was successful
  if ! command -v bun &>/dev/null; then
    echo "❌ Failed to install Bun" >&2
    exit 1
  fi
fi

# Execute Bun
echo "🥖 Using Bun..." >&2
exec bun "$@"
