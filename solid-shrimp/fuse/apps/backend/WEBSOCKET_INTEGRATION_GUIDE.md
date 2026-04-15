# WebSocket Infrastructure Integration Guide

This guide shows how to integrate the new WebSocket infrastructure into the backend app.

## Installation

The package is already in the monorepo. Add it to your dependencies:

```bash
# From the backend app directory
cd /home/user/fuse/apps/backend
```

Add to `package.json`:

```json
{
  "dependencies": {
    "@the-new-fuse/websocket-infrastructure": "workspace:*"
  }
}
```

Then run:

```bash
pnpm install
```

## Integration Steps

### 1. Update App Module

Replace or update `src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WebSocketInfrastructureModule } from '@the-new-fuse/websocket-infrastructure';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Add WebSocket Infrastructure
    WebSocketInfrastructureModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        cors: {
          origin: configService.get('CORS_ORIGINS')?.split(',') || ['http://localhost:3000'],
          credentials: true,
        },
        redis: {
          host: configService.get('REDIS_HOST') || 'localhost',
          port: parseInt(configService.get('REDIS_PORT') || '6379'),
          password: configService.get('REDIS_PASSWORD'),
          db: parseInt(configService.get('REDIS_DB') || '0'),
        },
        heartbeat: {
          interval: parseInt(configService.get('HEARTBEAT_INTERVAL') || '30000'),
          timeout: parseInt(configService.get('HEARTBEAT_TIMEOUT') || '60000'),
        },
        compression: {
          enabled: configService.get('COMPRESSION_ENABLED') === 'true',
          threshold: parseInt(configService.get('COMPRESSION_THRESHOLD') || '1024'),
        },
        messageQueue: {
          enabled: configService.get('QUEUE_ENABLED') === 'true',
          maxSize: parseInt(configService.get('QUEUE_MAX_SIZE') || '10000'),
          ttl: parseInt(configService.get('QUEUE_TTL') || '3600000'),
        },
        connectionPool: {
          maxConnections: parseInt(configService.get('WS_MAX_CONNECTIONS') || '10000'),
          idleTimeout: parseInt(configService.get('WS_IDLE_TIMEOUT') || '300000'),
        },
        monitoring: {
          enabled: configService.get('METRICS_ENABLED') === 'true',
          metricsPort: parseInt(configService.get('METRICS_PORT') || '9090'),
        },
      }),
      inject: [ConfigService],
    }),

    // Your other modules
  ],
})
export class AppModule {}
```

### 2. Create Enhanced Agent Communication Gateway

Create or update `src/gateways/enhanced-agent-communication.gateway.ts`:

```typescript
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Injectable, Logger, UseGuards } from '@nestjs/common';
import { AuthenticatedSocket } from '@the-new-fuse/websocket-infrastructure';
import { WsAuthGuard } from '../auth/ws-auth.guard';
import { RedisService } from '../services/redis.service';

@WebSocketGateway()
@Injectable()
export class EnhancedAgentCommunicationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(EnhancedAgentCommunicationGateway.name);

  constructor(private readonly redisService: RedisService) {}

  afterInit() {
    this.logger.log('Enhanced Agent Communication Gateway initialized');
  }

  @UseGuards(WsAuthGuard)
  handleConnection(client: AuthenticatedSocket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('agent:communicate')
  @UseGuards(WsAuthGuard)
  async handleAgentCommunication(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: {
      fromAgentId: string;
      toAgentId: string;
      message: any;
    }
  ) {
    this.logger.debug(
      `Agent communication: ${payload.fromAgentId} -> ${payload.toAgentId}`
    );

    // Publish to Redis for cross-server communication
    await this.redisService.publish(`agent:${payload.toAgentId}`, {
      from: payload.fromAgentId,
      message: payload.message,
      timestamp: new Date(),
    });

    // Also emit directly if on same server
    client.to(`agent:${payload.toAgentId}`).emit('agent:message', {
      from: payload.fromAgentId,
      message: payload.message,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('agent:join')
  @UseGuards(WsAuthGuard)
  handleAgentJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() agentId: string
  ) {
    client.join(`agent:${agentId}`);
    this.logger.log(`Client ${client.id} joined agent room: ${agentId}`);
  }

  @SubscribeMessage('agent:leave')
  @UseGuards(WsAuthGuard)
  handleAgentLeave(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() agentId: string
  ) {
    client.leave(`agent:${agentId}`);
    this.logger.log(`Client ${client.id} left agent room: ${agentId}`);
  }
}
```

### 3. Update RedisService

Update `src/services/redis.service.ts` to use the Redis adapter:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { RedisWebSocketAdapter } from '@the-new-fuse/websocket-infrastructure';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private adapter: RedisWebSocketAdapter;

  constructor(private configService: ConfigService) {
    this.adapter = new RedisWebSocketAdapter({
      host: configService.get('REDIS_HOST') || 'localhost',
      port: parseInt(configService.get('REDIS_PORT') || '6379'),
      password: configService.get('REDIS_PASSWORD'),
    });
  }

  async onModuleInit() {
    await this.adapter.initialize();
    this.logger.log('Redis service initialized');
  }

  async publish(channel: string, message: any) {
    await this.adapter.publish(channel, message);
  }

  async subscribe(channel: string, handler: (message: any) => void) {
    await this.adapter.subscribe(channel, handler);
  }

  // Legacy methods for compatibility
  async sendToComposer(message: any) {
    await this.publish('agent:composer', message);
  }

  async sendToRooCoder(message: any) {
    await this.publish('agent:roo-coder', message);
  }
}
```

### 4. Update Environment Variables

Add to `.env`:

```bash
# WebSocket Configuration
WS_MAX_CONNECTIONS=10000
WS_IDLE_TIMEOUT=300000

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

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

# Monitoring
METRICS_ENABLED=true
METRICS_PORT=9090
```

### 5. Add Health Check Endpoint

Create or update `src/health/health.controller.ts`:

```typescript
import { Controller, Get } from '@nestjs/common';
import { WebSocketGateway } from '@the-new-fuse/websocket-infrastructure';

@Controller('health')
export class HealthController {
  constructor(private readonly wsGateway: WebSocketGateway) {}

  @Get()
  async getHealth() {
    const health = await this.wsGateway.getHealth();
    const metrics = await this.wsGateway.getMetrics();
    const stats = this.wsGateway.getConnectionStats();

    return {
      status: health.healthy ? 'ok' : 'error',
      timestamp: new Date(),
      websocket: {
        health,
        metrics,
        connections: stats,
      },
    };
  }

  @Get('metrics')
  async getMetrics() {
    return this.wsGateway.getMetrics();
  }
}
```

### 6. Migration from Old WebSocket Implementation

If you have existing WebSocket code, here's how to migrate:

#### Old Code (socket.io directly):
```typescript
// Old
io.emit('message', data);
```

#### New Code (using infrastructure):
```typescript
// New
import { WebSocketGateway } from '@the-new-fuse/websocket-infrastructure';

constructor(private readonly wsGateway: WebSocketGateway) {}

// Broadcast to all
this.wsGateway.broadcast('message', data);

// Send to specific user
this.wsGateway.sendToUser(userId, 'message', data);

// Send to room
this.wsGateway.sendToRoom(roomName, 'message', data);

// Queue message for later delivery
this.wsGateway.queueMessage('message', data, priority);
```

## Testing

### 1. Unit Tests

```typescript
// agent-communication.gateway.spec.ts
import { Test } from '@nestjs/testing';
import { EnhancedAgentCommunicationGateway } from './enhanced-agent-communication.gateway';
import { RedisService } from '../services/redis.service';

describe('EnhancedAgentCommunicationGateway', () => {
  let gateway: EnhancedAgentCommunicationGateway;
  let redisService: RedisService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        EnhancedAgentCommunicationGateway,
        {
          provide: RedisService,
          useValue: {
            publish: jest.fn(),
          },
        },
      ],
    }).compile();

    gateway = module.get(EnhancedAgentCommunicationGateway);
    redisService = module.get(RedisService);
  });

  it('should publish agent messages to Redis', async () => {
    const mockClient = {
      id: 'test-client',
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };

    await gateway.handleAgentCommunication(mockClient as any, {
      fromAgentId: 'agent-1',
      toAgentId: 'agent-2',
      message: { text: 'test' },
    });

    expect(redisService.publish).toHaveBeenCalledWith(
      'agent:agent-2',
      expect.objectContaining({
        from: 'agent-1',
        message: { text: 'test' },
      })
    );
  });
});
```

### 2. Integration Tests

```typescript
// websocket.e2e.spec.ts
import { Test } from '@nestjs/testing';
import { WebSocketTestClient } from '@the-new-fuse/websocket-infrastructure/testing';
import { AppModule } from '../src/app.module';

describe('WebSocket E2E', () => {
  let app;
  let client: WebSocketTestClient;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.listen(3001);

    client = new WebSocketTestClient({
      url: 'http://localhost:3001',
      reconnection: { enabled: true },
    });

    await client.connect();
  });

  afterAll(async () => {
    client.disconnect();
    await app.close();
  });

  it('should handle agent communication', (done) => {
    client.on('agent:message', (data) => {
      expect(data.from).toBe('agent-1');
      expect(data.message.text).toBe('Hello');
      done();
    });

    client.send('agent:communicate', {
      fromAgentId: 'agent-1',
      toAgentId: 'agent-2',
      message: { text: 'Hello' },
    });
  });
});
```

## Monitoring

### Prometheus Metrics Endpoint

Metrics are available at: `http://localhost:9090/metrics`

### Grafana Dashboard

Import the included Grafana dashboard:

```bash
# Dashboard is in the infrastructure package
cat /home/user/fuse/packages/websocket-infrastructure/grafana-dashboard.json
```

### Health Check

```bash
curl http://localhost:3000/health
```

## Production Deployment

### 1. Update Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: .
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - WS_MAX_CONNECTIONS=10000
      - METRICS_ENABLED=true
    ports:
      - "3000:3000"
      - "9090:9090"
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

volumes:
  redis-data:
```

### 2. Update Dockerfile

Ensure your Dockerfile builds the WebSocket infrastructure:

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy monorepo files
COPY package.json pnpm-lock.yaml ./
COPY packages/websocket-infrastructure ./packages/websocket-infrastructure

# Install dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Build
RUN pnpm build

# Production stage
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

CMD ["node", "dist/main.js"]
```

## Troubleshooting

### Issue: Connection Drops Frequently

**Solution**: Increase heartbeat timeout
```bash
HEARTBEAT_TIMEOUT=120000  # 2 minutes
```

### Issue: High Memory Usage

**Solution**: Reduce max connections and enable compression
```bash
WS_MAX_CONNECTIONS=5000
COMPRESSION_ENABLED=true
COMPRESSION_THRESHOLD=512
```

### Issue: Redis Connection Errors

**Solution**: Check Redis connection settings
```bash
# Test Redis connection
redis-cli -h localhost -p 6379 ping
```

### Issue: Metrics Not Showing

**Solution**: Ensure metrics are enabled
```bash
METRICS_ENABLED=true
METRICS_PORT=9090
```

## Next Steps

1. **Install Dependencies**: `pnpm install`
2. **Build Package**: `cd packages/websocket-infrastructure && pnpm build`
3. **Update Backend**: Follow integration steps above
4. **Test Locally**: Start backend and test WebSocket connection
5. **Run Load Tests**: Use the load tester to verify performance
6. **Deploy to Staging**: Test in staging environment
7. **Monitor**: Set up Grafana dashboards
8. **Deploy to Production**: Follow production deployment guide

## Support

- **Documentation**: `/home/user/fuse/docs/websocket/`
- **Package**: `/home/user/fuse/packages/websocket-infrastructure/`
- **Examples**: `/home/user/fuse/docs/websocket/USAGE_EXAMPLES.md`
