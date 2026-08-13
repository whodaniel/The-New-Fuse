# WebSocket Infrastructure

Production-ready WebSocket infrastructure with connection pooling, Redis pub/sub, horizontal scaling, and comprehensive monitoring.

## Features

- **Connection Pooling**: Efficient connection management with configurable limits and idle timeout
- **Redis Pub/Sub**: Horizontal scaling across multiple servers
- **Load Balancing**: Sticky session support with nginx/HAProxy configurations
- **Reconnection Strategies**: Multiple backoff strategies (exponential, linear, fibonacci)
- **Message Queuing**: Reliable message delivery with priority support
- **Monitoring & Metrics**: Prometheus metrics and health checks
- **Heartbeat/Ping-Pong**: Automatic connection health monitoring
- **Compression**: Automatic message compression for large payloads
- **Binary Protocol**: MessagePack support for efficient data transfer
- **Testing Tools**: Load testing and client utilities

## Installation

```bash
pnpm add @the-new-fuse/websocket-infrastructure
```

## Quick Start

### Server Setup

```typescript
import { Module } from '@nestjs/common';
import { WebSocketInfrastructureModule } from '@the-new-fuse/websocket-infrastructure';

@Module({
  imports: [
    WebSocketInfrastructureModule.forRoot({
      port: 3000,
      cors: {
        origin: '*',
        credentials: true,
      },
      redis: {
        host: 'localhost',
        port: 6379,
      },
      heartbeat: {
        interval: 30000,
        timeout: 60000,
      },
      compression: {
        enabled: true,
        threshold: 1024,
      },
      messageQueue: {
        enabled: true,
        maxSize: 10000,
        ttl: 3600000,
      },
      connectionPool: {
        maxConnections: 10000,
        idleTimeout: 300000,
      },
      monitoring: {
        enabled: true,
        metricsPort: 9090,
      },
    }),
  ],
})
export class AppModule {}
```

### Client Setup

```typescript
import { WebSocketTestClient } from '@the-new-fuse/websocket-infrastructure/testing';

const client = new WebSocketTestClient({
  url: 'http://localhost:3000',
  auth: {
    token: 'your-auth-token',
  },
  reconnection: {
    enabled: true,
    maxAttempts: 10,
    initialDelay: 1000,
  },
  compression: {
    enabled: true,
    threshold: 1024,
  },
});

await client.connect();

// Subscribe to messages
client.on('notification', (data) => {
  console.log('Received notification:', data);
});

// Send message
client.send('message', { text: 'Hello, World!' });

// Join room
client.joinRoom('chat-room-1');
```

## Architecture

### Connection Flow

```
Client → Load Balancer → WebSocket Server → Redis Pub/Sub
                              ↓
                       Connection Pool
                              ↓
                       Message Queue
                              ↓
                       Processing
```

### Components

#### 1. Connection Pool

Manages WebSocket connections with automatic cleanup of idle connections.

```typescript
import { ConnectionPool } from '@the-new-fuse/websocket-infrastructure';

const pool = new ConnectionPool(10000, 300000);

// Add connection
pool.add(socket);

// Get user connections
const connections = pool.getUserConnections('user-id');

// Update activity
pool.updateActivity('socket-id');

// Get statistics
const stats = pool.getStats();
```

#### 2. Connection Manager

Handles connection lifecycle with heartbeat monitoring.

```typescript
import { ConnectionManager } from '@the-new-fuse/websocket-infrastructure';

const manager = new ConnectionManager(connectionPool, 30000, 60000);

// Handle new connection
manager.handleConnection(socket);

// Broadcast to all
manager.broadcast('event', data);

// Send to specific user
manager.sendToUser('user-id', 'event', data);

// Send to room
manager.sendToRoom('room-name', 'event', data);
```

#### 3. Redis Adapter

Enables horizontal scaling with Redis pub/sub.

```typescript
import { RedisWebSocketAdapter } from '@the-new-fuse/websocket-infrastructure';

const adapter = new RedisWebSocketAdapter({
  host: 'localhost',
  port: 6379,
  password: 'your-password',
});

await adapter.initialize();
adapter.setupSocketIO(io);

// Publish message
await adapter.publish('channel', { data: 'message' });

// Subscribe to channel
await adapter.subscribe('channel', (message) => {
  console.log('Received:', message);
});
```

#### 4. Message Queue

Ensures reliable message delivery with priority support.

```typescript
import { MessageQueue } from '@the-new-fuse/websocket-infrastructure';

const queue = new MessageQueue({
  maxSize: 10000,
  ttl: 3600000,
  processingInterval: 100,
  maxRetries: 3,
});

queue.start();

// Enqueue message
const messageId = queue.enqueue('channel', data, priority);

// Listen for processing
queue.on('message:process', (item) => {
  console.log('Processing:', item);
});
```

#### 5. Reconnection Strategies

Multiple strategies for handling reconnections.

```typescript
import {
  ReconnectionManager,
  ExponentialBackoffStrategy,
  LinearBackoffStrategy,
  FibonacciBackoffStrategy,
} from '@the-new-fuse/websocket-infrastructure';

// Exponential backoff
const strategy = new ExponentialBackoffStrategy(10, 1000, 30000, 2);

const manager = new ReconnectionManager(strategy);

await manager.attemptReconnection(
  async () => {
    await client.connect();
  },
  () => console.log('Reconnected'),
  (error) => console.error('Failed to reconnect:', error)
);
```

#### 6. Compression

Automatic compression for large messages.

```typescript
import { CompressionUtil, CompressionMiddleware } from '@the-new-fuse/websocket-infrastructure';

// Manual compression
const compressed = CompressionUtil.compress(data, 'gzip');
const decompressed = CompressionUtil.decompress(compressed, 'gzip');

// Middleware
const middleware = new CompressionMiddleware(1024, 'gzip');

// Process outgoing
const result = middleware.processOutgoing(largeData);
if (result.compressed) {
  console.log('Data compressed');
}

// Process incoming
const original = middleware.processIncoming(result.data, result.compressed, result.algorithm);
```

#### 7. Binary Protocol

MessagePack support for efficient serialization.

```typescript
import { BinaryProtocol, MessageSerializer } from '@the-new-fuse/websocket-infrastructure';

// Encode/decode
const encoded = BinaryProtocol.encode(data);
const decoded = BinaryProtocol.decode(encoded);

// Automatic serialization
const { data: serialized, type } = MessageSerializer.serialize(complexObject, true);
const original = MessageSerializer.deserialize(serialized, type);

// Compare efficiency
const comparison = BinaryProtocol.compareWithJSON(data);
console.log(`Binary saves ${comparison.ratio.toFixed(2)}%`);
```

#### 8. Monitoring

Prometheus metrics and health checks.

```typescript
import { WebSocketMonitoring } from '@the-new-fuse/websocket-infrastructure';

const monitoring = new WebSocketMonitoring();

// Record events
monitoring.recordConnection(true);
monitoring.recordMessage('inbound', 'chat');
monitoring.recordMessageLatency(45, 'chat');
monitoring.recordError('connection');

// Get metrics
const metrics = await monitoring.getMetrics(); // Prometheus format
const metricsJSON = await monitoring.getMetricsJSON();

// Health check
const health = await monitoring.getHealthStatus({
  redis: true,
  queueSize: 100,
  errors: [],
});
```

## Load Balancing

### Nginx Configuration

```nginx
upstream websocket_backend {
    ip_hash;  # Sticky sessions

    server backend1.example.com:3000 max_fails=3 fail_timeout=30s;
    server backend2.example.com:3000 max_fails=3 fail_timeout=30s;
    server backend3.example.com:3000 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name ws.example.com;

    location /socket.io/ {
        proxy_pass http://websocket_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;

        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }
}
```

### HAProxy Configuration

```haproxy
frontend websocket_front
    bind *:80
    default_backend websocket_back

backend websocket_back
    balance source  # Sticky sessions
    option httpchk GET /health

    server ws1 backend1.example.com:3000 check
    server ws2 backend2.example.com:3000 check
    server ws3 backend3.example.com:3000 check
```

## Load Testing

```typescript
import { WebSocketLoadTester } from '@the-new-fuse/websocket-infrastructure/testing';

const tester = new WebSocketLoadTester({
  url: 'http://localhost:3000',
  numClients: 1000,
  messageInterval: 100,
  duration: 60000,
  messageSize: 500,
});

const results = await tester.run();
console.log(results);
```

## Metrics

The infrastructure exposes Prometheus metrics on the configured port:

```
# Connection metrics
websocket_connections_total
websocket_connections_active

# Message metrics
websocket_messages_total
websocket_message_latency_seconds
websocket_message_processing_seconds

# Error metrics
websocket_errors_total
websocket_reconnections_total

# Queue metrics
websocket_queue_size
```

## Health Endpoint

Health check endpoint returns:

```json
{
  "healthy": true,
  "timestamp": "2025-11-18T00:00:00.000Z",
  "connections": 1234,
  "redis": true,
  "messageQueue": 45,
  "errors": []
}
```

## Best Practices

1. **Use Connection Pooling**: Set appropriate limits based on server capacity
2. **Enable Redis**: Required for horizontal scaling
3. **Configure Heartbeats**: Detect and cleanup dead connections
4. **Use Compression**: Enable for messages > 1KB
5. **Monitor Metrics**: Set up alerts on connection count, errors, and latency
6. **Implement Backpressure**: Use message queue to handle spikes
7. **Test Under Load**: Use the load tester before production
8. **Set Timeouts**: Configure appropriate timeouts for your use case

## Environment Variables

```bash
# WebSocket Server
WS_PORT=3000
WS_MAX_CONNECTIONS=10000

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Monitoring
METRICS_PORT=9090
METRICS_ENABLED=true

# Heartbeat
HEARTBEAT_INTERVAL=30000
HEARTBEAT_TIMEOUT=60000

# Compression
COMPRESSION_ENABLED=true
COMPRESSION_THRESHOLD=1024

# Message Queue
QUEUE_ENABLED=true
QUEUE_MAX_SIZE=10000
QUEUE_TTL=3600000
```

## Troubleshooting

### High Memory Usage

- Reduce `maxConnections` in connection pool
- Lower `messageQueue.maxSize`
- Enable compression for large messages

### Connection Drops

- Increase `heartbeat.timeout`
- Check network stability
- Review load balancer configuration

### Slow Message Delivery

- Check Redis connection latency
- Review message queue size
- Enable binary protocol for large messages

### Failed Reconnections

- Increase `maxAttempts` in reconnection strategy
- Adjust `maxDelay` for backoff
- Check server availability

## License

MIT
