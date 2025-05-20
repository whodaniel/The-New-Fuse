# Redis helper functions
function redis-clean() {
    echo "Stopping Redis services..."
    brew services stop redis 2>/dev/null || true
    redis-cli shutdown 2>/dev/null || true
    pkill redis-server 2>/dev/null || true
    sleep 2
    echo "All Redis instances stopped"
}

function redis-docker-start() {
    echo "Starting Redis via Homebrew..."
    redis-clean
    sleep 1
    brew services start redis
    sleep 2
    
    # Verify Redis is running and responding
    echo "Verifying Redis connection..."
    if redis-cli ping | grep -q "PONG"; then
        echo "✅ Redis is running and responding"
        return 0
    else
        echo "❌ Redis failed to start"
        return 1
    fi
}
