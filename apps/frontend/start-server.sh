#!/bin/bash

# Start Vite Development Server for The New Fuse Frontend
echo "🚀 Starting The New Fuse - Frontend Development Server"
echo "📂 Directory: $(pwd)"
echo "⚡ Running: pnpm run dev"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies first..."
    pnpm install
    echo ""
fi

# Start the development server
echo "🌐 Starting server on http://localhost:3000"
echo "🔥 Hot reload enabled - changes will update automatically"
echo "⏹️  Press Ctrl+C to stop the server"
echo ""

pnpm run dev
