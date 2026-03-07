#!/bin/bash

echo "Checking Railway deployment status for all services..."
echo "=================================================="

services=("apps/api" "apps/backend" "apps/api-gateway" "apps/frontend" "apps/relay-server" "apps/browser-hub" "apps/mcp-servers")

for service in "${services[@]}"; do
    echo ""
    echo "Checking $service..."
    cd "$service"
    
    # Check if service is linked
    if railway status > /dev/null 2>&1; then
        echo "✓ Service is linked to Railway"
        
        # Try to get logs (if any deployments exist)
        echo "Recent logs:"
        railway logs 2>/dev/null | head -10 || echo "No logs available yet"
    else
        echo "✗ Service not linked to Railway"
    fi
    
    cd - > /dev/null
done

echo ""
echo "=================================================="
echo "Deployment check complete!"
