#!/bin/bash

# Enable error handling
set -e

echo "Setting up Yarn Berry..."

# Set local yarn version
yarn set version 3.6.3

# Clear any existing plugins
rm -rf .yarn/plugins/* 2>/dev/null || true

# Enable the workspace plugin
yarn plugin import @yarnpkg/plugin-workspace-tools

# Clean cache and node_modules
rm -rf .yarn/cache .yarn/install-state.gz node_modules chrome-extension/node_modules .yarn/build-state.yml

# Install dependencies
yarn install

# Build chrome extension
cd chrome-extension
yarn install
yarn build
