#!/bin/bash
echo "👁️  Awakening Big Brother..."

# 1. Check Dependencies
if [ ! -d "packages/relay-core/node_modules/redis" ]; then
  echo "⚠️  Dependencies not found in packages/relay-core. Please ensure 'pnpm add redis zod' has completed."
fi

# 2. Check local Redis
if ! nc -z localhost 6379 2>/dev/null; then
  echo "❌ Redis is NOT running on localhost:6379. Please start it."
  exit 1
fi

# 3. Start Relay with Redis Bridge
echo "🚀 Starting Relay with Redis Bridge..."
# Kill port 3001 gracefully
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# Navigate to root to ensure paths are correct
cd "$(dirname "$0")/.."

# Start Relay
echo "   - Launching Relay core..."
cd packages/relay-core
# Use ENABLE_REDIS_BRIDGE=true
ENABLE_REDIS_BRIDGE=true nohup pnpm run relay:dev > /tmp/relay.log 2>&1 &
RELAY_PID=$!
echo "   ✅ Relay started (PID: $RELAY_PID). Logs: /tmp/relay.log"

# 4. Start Router
echo "🧠 Starting Orchestrator Router..."
cd ../workflow-engine
# Use ts-node to run the start script
nohup npx ts-node --transpile-only --compiler-options '{"module":"commonjs","moduleResolution":"node"}' src/orchestrator/start.ts > /tmp/router.log 2>&1 &
ROUTER_PID=$!
echo "   ✅ Router started (PID: $ROUTER_PID). Logs: /tmp/router.log"

# 5. Wait a bit for initialization
echo "⏳ Waiting for initialization (5s)..."
sleep 5

# 6. Verify Logs
echo "🔍 Status Check:"
echo "--- Relay Logs (Last 3) ---"
tail -n 3 /tmp/relay.log
echo "--- Router Logs (Last 3) ---"
tail -n 3 /tmp/router.log

echo ""
echo "🎉 System is running. Monitor logs with:"
echo "tail -f /tmp/relay.log /tmp/router.log"
