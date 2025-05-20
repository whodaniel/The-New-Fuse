#!/bin/bash
set -e

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$SCRIPT_DIR/../.."

# Compile the script
npx tsc -p "$BACKEND_DIR/tsconfig.script.json"

# Run the compiled script
node "$BACKEND_DIR/dist/scripts/run-trae-agent.js"
