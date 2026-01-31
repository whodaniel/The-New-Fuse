#!/bin/bash

# Launch Google Chrome with remote debugging enabled for MCP
# Default port is 9222

PORT=9222

if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --remote-debugging-port=$PORT
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    google-chrome --remote-debugging-port=$PORT
elif [[ "$OSTYPE" == "msys" ]]; then
    # Windows
    start chrome --remote-debugging-port=$PORT
else
    echo "Unsupported OS"
    exit 1
fi
