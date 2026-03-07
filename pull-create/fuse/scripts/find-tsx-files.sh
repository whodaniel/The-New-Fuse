#!/bin/bash

# Make the output more readable with some formatting
echo "🔍 Searching for .tsx files..."
echo "================================"

find . -type f -name "*.tsx" \
    ! -path "*/node_modules/*" \
    ! -path "*/dist/*" \
    ! -path "*/build/*" \
    ! -path "*/.next/*" \
    | sort
