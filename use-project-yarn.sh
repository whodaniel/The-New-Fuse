#!/bin/bash
# Helper script to ensure correct Yarn version (4.9.1) is used

# Get the absolute path to the project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if the script is running from the project root
if [ ! -f "${PROJECT_ROOT}/.yarnrc.yml" ]; then
  echo "❌ Error: This script must be run from the project root directory" >&2
  exit 1
fi

# Check if local Yarn binary exists
if [ ! -f "${PROJECT_ROOT}/.yarn/releases/yarn-4.9.1.cjs" ]; then
  echo "⚠️  Warning: Local Yarn binary not found. Attempting to set it up..." >&2
  
  # Set up local Yarn
  if command -v corepack &>/dev/null; then
    echo "Using corepack to install Yarn 4.9.1..." >&2
    corepack prepare yarn@4.9.1 --activate
    corepack enable
  else
    echo "Installing corepack..." >&2
    npm install -g corepack
    corepack prepare yarn@4.9.1 --activate
    corepack enable
  fi
  
  # Create the releases directory if it doesn't exist
  mkdir -p "${PROJECT_ROOT}/.yarn/releases"
  
  # If still not exists, show error
  if [ ! -f "${PROJECT_ROOT}/.yarn/releases/yarn-4.9.1.cjs" ]; then
    echo "❌ Failed to set up local Yarn binary" >&2
    exit 1
  fi
fi

# Execute Yarn with the correct version
echo "🧶 Using project Yarn v4.9.1..." >&2
exec "${PROJECT_ROOT}/.yarn/releases/yarn-4.9.1.cjs" "$@"
