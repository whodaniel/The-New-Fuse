#!/bin/bash

echo "Checking CloudRuntime deployment status for all services..."
echo "=================================================="

services=("apps/api" "apps/backend" "apps/api-gateway" "apps/frontend" "apps/relay-server" "apps/browser-hub" "apps/mcp-servers")

for service in "${services[@]}"; do
    echo ""
    echo "Checking $service..."
    cd "$service"
    
    # Check if service is linked
    if cloud_runtime status > /dev/null 2>&1; then
        echo "✓ Service is linked to CloudRuntime"
        
        # Try to get logs (if any deployments exist)
        echo "Recent logs:"
        cloud_runtime logs 2>/dev/null | head -10 || echo "No logs available yet"
    else
        echo "✗ Service not linked to CloudRuntime"
    fi
    
    cd - > /dev/null
done

echo ""
echo "=================================================="
echo "Deployment check complete!"
