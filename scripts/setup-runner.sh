#!/bin/bash
set -e

RUNNER_DIR="${RUNNER_DIR:-$HOME/tnf-runner}"
RUNNER_VERSION="2.330.0"
REPO_URL="${RUNNER_REPO_URL:-https://github.com/whodaniel/fuse}"
TOKEN="${RUNNER_TOKEN:-}"

if [[ -z "$TOKEN" ]]; then
  echo "RUNNER_TOKEN is required. Export it and rerun."
  exit 1
fi

# Create directory
mkdir -p "$RUNNER_DIR"
cd "$RUNNER_DIR"

# Download if not already present
if [ ! -f "config.sh" ]; then
    echo "Downloading runner..."
    curl -o actions-runner-osx-x64-${RUNNER_VERSION}.tar.gz -L https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-osx-x64-${RUNNER_VERSION}.tar.gz
    tar xzf ./actions-runner-osx-x64-${RUNNER_VERSION}.tar.gz
fi

# Configure
echo "Configuring runner..."
./config.sh --url "$REPO_URL" --token "$TOKEN" --name "tnf-mac-runner" --work "_work" --labels "self-hosted,macOS,x64" --unattended --replace

echo "Runner configured successfully located at $RUNNER_DIR"
