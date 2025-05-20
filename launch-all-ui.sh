#!/bin/bash

# Make both scripts executable
chmod +x launch-all-pages.js

# Check if the server is running on port 3000
if ! nc -z localhost 3000 &>/dev/null; then
    echo "Starting development server..."
    npm run dev &
    # Wait for server to start (adjust time if needed)
    sleep 10
fi

# Launch all pages
node launch-all-pages.js