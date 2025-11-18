#!/bin/bash

echo "Starting The New Fuse Frontend Development Server..."
cd "./apps/frontend"

# Check if yarn is available
if command -v yarn &> /dev/null; then
    echo "Using Yarn..."
    yarn dev
elif command -v npm &> /dev/null; then
    echo "Using NPM..."
    pnpm run dev
else
    echo "Neither yarn nor npm found. Please install Node.js and npm/yarn."
    exit 1
fi
