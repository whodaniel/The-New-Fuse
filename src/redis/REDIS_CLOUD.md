# Connecting to Redis Cloud

This guide explains how to connect to Redis Cloud using the Node.js Redis client.

## Redis Cloud Connection Details

Redis Cloud is a fully-managed cloud service for Redis. Here are the connection details for your Redis Cloud instance:

- **Host**: redis-11337.c93.us-east-1-3.ec2.redns.redis-cloud.com
- **Port**: 11337
- **Username**: default
- **Password**: CxXMZw3qW3zYXq1JYy7bCuqwRrL7tH0d
- **TLS/SSL**: Enabled

## Connecting via Command Line

You can connect to Redis Cloud using the Redis CLI:

```bash
redis-cli -u redis://default:CxXMZw3qW3zYXq1JYy7bCuqwRrL7tH0d@redis-11337.c93.us-east-1-3.ec2.redns.redis-cloud.com:11337
```

For a secure connection with TLS/SSL:

```bash
redis-cli -u rediss://default:CxXMZw3qW3zYXq1JYy7bCuqwRrL7tH0d@redis-11337.c93.us-east-1-3.ec2.redns.redis-cloud.com:11337
```

## Connecting with Node.js Redis Client

The recommended way to connect to Redis Cloud is using the official Node.js Redis client:

```typescript
import { createClient } from 'redis';

// Create a Redis client connected to Redis Cloud
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

// Use Redis operations
await client.set('foo', 'bar');
const value = await client.get('foo');
console.log(value);  // Outputs: bar

// Disconnect when done
await client.disconnect();
```

### Using URL Connection String

You can also connect using a URL connection string:

```typescript
import { createClient } from 'redis';

// Create a Redis client using the URL connection string
const client = createClient({
  url: 'redis://default:CxXMZw3qW3zYXq1JYy7bCuqwRrL7tH0d@redis-11337.c93.us-east-1-3.ec2.redns.redis-cloud.com:11337'
});

// Connect and use Redis
await client.connect();
await client.set('foo', 'bar');
const value = await client.get('foo');
console.log(value);  // Outputs: bar
await client.disconnect();
```

## Example Usage

See the full example in `src/examples/redis-cloud-connection.ts`.

## Redis Operations

The Node.js Redis client supports all the Redis operations you requested:

### Basic Key-Value Operations

```typescript
// Set and get a key
await client.set('key', 'value');
const value = await client.get('key');

// Delete a key
await client.del('key');

// Check if a key exists
const exists = await client.exists('key');

// Set expiration on a key
await client.expire('key', 60); // 60 seconds

// Get the remaining time to live for a key
const ttl = await client.ttl('key');

// Increment a value
await client.incr('counter');

// Rename a key
await client.rename('oldKey', 'newKey');

// Get the type of a key
const type = await client.type('key');

// Get the database size
const size = await client.dbSize();
```

### Hash Operations

```typescript
// Set hash fields
await client.hSet('user:1', 'name', 'John');
await client.hSet('user:1', 'email', 'john@example.com');

// Get a hash field
const name = await client.hGet('user:1', 'name');

// Get all hash fields
const user = await client.hGetAll('user:1');

// Delete a hash field
await client.hDel('user:1', 'email');

// Check if a hash field exists
const hasField = await client.hExists('user:1', 'name');
```

### List Operations

```typescript
// Push values to a list
await client.lPush('mylist', ['value1', 'value2']);
await client.rPush('mylist', 'value3');

// Pop values from a list
const firstValue = await client.lPop('mylist');
const lastValue = await client.rPop('mylist');

// Get a range of values from a list
const values = await client.lRange('mylist', 0, -1);

// Get the length of a list
const length = await client.lLen('mylist');
```

### Set Operations

```typescript
// Add members to a set
await client.sAdd('myset', ['member1', 'member2']);

// Remove members from a set
await client.sRem('myset', 'member1');

// Get all members of a set
const members = await client.sMembers('myset');
```

### Sorted Set Operations

```typescript
// Add members to a sorted set
await client.zAdd('myzset', [{ score: 1, value: 'one' }, { score: 2, value: 'two' }]);

// Get a range of members from a sorted set
const range = await client.zRange('myzset', 0, -1);

// Remove members from a sorted set
await client.zRem('myzset', 'one');
```

### Stream Operations

```typescript
// Add an entry to a stream
await client.xAdd('mystream', '*', { field1: 'value1', field2: 'value2' });

// Delete an entry from a stream
await client.xDel('mystream', '1234567890-0');

// Get a range of entries from a stream
const entries = await client.xRange('mystream', '-', '+');
```

### Pub/Sub Operations

```typescript
// Publish a message to a channel
await client.publish('channel', 'message');

// Subscribe to a channel
await client.subscribe('channel', (message) => {
  console.log(message);
});

// Unsubscribe from a channel
await client.unsubscribe('channel');
```

### JSON Operations (requires RedisJSON module)

```typescript
// Set a JSON value
await client.json.set('user:1', '$', { name: 'John', age: 30 });

// Get a JSON value
const user = await client.json.get('user:1');

// Delete a JSON value
await client.json.del('user:1', '$.age');
```

### Vector Operations (requires RediSearch module)

```typescript
// Create a vector index
await client.ft.create('idx:products', {
  '$.embedding': {
    type: 'VECTOR',
    AS: 'embedding',
    DIM: 128,
    DISTANCE_METRIC: 'COSINE'
  }
});

// Search vectors
const results = await client.ft.search('idx:products', '*=>[KNN 5 @embedding $query_vec]', {
  PARAMS: {
    query_vec: '[0.1, 0.2, 0.3, ...]'
  },
  RETURN: ['$.name', '$.description']
});
```

## SSL/TLS Configuration

When connecting to Redis Cloud with SSL/TLS, you can configure the following parameters:

```typescript
import { createClient } from 'redis';
import * as fs from 'fs';

const client = createClient({
  username: 'default',
  password: 'CxXMZw3qW3zYXq1JYy7bCuqwRrL7tH0d',
  socket: {
    host: 'redis-11337.c93.us-east-1-3.ec2.redns.redis-cloud.com',
    port: 11337,
    tls: true,
    ca: fs.readFileSync('/path/to/ca.pem'),
    key: fs.readFileSync('/path/to/key.pem'),
    cert: fs.readFileSync('/path/to/cert.pem'),
    rejectUnauthorized: true, // Equivalent to cert_reqs
    servername: 'redis-11337.c93.us-east-1-3.ec2.redns.redis-cloud.com'
  }
});
```

Note that Redis Cloud manages its own certificates, so you typically don't need to specify these SSL/TLS parameters unless you're using a custom setup.

## Redis Cloud Features

Redis Cloud provides several features beyond standard Redis:

1. **RedisJSON**: Store and manipulate JSON documents
2. **RediSearch**: Full-text search and secondary indexing
3. **RedisGraph**: Graph database capabilities
4. **RedisTimeSeries**: Time series data structure
5. **RedisBloom**: Probabilistic data structures

To use these features, you'll need to ensure they are enabled in your Redis Cloud instance and then use the corresponding methods in our Redis implementation.

## Security Considerations

1. **Keep your password secure**: Don't commit the password to version control
2. **Use environment variables**: Store sensitive connection details in environment variables
3. **Use TLS/SSL**: Always use TLS/SSL for production connections
4. **Restrict access**: Use Redis ACLs to restrict access to specific commands and keys

## Logging

The Redis implementation includes comprehensive logging for Redis Cloud connections and operations.

### Log Configuration

Configure logging for Redis Cloud connections:

```env
LOG_LEVEL=info                # Global log level
REDIS_LOG_LEVEL=debug         # Redis-specific log level
REDIS_LOG_CONSOLE_ENABLED=true # Enable console logging
REDIS_LOG_FILE_ENABLED=true   # Enable file logging
```

### Log Examples

Here are some example log messages for Redis Cloud operations:

```log
2023-07-15T12:34:56.789Z [info] [redis-client]: Creating Redis client for environment: production
2023-07-15T12:34:56.789Z [info] [redis-client]: Redis client connected to redis-11337.c93.us-east-1-3.ec2.redns.redis-cloud.com:11337
2023-07-15T12:34:56.789Z [debug] [redis-service]: Setting key: user:1
2023-07-15T12:34:56.789Z [debug] [redis-service]: Retrieved key: user:1, exists: true
```

### Monitoring Redis Cloud

You can monitor Redis Cloud connections and operations through logs:

1. **Connection Status**: Logs show connection attempts, successes, and failures
2. **Operation Performance**: Debug logs show operation timing
3. **Error Tracking**: All Redis errors are logged with details

## Troubleshooting

If you encounter connection issues:

1. **Check network connectivity**: Ensure your network allows outbound connections to the Redis Cloud host and port
2. **Verify credentials**: Double-check username and password
3. **TLS/SSL issues**: Ensure your environment trusts the Redis Cloud certificates
4. **Timeout issues**: Increase connection timeout settings if needed
5. **Check logs**: Review Redis logs for detailed error information
6. **Enable debug logging**: Set `REDIS_LOG_LEVEL=debug` for more detailed logs
