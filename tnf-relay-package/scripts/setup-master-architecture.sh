#!/bin/bash

# Master Architecture Setup Script

# Create directory structure
echo "Creating directory structure..."
mkdir -p config/monitoring
mkdir -p scripts/monitoring
mkdir -p scripts/validation
mkdir -p scripts/setup
mkdir -p var/log/fuse/architecture-monitoring
mkdir -p var/lib/fuse/metrics/architecture
mkdir -p node_modules

# Initialize npm if needed
if [ ! -f package.json ]; then
    echo "Initializing npm project..."
    echo '{
  "name": "the-new-fuse",
  "version": "1.0.0",
  "description": "The New Fuse - Inter-LLM Communication Framework",
  "scripts": {
    "validate": "node scripts/validation/validate-architecture.js"
  },
  "dependencies": {
    "js-yaml": "^4.1.0"
  }
}' > package.json
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Set up monitoring configuration
echo "Setting up monitoring configuration..."
if [ ! -d "config/monitoring" ]; then
    mkdir -p config/monitoring
fi

# Set up log rotation
echo "Setting up log rotation..."
if [ ! -d "config/logrotate" ]; then
    mkdir -p config/logrotate
fi

# Set up initial validation run
echo "Running initial validation..."
node scripts/validation/validate-architecture.js

# Set up cron job for local environment
echo "Setting up scheduled validation..."
(crontab -l 2>/dev/null || echo "") | grep -v "validate-architecture.js" | \
    { cat; echo "0 */6 * * * cd $(pwd) && node scripts/validation/validate-architecture.js >> var/log/fuse/architecture-monitoring/validation.log 2>&1"; } | \
    crontab -

echo "Setup complete! The Master Information Architecture system has been initialized."
echo "You can find:"
echo "- Monitoring data in var/lib/fuse/metrics/architecture"
echo "- Logs in var/log/fuse/architecture-monitoring"
echo "- Configuration in config/monitoring"
echo "- Validation scripts in scripts/validation"