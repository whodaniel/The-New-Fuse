#!/bin/bash

MAX_RETRIES=5
RETRY_DELAY=2 # seconds
RETRIES=0
PORT=""

echo "Attempting to start frontend dev server..."

while [ $RETRIES -lt $MAX_RETRIES ]; do
  RETRIES=$((RETRIES+1))
  echo "Attempt $RETRIES of $MAX_RETRIES..."

  # Find an available port
  PORT=$(pnpm exec node ../../packages/port-management/scripts/find-available-port.cjs frontend)
  if [ -z "$PORT" ]; then
    echo "Error: Could not find an available port."
    if [ $RETRIES -lt $MAX_RETRIES ]; then
      echo "Retrying in $RETRY_DELAY seconds..."
      sleep $RETRY_DELAY
      continue
    else
      echo "Max retries reached. Exiting."
      exit 1
    fi
  fi

  echo "Found available port: $PORT. Attempting to start Vite..."

  # Try to start Vite
  vite --host 0.0.0.0 --port "$PORT"
  VITE_EXIT_CODE=$?

  if [ $VITE_EXIT_CODE -eq 0 ]; then
    echo "Vite started successfully on port $PORT."
    exit 0
  else
    echo "Vite failed with exit code $VITE_EXIT_CODE."
    # A common reason for Vite to fail on startup is port collision
    # We can be more sophisticated here by grepping for specific error messages,
    # but for now, any non-zero exit code will trigger a retry.
    if [ $RETRIES -lt $MAX_RETRIES ]; then
      echo "Retrying in $RETRY_DELAY seconds..."
      sleep $RETRY_DELAY
    else
      echo "Max retries reached. Exiting."
      exit 1
    fi
  fi
done

exit 1
