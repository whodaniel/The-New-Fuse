#!/bin/bash

# Local setup script for Master Architecture system

# Create local directories
echo "Creating local directory structure..."
mkdir -p .fuse/monitoring/metrics
mkdir -p .fuse/monitoring/logs
mkdir -p .fuse/config
mkdir -p .fuse/scripts/validation

# Set up local npm environment
echo "Setting up npm environment..."
if [ ! -f package.json ]; then
    npm init -y
fi

# Install required dependencies
echo "Installing dependencies..."
npm install --save js-yaml

# Set up local monitoring
echo "Configuring local monitoring..."
mkdir -p .fuse/config/monitoring

# Create local validation script runner
echo "#!/bin/bash
node scripts/validation/validate-architecture.js >> .fuse/monitoring/logs/validation.log 2>&1" > .fuse/scripts/run-validation.sh
chmod +x .fuse/scripts/run-validation.sh

# Run initial validation
echo "Running initial validation..."
./.fuse/scripts/run-validation.sh

echo "Local setup complete!"
echo "The Master Information Architecture system has been initialized locally."
echo "You can find:"
echo "- Monitoring data in .fuse/monitoring/metrics"
echo "- Logs in .fuse/monitoring/logs"
echo "- Configuration in .fuse/config"