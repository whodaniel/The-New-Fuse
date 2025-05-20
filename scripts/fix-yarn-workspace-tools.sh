#!/bin/bash

set -e

echo "=== Fixing Yarn Workspace Tools Issue ==="

# Check if .yarnrc.yml exists
if [ ! -f ".yarnrc.yml" ]; then
  echo "Error: .yarnrc.yml not found!"
  exit 1
fi

# Create backup of .yarnrc.yml
cp .yarnrc.yml .yarnrc.yml.backup
echo "Created backup: .yarnrc.yml.backup"

# Check if plugin-workspace-tools is already enabled
if grep -q "plugin-workspace-tools" .yarnrc.yml; then
  echo "plugin-workspace-tools is already enabled in .yarnrc.yml"
else
  # Add plugin-workspace-tools to .yarnrc.yml
  echo "Adding plugin-workspace-tools to .yarnrc.yml"
  cat >> .yarnrc.yml << EOL

plugins:
  - path: .yarn/plugins/@yarnpkg/plugin-workspace-tools.cjs
    spec: "@yarnpkg/plugin-workspace-tools"
EOL

  # Install the plugin
  echo "Installing plugin-workspace-tools..."
  yarn plugin import workspace-tools
  
  echo "✅ Successfully added plugin-workspace-tools to .yarnrc.yml"
fi

echo "=== Fix Complete ==="
echo "Now you can run 'yarn workspaces foreach' commands"