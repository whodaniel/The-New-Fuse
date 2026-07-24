#!/bin/bash
echo "🔍 Checking all CloudRuntime services..."
echo ""

# List of services we saw earlier
services=("compassionate-celebration" "precious-expression" "unique-luck" "@the-new-fuse/frontend-app" "perceptive-liberation" "resilient-vitality")

for service in "${services[@]}"; do
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📦 Service: $service"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Link to service and get status
    cloud_runtime service --service "$service" 2>/dev/null || echo "❌ Failed to link to $service"
    
    # Get domain if available
    domain=$(cloud_runtime domain 2>/dev/null | grep "https://" | head -1)
    if [ ! -z "$domain" ]; then
        echo "🌐 Domain: $domain"
    else
        echo "🌐 Domain: Not configured"
    fi
    
    # Check recent logs for errors
    echo "📋 Recent status:"
    cloud_runtime logs --tail 3 2>/dev/null | tail -3 || echo "No logs available"
    echo ""
done
