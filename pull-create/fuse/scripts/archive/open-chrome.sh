#!/bin/bash

# Chrome Launcher for The New Fuse Frontend
# This script opens the frontend in Chrome with optimal settings for development

echo "🌍 Opening The New Fuse Frontend in Chrome..."

# Frontend URL
FRONTEND_URL="http://localhost:3001"

# Chrome flags for better development experience
CHROME_FLAGS=(
    "--new-window"
    "--disable-web-security"
    "--disable-features=VizDisplayCompositor"
    "--allow-running-insecure-content"
    "--disable-background-timer-throttling"
    "--disable-renderer-backgrounding"
    "--disable-backgrounding-occluded-windows"
    "--user-data-dir=/tmp/chrome-dev-session"
)

# Check if Chrome is available
if command -v "Google Chrome" &> /dev/null; then
    echo "Opening with Google Chrome..."
    open -a "Google Chrome" "${CHROME_FLAGS[@]}" "$FRONTEND_URL"
elif command -v google-chrome &> /dev/null; then
    echo "Opening with google-chrome..."
    google-chrome "${CHROME_FLAGS[@]}" "$FRONTEND_URL" &
elif command -v chromium &> /dev/null; then
    echo "Opening with Chromium..."
    chromium "${CHROME_FLAGS[@]}" "$FRONTEND_URL" &
elif command -v open &> /dev/null; then
    echo "Opening with default browser..."
    open "$FRONTEND_URL"
else
    echo "❌ Chrome not found. Please open $FRONTEND_URL manually"
    exit 1
fi

echo "✅ Browser launched!"
echo "🌐 Frontend URL: $FRONTEND_URL"
