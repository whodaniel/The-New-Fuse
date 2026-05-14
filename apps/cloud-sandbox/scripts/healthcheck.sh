#!/bin/bash
# Health Check Script for Cloud Sandbox
# Used by Docker HEALTHCHECK and CloudRuntime health monitoring

set -e

PORT=${PORT:-8080}
HEALTH_ENDPOINT="http://localhost:${PORT}/health"

# Attempt health check
response=$(curl -f -s -o /dev/null -w "%{http_code}" "$HEALTH_ENDPOINT" 2>/dev/null || echo "000")

if [ "$response" = "200" ]; then
    echo "✓ Health check passed (HTTP $response)"
    exit 0
else
    echo "✗ Health check failed (HTTP $response)"
    exit 1
fi
