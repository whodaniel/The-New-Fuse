#!/bin/bash

# This script packages the specified directories into individual zip files.

# Create a directory to store the packaged files
mkdir -p github-packages

# List of packages to be zipped
packages=(
  "agent-protocol-bridge"
  "api-gateway"
  "cache"
  "cli"
  "commands-core"
  "communication"
  "config"
  "core-auth"
  "debugging"
  "docs"
  "frontend"
  "integration-core"
  "integrations"
  "job-queue"
  "messaging"
  "shared-ui"
  "tnf-cli"
  "tnf-core"
  "unified-discovery"
  "unified-orchestration"
  "web"
  "websocket"
  "workflow-engine"
)

# Loop through the packages and zip them
for package in "${packages[@]}"
do
  if [ -d "packages/$package" ]; then
    echo "Packaging $package..."
    zip -r "github-packages/$package.zip" "packages/$package"
  else
    echo "Directory packages/$package does not exist."
  fi
done

echo "All specified packages have been packaged."
