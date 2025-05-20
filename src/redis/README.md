# Redis Service Implementation

This directory contains the implementation of the Redis service for The New Fuse project. It provides a comprehensive set of Redis operations, supporting both local Docker development and Redis Cloud for production.

## Features

- Environment-based configuration (development, production, test)
- Support for both local Docker Redis and Redis Cloud
- Support for Node.js Redis client
- Comprehensive set of Redis operations:
  - Basic key-value operations
  - Hash operations
  - List operations
  - Set operations
  - Sorted set operations
  - Stream operations
  - Pub/Sub operations
  - JSON operations (requires RedisJSON module)
  - Vector operations (requires RedisSearch module)
  - Index operations
  - Utility operations
- SSL/TLS support for secure connections
- Comprehensive logging system
- Task-specific methods for The New Fuse project

## Usage

### Basic Usage with Environment Detection

```typescript
import { RedisService } from '../redis';

async function example() {
  // Create Redis service
  const redisService = new RedisService();

  // Initialize with environment-based configuration
  // Uses Docker in development, Redis Cloud in production
  await redisService.initialize();

  try {
    // Use Redis operations
    await redisService.set('key', 'value');
    const value = await redisService.get('key');
    console.log(value);
  } finally {
    // Always disconnect when done
    await redisService.disconnect();
  }
}
```

### Development Environment (Docker)

```typescript
import { RedisService } from '../redis';

async function developmentExample() {
  // Create Redis service for development
  const redisService = new RedisService();
  await redisService.initialize('development');

  try {
    // Use Redis operations with local Docker Redis
    await redisService.set('key', 'value');
    const value = await redisService.get('key');
    console.log(value);
  } finally {
    await redisService.disconnect();
  }
}
```

### Production Environment (Redis Cloud)

```typescript
import { RedisService } from '../redis';

async function productionExample() {
  // Create Redis service for production
  const redisService = new RedisService();
  await redisService.initialize('production');

  try {
    // Use Redis operations with Redis Cloud
    await redisService.set('key', 'value');
    const value = await redisService.get('key');
    console.log(value);
  } finally {
    await redisService.disconnect();
  }
}
```

### Direct Client Usage

```typescript
import { createClient } from 'redis';

async function directClientExample() {
  // Create Redis client directly
  const client = createClient({
    username: 'default',
    password: 'CxXMZw3qW3zYXq1JYy7bCuqwRrL7tH0d',
    socket: {
      host: 'redis-11337.c93.us-east-1-3.ec2.redns.redis-cloud.com',
      port: 11337
    }
  });

  // Set up error handler
  client.on('error', err => console.log('Redis Client Error', err));

  // Connect to Redis
  await client.connect();

  try {
    // Use Redis operations
    await client.set('key', 'value');
    const value = await client.get('key');
    console.log(value);
  } finally {
    // Always disconnect when done
    await client.disconnect();
  }
}
```

## Configuration

### Environment Variables

The Redis client can be configured using environment variables:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USERNAME=default
REDIS_PASSWORD=your-password
REDIS_DB=0
REDIS_TLS=false
```

### Development Configuration (Docker)

- `host`: localhost
- `port`: 6379
- `username`: (none)
- `password`: (none)
- `db`: 0
- `tls`: false

### Production Configuration (Redis Cloud)

- `host`: redis-11337.c93.us-east-1-3.ec2.redns.redis-cloud.com
- `port`: 11337
- `username`: default
- `password`: CxXMZw3qW3zYXq1JYy7bCuqwRrL7tH0d
- `db`: 0
- `tls`: false

## Development and Production Setup

### Docker Setup for Development

We use Docker Compose for local development. The Redis service is defined in `docker-compose.dev.yml`:

```yaml
# Redis for development
redis:
  image: redis:7-alpine
  container_name: the-new-fuse-redis
  ports:
    - "6379:6379"
  volumes:
    - redis-data:/data
  command: redis-server --appendonly yes
  restart: unless-stopped
  networks:
    - thefuse-network
  healthcheck:
    test: ["CMD", "redis-cli", "ping"]
    interval: 10s
    timeout: 5s
    retries: 3
```

To start the development environment:

```bash
# Start all services including Redis
docker-compose -f docker-compose.dev.yml up -d

# Start only Redis
docker-compose -f docker-compose.dev.yml up -d redis

# Stop all services
docker-compose -f docker-compose.dev.yml down
```

### Redis Cloud Setup for Production

For production, we use Redis Cloud:

1. **Connection Details**:
   - Host: redis-11337.c93.us-east-1-3.ec2.redns.redis-cloud.com
   - Port: 11337
   - Username: default
   - Password: CxXMZw3qW3zYXq1JYy7bCuqwRrL7tH0d

2. **Connection via Redis CLI**:

   ```bash
   redis-cli -u redis://default:CxXMZw3qW3zYXq1JYy7bCuqwRrL7tH0d@redis-11337.c93.us-east-1-3.ec2.redns.redis-cloud.com:11337
   ```

3. **Environment Configuration**:
   Set these environment variables in your production environment:

   ```env
   REDIS_HOST=redis-11337.c93.us-east-1-3.ec2.redns.redis-cloud.com
   REDIS_PORT=11337
   REDIS_USERNAME=default
   REDIS_PASSWORD=CxXMZw3qW3zYXq1JYy7bCuqwRrL7tH0d
   REDIS_TLS=false
   ```

## Redis Operations

### Basic Key-Value Operations

- `get(key)`: Get value by key
- `set(key, value, ttl?)`: Set value with optional TTL
- `del(key)`: Delete key
- `exists(key)`: Check if key exists
- `expire(key, seconds)`: Set key expiration
- `ttl(key)`: Get remaining TTL for key
- `incr(key)`: Increment value
- `rename(source, destination)`: Rename key
- `type(key)`: Get type of key
- `dbsize()`: Get database size

### Hash Operations

- `hset(key, field, value)`: Set hash field
- `hget(key, field)`: Get hash field
- `hgetall(key)`: Get all hash fields
- `hdel(key, field)`: Delete hash field
- `hexists(key, field)`: Check if hash field exists

### List Operations

- `lpush(key, value)`: Push value to list head
- `rpush(key, value)`: Push value to list tail
- `lpop(key)`: Pop value from list head
- `rpop(key)`: Pop value from list tail
- `lrange(key, start, stop)`: Get range of list values
- `llen(key)`: Get list length

### Set Operations

- `sadd(key, member)`: Add member to set
- `srem(key, member)`: Remove member from set
- `smembers(key)`: Get all set members

### Sorted Set Operations

- `zadd(key, score, member)`: Add member to sorted set
- `zrange(key, start, stop, withScores?)`: Get range of sorted set members
- `zrem(key, member)`: Remove member from sorted set

### Stream Operations

- `xadd(key, id, fields)`: Add entry to stream
- `xdel(key, id)`: Delete entry from stream
- `xrange(key, start, end, count?)`: Get range of stream entries

### Pub/Sub Operations

- `publish(channel, message)`: Publish message to channel
- `subscribe(channel, callback)`: Subscribe to channel
- `unsubscribe(channel)`: Unsubscribe from channel

### JSON Operations

- `json_get(key, path?)`: Get JSON value
- `json_set(key, path, json)`: Set JSON value
- `json_del(key, path?)`: Delete JSON value

### Vector Operations

- `set_vector_in_hash(key, field, vector)`: Set vector in hash
- `get_vector_from_hash(key, field)`: Get vector from hash
- `vector_search_hash(indexName, query, options?)`: Search vectors
- `create_vector_index_hash(indexName, schema)`: Create vector index

### Index Operations

- `get_indexes()`: Get all indexes
- `get_index_info(indexName)`: Get index info
- `get_indexed_keys_number(indexName)`: Get number of indexed keys

### Utility Operations

- `client_list()`: Get client list
- `info(section?)`: Get Redis info
- `pipeline()`: Create pipeline for batch operations

## Logging

The Redis implementation includes a comprehensive logging system that provides detailed information about Redis operations, connections, and errors.

### Logging Configuration

The logging system can be configured using environment variables:

```env
LOG_LEVEL=info                # Global log level (error, warn, info, debug, verbose)
REDIS_LOG_LEVEL=debug         # Redis-specific log level
REDIS_LOG_CONSOLE_ENABLED=true # Enable console logging
REDIS_LOG_FILE_ENABLED=true   # Enable file logging
REDIS_LOG_FILE_PATH=logs/redis # Log file directory
```

### Log Files

Redis logs are stored in the following files:

- `logs/redis/redis-YYYY-MM-DD.log`: General Redis logs
- `logs/redis/redis-client-YYYY-MM-DD.log`: Redis client logs
- `logs/redis/redis-service-YYYY-MM-DD.log`: Redis service logs

### Log Format

Logs are formatted as JSON in log files and as human-readable text in the console:

```log
2023-07-15T12:34:56.789Z [info] [redis-client]: Connected to Redis at localhost:6379
```

### Log Levels

The logging system supports the following log levels:

- `error`: Critical errors that prevent normal operation
- `warn`: Warnings about potential issues
- `info`: Informational messages about normal operation
- `debug`: Detailed debugging information
- `verbose`: Very detailed debugging information

### Logged Events

The following events are logged:

- Redis client connection/disconnection
- Redis client errors
- Redis operations (set, get, del, etc.)
- Redis service initialization/shutdown
- Redis configuration loading
