#!/bin/bash

echo "Setting up monitoring and health checks for Railway services..."
echo "============================================================="

# Array of services to monitor
services=("apps/api" "apps/backend" "apps/api-gateway" "apps/frontend" "apps/relay-server" "apps/browser-hub" "apps/mcp-servers")

# Function to add health check endpoint to a service
add_health_check() {
    local service_dir=$1
    local service_name=$(basename "$service_dir")
    
    echo "Setting up health check for $service_name..."
    
    # Check if package.json exists
    if [ -f "$service_dir/package.json" ]; then
        # Add health check script if it doesn't exist
        if ! grep -q '"health"' "$service_dir/package.json"; then
            echo "Adding health check script to $service_name package.json"
            # This would require jq to properly modify JSON, for now just log
            echo "  - Health check script needs to be added manually"
        fi
    fi
    
    # Create a simple health check endpoint file if it doesn't exist
    if [ ! -f "$service_dir/health.js" ]; then
        cat > "$service_dir/health.js" << 'EOF'
// Simple health check endpoint
const http = require('http');
const port = process.env.PORT || 3000;

// Basic health check function
function healthCheck() {
    return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version
    };
}

// If this is run directly, start a simple health server
if (require.main === module) {
    const server = http.createServer((req, res) => {
        if (req.url === '/health' || req.url === '/') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(healthCheck()));
        } else {
            res.writeHead(404);
            res.end('Not Found');
        }
    });
    
    server.listen(port, () => {
        console.log(`Health check server running on port ${port}`);
    });
}

module.exports = { healthCheck };
EOF
        echo "  ✓ Created health.js for $service_name"
    fi
}

# Function to create monitoring dashboard config
create_monitoring_config() {
    cat > "monitoring-config.json" << 'EOF'
{
  "services": [
    {
      "name": "api",
      "url": "${API_URL}",
      "healthEndpoint": "/health",
      "expectedStatus": 200,
      "timeout": 5000
    },
    {
      "name": "backend", 
      "url": "${BACKEND_URL}",
      "healthEndpoint": "/health",
      "expectedStatus": 200,
      "timeout": 5000
    },
    {
      "name": "api-gateway",
      "url": "${API_GATEWAY_URL}",
      "healthEndpoint": "/health", 
      "expectedStatus": 200,
      "timeout": 5000
    },
    {
      "name": "frontend",
      "url": "${FRONTEND_URL}",
      "healthEndpoint": "/",
      "expectedStatus": 200,
      "timeout": 10000
    },
    {
      "name": "relay-server",
      "url": "${RELAY_SERVER_URL}",
      "healthEndpoint": "/health",
      "expectedStatus": 200,
      "timeout": 5000
    },
    {
      "name": "browser-hub",
      "url": "${BROWSER_HUB_URL}",
      "healthEndpoint": "/health",
      "expectedStatus": 200,
      "timeout": 5000
    },
    {
      "name": "mcp-servers",
      "url": "${MCP_SERVERS_URL}",
      "healthEndpoint": "/health",
      "expectedStatus": 200,
      "timeout": 5000
    }
  ],
  "monitoring": {
    "interval": 60000,
    "retries": 3,
    "alerting": {
      "enabled": true,
      "channels": ["console", "webhook"]
    }
  }
}
EOF
    echo "✓ Created monitoring-config.json"
}

# Function to create a simple monitoring script
create_monitoring_script() {
    cat > "monitor-services.js" << 'EOF'
#!/usr/bin/env node

const http = require('http');
const https = require('https');
const fs = require('fs');

// Load monitoring configuration
let config;
try {
    config = JSON.parse(fs.readFileSync('monitoring-config.json', 'utf8'));
} catch (error) {
    console.error('Failed to load monitoring config:', error.message);
    process.exit(1);
}

// Function to check service health
async function checkService(service) {
    return new Promise((resolve) => {
        const url = new URL(service.url + service.healthEndpoint);
        const client = url.protocol === 'https:' ? https : http;
        
        const req = client.request(url, {
            method: 'GET',
            timeout: service.timeout || 5000
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    service: service.name,
                    status: res.statusCode === service.expectedStatus ? 'healthy' : 'unhealthy',
                    statusCode: res.statusCode,
                    responseTime: Date.now() - startTime,
                    timestamp: new Date().toISOString()
                });
            });
        });
        
        const startTime = Date.now();
        
        req.on('error', (error) => {
            resolve({
                service: service.name,
                status: 'error',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        });
        
        req.on('timeout', () => {
            req.destroy();
            resolve({
                service: service.name,
                status: 'timeout',
                timestamp: new Date().toISOString()
            });
        });
        
        req.end();
    });
}

// Function to monitor all services
async function monitorServices() {
    console.log('🔍 Checking service health...');
    console.log('================================');
    
    const results = await Promise.all(
        config.services.map(service => checkService(service))
    );
    
    results.forEach(result => {
        const icon = result.status === 'healthy' ? '✅' : '❌';
        console.log(`${icon} ${result.service}: ${result.status}`);
        if (result.responseTime) {
            console.log(`   Response time: ${result.responseTime}ms`);
        }
        if (result.error) {
            console.log(`   Error: ${result.error}`);
        }
    });
    
    console.log('================================');
    
    const healthyCount = results.filter(r => r.status === 'healthy').length;
    const totalCount = results.length;
    
    console.log(`📊 Health Summary: ${healthyCount}/${totalCount} services healthy`);
    
    return results;
}

// Run monitoring
if (require.main === module) {
    monitorServices().catch(console.error);
}

module.exports = { monitorServices, checkService };
EOF
    chmod +x monitor-services.js
    echo "✓ Created monitor-services.js"
}

# Main execution
echo "🚀 Starting monitoring setup..."

# Add health checks to each service
for service in "${services[@]}"; do
    if [ -d "$service" ]; then
        add_health_check "$service"
    else
        echo "⚠️  Service directory $service not found"
    fi
done

echo ""
echo "📊 Creating monitoring configuration..."
create_monitoring_config
create_monitoring_script

echo ""
echo "✅ Monitoring setup complete!"
echo ""
echo "Next steps:"
echo "1. Update service URLs in monitoring-config.json with actual Railway URLs"
echo "2. Run './monitor-services.js' to test service health"
echo "3. Set up automated monitoring with Railway's built-in monitoring"
echo "4. Configure alerting webhooks if needed"
echo ""
echo "To test monitoring:"
echo "  node monitor-services.js"