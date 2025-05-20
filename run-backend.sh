#!/bin/bash

# This script runs the backend development server

echo "🖥️ Starting the backend development server..."

# Navigate to the backend package
cd "$(dirname "$0")/packages/backend"

# Run the development server
echo "Starting backend server..."
npm run dev

echo "Backend server stopped"
