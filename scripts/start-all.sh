#!/bin/bash

# Check if Redis is already running
redis_running=$(pgrep redis-server > /dev/null && echo "yes" || echo "no")

if [ "$redis_running" = "yes" ]; then
  echo "Redis server is already running..."
else
  echo "Starting Redis server..."
  redis-server --daemonize yes
fi

# Start backend
echo "Starting Backend..."
cd "$(dirname "$0")/../apps/backend" || exit
npm run start &

# Wait for backend to initialize
sleep 5

# Check if notification service exists
NOTIFICATION_SERVICE="$(dirname "$0")/../apps/services/notification-service"
if [ -d "$NOTIFICATION_SERVICE" ]; then
  echo "Starting additional services..."
  cd "$NOTIFICATION_SERVICE" || exit
  npm run start &
else
  echo "Notification service directory not found, skipping..."
fi

# Start frontend
echo "Starting Frontend..."
cd "$(dirname "$0")/../apps/frontend" || exit
yarn dev &

# Open in Chrome
sleep 5
echo "Opening application in Chrome..."
open -a "Google Chrome" http://localhost:3000

echo "All services started!"
