#!/bin/sh
echo "🚀 Starting via custom script..."
cd /app
# Ensure environment is set
export PLAYWRIGHT_BROWSERS_PATH=/home/app-user/pw-browsers

# Run the server using tsx
exec npx tsx src/server.ts
