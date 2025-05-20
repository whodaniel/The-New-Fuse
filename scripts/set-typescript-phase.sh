#!/bin/bash

if [ -z "$1" ]; then
    echo "Usage: $0 <phase-number>"
    echo "Example: $0 1"
    exit 1
fi

PHASE=$1
CONFIG_FILE="config/tsconfig.fix.phase${PHASE}.json"

if [ ! -f "$CONFIG_FILE" ]; then
    echo "Error: Configuration file $CONFIG_FILE not found"
    exit 1
fi

echo "Switching to TypeScript Phase ${PHASE}"
echo "Using configuration: ${CONFIG_FILE}"

# Run TypeScript check with the specified phase
yarn tsc -p "$CONFIG_FILE" --noEmit || {
    echo "⚠️ Phase ${PHASE} TypeScript errors detected"
    echo "Check typescript-errors.log for details"
    yarn tsc -p "$CONFIG_FILE" --noEmit > typescript-errors.log 2>&1
    exit 1
}

echo "✅ Phase ${PHASE} TypeScript check complete"