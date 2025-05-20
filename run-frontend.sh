#!/bin/bash

# This script runs the frontend development server

echo "🖥️ Starting the frontend development server..."

# Navigate to the frontend package
cd "$(dirname "$0")/packages/frontend"

# Run the development server
echo "Starting Next.js development server..."
npm run dev

echo "Frontend server stopped"
