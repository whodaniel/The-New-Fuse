# Check Redis helper functions exist
type redis-clean
type redis-docker-start

# Start fresh Redis instance
redis-clean
redis-docker-start

# Verify Redis connection
redis-cli ping

# Verify Redis URL
echo $REDIS_URL  # Should show redis://localhost:6379