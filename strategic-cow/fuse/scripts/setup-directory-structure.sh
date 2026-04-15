#!/bin/bash
set -e

echo "🏗️ Creating directory structure..."

# Create main package directories
mkdir -p packages/features/{dashboard,agents,auth}/components
mkdir -p packages/ui-components/src/core
mkdir -p packages/shared/utils
mkdir -p apps/frontend/src/{components,pages}
mkdir -p analysis/dependencies

echo "✅ Directory structure created successfully!"