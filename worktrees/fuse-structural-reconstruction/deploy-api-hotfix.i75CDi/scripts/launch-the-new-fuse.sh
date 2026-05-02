#!/bin/bash
set -e

echo "🚀 Launching The New Fuse..."

# Define environment variables with default values
PROJECT_BASE_DIR="${PROJECT_BASE_DIR:-.}"
LOGS_BASE_DIR="${LOGS_BASE_DIR:-$PROJECT_BASE_DIR/logs}"

# Create a timestamp for logs
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOGS_DIR="$LOGS_BASE_DIR/launch_${TIMESTAMP}"
mkdir -p "$LOGS_DIR"

# Step 1: Build and prepare
echo "📦 Step 1: Building and preparing..."
yarn build > "$LOGS_DIR/build.log" 2>&1
yarn drizzle:generate >> "$LOGS_DIR/build.log" 2>&1
echo "✅ Build and preparation completed"

# Step 2: Database setup
echo "📊 Step 2: Setting up database..."
yarn drizzle:migrate > "$LOGS_DIR/database.log" 2>&1
echo "✅ Database setup completed"

# Step 3: Launch services
echo "🚀 Step 3: Launching services..."
docker-compose -f docker/production.yml up -d > "$LOGS_DIR/services.log" 2>&1
echo "✅ Services launched"

# Step 4: Verify and deploy
echo "🔍 Step 4: Verifying and deploying..."
bash "$PROJECT_BASE_DIR/scripts/verify-services.sh" > "$LOGS_DIR/verify.log" 2>&1 || true
bash "$PROJECT_BASE_DIR/scripts/final-deploy.sh" > "$LOGS_DIR/deploy.log" 2>&1
echo "✅ Verification and deployment completed"

echo "✨ The New Fuse has been successfully launched! ✨"
echo "📝 Launch logs are available at $LOGS_DIR"
