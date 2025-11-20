#!/bin/sh

set -e

# SERVICE_PATH should be just the service name (e.g., 'api', 'frontend', 'backend')

if [ "$SERVICE_PATH" = "frontend" ]; then
  # For the frontend, a simple check to see if the server is responding is sufficient.
  curl -f http://localhost:$PORT/ || exit 1
else
  # For backend services, check the /health endpoint.
  curl -f http://localhost:$PORT/health || exit 1
fi
