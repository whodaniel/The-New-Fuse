# WebSocket Infrastructure - Quick Reference

## Installation

```bash
pnpm add @the-new-fuse/websocket-infrastructure
```

## Basic Setup

```typescript
import { WebSocketInfrastructureModule } from '@the-new-fuse/websocket-infrastructure';

@Module({
  imports: [
    WebSocketInfrastructureModule.forRoot({
      redis: { host: 'localhost', port: 6379 },
      compression: { enabled: true },
    }),
  ],
})
export class AppModule {}
```

## Common Operations

### Server-Side

#### Broadcast to All

```typescript
wsGateway.broadcast('event', { data: 'value' });
```

#### Send to User

```typescript
wsGateway.sendToUser('user-id', 'event', { data: 'value' });
```

#### Send to Room

```typescript
wsGateway.sendToRoom('room-name', 'event', { data: 'value' });
```

#### Queue Message

```typescript
const id = wsGateway.queueMessage('event', data, priority);
```

#### Get Metrics

```typescript
const metrics = await wsGateway.getMetrics();
const health = await wsGateway.getHealth();
const stats = wsGateway.getConnectionStats();
```

### Client-Side

#### Connect

```typescript
import { WebSocketTestClient } from '@the-new-fuse/websocket-infrastructure/testing';

const client = new WebSocketTestClient({
  url: 'http://localhost:3000',
  reconnection: { enabled: true },
});

await client.connect();
```

#### Subscribe

```typescript
client.on('event', (data) => {
  console.log('Received:', data);
});
```

#### Send

```typescript
client.send('event', { data: 'value' });
```

#### Join Room

```typescript
client.joinRoom('room-name');
```

#### Leave Room

```typescript
client.leaveRoom('room-name');
```

## Configuration Options

| Option                          | Type               | Default       | Description              |
| ------------------------------- | ------------------ | ------------- | ------------------------ |
| `cors.origin`                   | `string\|string[]` | `'*'`         | CORS origins             |
| `redis.host`                    | `string`           | `'localhost'` | Redis host               |
| `redis.port`                    | `number`           | `6379`        | Redis port               |
| `heartbeat.interval`            | `number`           | `30000`       | Ping interval (ms)       |
| `heartbeat.timeout`             | `number`           | `60000`       | Pong timeout (ms)        |
| `compression.enabled`           | `boolean`          | `false`       | Enable compression       |
| `compression.threshold`         | `number`           | `1024`        | Min size for compression |
| `messageQueue.enabled`          | `boolean`          | `false`       | Enable message queue     |
| `messageQueue.maxSize`          | `number`           | `10000`       | Max queue size           |
| `connectionPool.maxConnections` | `number`           | `10000`       | Max connections          |
| `monitoring.enabled`            | `boolean`          | `false`       | Enable metrics           |

## Environment Variables

```bash
# Essential
REDIS_HOST=localhost
REDIS_PORT=6379
WS_MAX_CONNECTIONS=10000

# Optional
REDIS_PASSWORD=
HEARTBEAT_INTERVAL=30000
HEARTBEAT_TIMEOUT=60000
COMPRESSION_ENABLED=true
QUEUE_ENABLED=true
METRICS_ENABLED=true
METRICS_PORT=9090
```

## Events

### Server → Client

| Event               | Payload             | Description             |
| ------------------- | ------------------- | ----------------------- |
| `connected`         | `{ id, timestamp }` | Connection established  |
| `ping`              | `{ timestamp }`     | Heartbeat ping          |
| `disconnect:reason` | `{ reason }`        | Disconnect notification |
| `heartbeat:timeout` | -                   | Heartbeat timeout       |
| `error`             | `{ message }`       | Error occurred          |

### Client → Server

| Event        | Payload             | Description    |
| ------------ | ------------------- | -------------- |
| `message`    | `{ channel, data }` | Send message   |
| `pong`       | `{ timestamp }`     | Heartbeat pong |
| `join:room`  | `roomName`          | Join room      |
| `leave:room` | `roomName`          | Leave room     |

## Metrics

Available at `http://localhost:9090/metrics`:

- `websocket_connections_total` - Total connections
- `websocket_connections_active` - Active connections
- `websocket_messages_total` - Total messages
- `websocket_message_latency_seconds` - Message latency
- `websocket_errors_total` - Total errors
- `websocket_reconnections_total` - Reconnections
- `websocket_queue_size` - Queue size

## Health Check

```bash
curl http://localhost:3000/health
```

Response:

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

## Load Testing

```typescript
import { WebSocketLoadTester } from '@the-new-fuse/websocket-infrastructure/testing';

const results = await new WebSocketLoadTester({
  url: 'http://localhost:3000',
  numClients: 1000,
  messageInterval: 100,
  duration: 60000,
}).run();
```

## Reconnection Strategies

### Exponential Backoff (Default)

```typescript
new ExponentialBackoffStrategy(
  maxAttempts: 10,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2
);
```

### Linear Backoff

```typescript
new LinearBackoffStrategy(
  maxAttempts: 10,
  initialDelay: 1000,
  maxDelay: 10000,
  increment: 1000
);
```

### Fibonacci Backoff

```typescript
new FibonacciBackoffStrategy(
  maxAttempts: 10,
  initialDelay: 1000,
  maxDelay: 30000
);
```

## Compression

### Manual

```typescript
import { CompressionUtil } from '@the-new-fuse/websocket-infrastructure';

const compressed = CompressionUtil.compress(data, 'gzip');
const decompressed = CompressionUtil.decompress(compressed, 'gzip');
```

### Automatic (Middleware)

```typescript
const middleware = new CompressionMiddleware(1024, 'gzip');
const result = middleware.processOutgoing(largeData);
```

## Binary Protocol

```typescript
import { BinaryProtocol } from '@the-new-fuse/websocket-infrastructure';

// Encode/Decode
const encoded = BinaryProtocol.encode(data);
const decoded = BinaryProtocol.decode(encoded);

// Auto-serialization
const { data, type } = MessageSerializer.serialize(object, preferBinary);
const original = MessageSerializer.deserialize(data, type);
```

## Common Issues

### High Memory

- Reduce `maxConnections`
- Enable compression
- Lower queue size

### Connection Drops

- Increase `heartbeat.timeout`
- Check network stability
- Review load balancer config

### Slow Messages

- Check Redis latency
- Enable binary protocol
- Review queue size

### Failed Reconnections

- Increase `maxAttempts`
- Adjust `maxDelay`
- Check server availability

## Nginx Configuration

```nginx
upstream websocket {
    ip_hash;
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
}

server {
    location /socket.io/ {
        proxy_pass http://websocket;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## Docker Compose

```yaml
services:
  websocket:
    image: your-app
    environment:
      REDIS_HOST: redis
    ports:
      - '3000:3000'

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
```

## Best Practices

1. ✅ Use Redis for production
2. ✅ Enable compression for large messages
3. ✅ Set up monitoring and alerts
4. ✅ Configure appropriate timeouts
5. ✅ Use sticky sessions in load balancer
6. ✅ Test under expected load
7. ✅ Implement proper error handling
8. ✅ Use authentication guards

## Resources

- **Architecture**: `/docs/websocket/WEBSOCKET_ARCHITECTURE.md`
- **Examples**: `/docs/websocket/USAGE_EXAMPLES.md`
- **Package**: `/packages/websocket-infrastructure/`
- **Integration**: `/apps/backend/WEBSOCKET_INTEGRATION_GUIDE.md`
