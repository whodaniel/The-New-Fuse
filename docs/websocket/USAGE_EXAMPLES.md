# WebSocket Infrastructure - Usage Examples

## Table of Contents

- [Basic Usage](#basic-usage)
- [Advanced Features](#advanced-features)
- [Integration Examples](#integration-examples)
- [Production Setup](#production-setup)
- [Testing](#testing)

## Basic Usage

### Simple Server Setup

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { WebSocketInfrastructureModule } from '@the-new-fuse/websocket-infrastructure';

@Module({
  imports: [
    WebSocketInfrastructureModule.forRoot({
      cors: {
        origin: process.env.CORS_ORIGINS?.split(',') || [
          'http://localhost:3000',
        ],
        credentials: true,
      },
    }),
  ],
})
export class AppModule {}
```

### Simple Client Connection

```typescript
import { WebSocketTestClient } from '@the-new-fuse/websocket-infrastructure/testing';

const client = new WebSocketTestClient({
  url: 'http://localhost:3000',
});

await client.connect();
console.log('Connected!');

client.on('notification', (data) => {
  console.log('Notification:', data);
});
```

## Advanced Features

### Full Configuration

```typescript
WebSocketInfrastructureModule.forRoot({
  // CORS Configuration
  cors: {
    origin: ['https://app.example.com', 'https://admin.example.com'],
    credentials: true,
  },

  // Redis for Horizontal Scaling
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: 0,
    keyPrefix: 'ws:',
  },

  // Heartbeat Configuration
  heartbeat: {
    interval: 30000, // 30 seconds
    timeout: 60000, // 60 seconds
  },

  // Compression
  compression: {
    enabled: true,
    threshold: 1024, // Compress messages > 1KB
  },

  // Message Queue
  messageQueue: {
    enabled: true,
    maxSize: 10000,
    ttl: 3600000, // 1 hour
  },

  // Connection Pool
  connectionPool: {
    maxConnections: 10000,
    idleTimeout: 300000, // 5 minutes
  },

  // Monitoring
  monitoring: {
    enabled: true,
    metricsPort: 9090,
  },
});
```

### Async Configuration

```typescript
WebSocketInfrastructureModule.forRootAsync({
  useFactory: async (configService: ConfigService) => ({
    cors: {
      origin: configService.get('WS_CORS_ORIGINS')?.split(','),
      credentials: true,
    },
    redis: {
      host: configService.get('REDIS_HOST'),
      port: configService.get('REDIS_PORT'),
      password: configService.get('REDIS_PASSWORD'),
    },
  }),
  inject: [ConfigService],
});
```

### Custom Authentication

```typescript
// ws-auth.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthenticatedSocket } from '@the-new-fuse/websocket-infrastructure';

@Injectable()
export class WsAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const client: AuthenticatedSocket = context.switchToWs().getClient();
    const token = client.handshake.auth.token;

    if (!token) {
      client.disconnect(true);
      return false;
    }

    try {
      const decoded = this.verifyToken(token);
      client.userId = decoded.userId;
      return true;
    } catch (error) {
      client.disconnect(true);
      return false;
    }
  }

  private verifyToken(token: string): any {
    // Implement your token verification logic
    return { userId: 'user-123' };
  }
}
```

### Custom Gateway with Authentication

```typescript
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  UseGuards,
} from '@nestjs/websockets';
import { AuthenticatedSocket } from '@the-new-fuse/websocket-infrastructure';
import { WsAuthGuard } from './ws-auth.guard';

@WebSocketGateway()
@UseGuards(WsAuthGuard)
export class ChatGateway {
  @SubscribeMessage('chat:message')
  handleChatMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() message: { text: string; roomId: string }
  ) {
    // Broadcast to room
    client.to(message.roomId).emit('chat:message', {
      userId: client.userId,
      text: message.text,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('chat:join')
  handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() roomId: string
  ) {
    client.join(roomId);
    client.to(roomId).emit('chat:user-joined', {
      userId: client.userId,
      timestamp: new Date(),
    });
  }
}
```

## Integration Examples

### Chat Application

```typescript
// chat.service.ts
import { Injectable } from '@nestjs/common';
import { WebSocketGateway } from '@the-new-fuse/websocket-infrastructure';

@Injectable()
export class ChatService {
  constructor(private readonly wsGateway: WebSocketGateway) {}

  async sendMessage(roomId: string, userId: string, text: string) {
    const message = {
      id: this.generateId(),
      roomId,
      userId,
      text,
      timestamp: new Date(),
    };

    // Save to database
    await this.saveMessage(message);

    // Broadcast to room
    this.wsGateway.sendToRoom(roomId, 'chat:message', message);

    return message;
  }

  async sendNotification(userId: string, notification: any) {
    // Send to specific user
    this.wsGateway.sendToUser(userId, 'notification', notification);
  }

  async broadcastAnnouncement(announcement: any) {
    // Broadcast to all connected clients
    this.wsGateway.broadcast('announcement', announcement);
  }

  private generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async saveMessage(message: any) {
    // Implement database save
  }
}
```

### Real-Time Dashboard

```typescript
// dashboard.service.ts
import { Injectable } from '@nestjs/common';
import { WebSocketGateway } from '@the-new-fuse/websocket-infrastructure';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class DashboardService {
  constructor(private readonly wsGateway: WebSocketGateway) {}

  @Cron('*/5 * * * * *') // Every 5 seconds
  async broadcastMetrics() {
    const metrics = await this.collectMetrics();

    // Broadcast to dashboard room
    this.wsGateway.sendToRoom('dashboard', 'metrics:update', metrics);
  }

  async subscribeToMetrics(userId: string) {
    // User joins dashboard room
    const connections =
      this.wsGateway['connectionPool'].getUserConnections(userId);
    connections.forEach((socket) => {
      socket.join('dashboard');
    });

    // Send initial data
    const metrics = await this.collectMetrics();
    this.wsGateway.sendToUser(userId, 'metrics:initial', metrics);
  }

  private async collectMetrics() {
    return {
      connections: this.wsGateway.getConnectionStats(),
      health: await this.wsGateway.getHealth(),
      metrics: await this.wsGateway.getMetrics(),
      timestamp: new Date(),
    };
  }
}
```

### Game Server

```typescript
// game.gateway.ts
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { AuthenticatedSocket } from '@the-new-fuse/websocket-infrastructure';

@WebSocketGateway()
export class GameGateway {
  private games: Map<string, GameState> = new Map();

  @SubscribeMessage('game:create')
  async handleCreateGame(@ConnectedSocket() client: AuthenticatedSocket) {
    const gameId = this.generateGameId();
    const game: GameState = {
      id: gameId,
      players: [client.userId!],
      state: 'waiting',
      createdAt: new Date(),
    };

    this.games.set(gameId, game);
    client.join(`game:${gameId}`);

    return { gameId, game };
  }

  @SubscribeMessage('game:join')
  async handleJoinGame(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() gameId: string
  ) {
    const game = this.games.get(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    game.players.push(client.userId!);
    client.join(`game:${gameId}`);

    // Notify other players
    client.to(`game:${gameId}`).emit('game:player-joined', {
      userId: client.userId,
      playersCount: game.players.length,
    });

    // Start game if enough players
    if (game.players.length >= 2) {
      game.state = 'playing';
      client.nsp.to(`game:${gameId}`).emit('game:started', game);
    }

    return { game };
  }

  @SubscribeMessage('game:move')
  async handleMove(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { gameId: string; move: any }
  ) {
    const game = this.games.get(data.gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    // Validate and apply move
    this.applyMove(game, client.userId!, data.move);

    // Broadcast to all players
    client.nsp.to(`game:${data.gameId}`).emit('game:move', {
      userId: client.userId,
      move: data.move,
      gameState: game,
    });
  }

  private generateGameId(): string {
    return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private applyMove(game: GameState, userId: string, move: any) {
    // Implement game logic
  }
}

interface GameState {
  id: string;
  players: string[];
  state: 'waiting' | 'playing' | 'finished';
  createdAt: Date;
}
```

## Production Setup

### Environment Variables

```bash
# .env.production
NODE_ENV=production

# WebSocket Server
WS_PORT=3000
WS_MAX_CONNECTIONS=10000

# Redis
REDIS_HOST=redis-cluster.example.com
REDIS_PORT=6379
REDIS_PASSWORD=your-secure-password
REDIS_DB=0

# CORS
WS_CORS_ORIGINS=https://app.example.com,https://admin.example.com

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

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  websocket-1:
    build: .
    environment:
      - NODE_ENV=production
      - WS_PORT=3000
      - REDIS_HOST=redis
    ports:
      - '3001:3000'
      - '9091:9090'
    depends_on:
      - redis

  websocket-2:
    build: .
    environment:
      - NODE_ENV=production
      - WS_PORT=3000
      - REDIS_HOST=redis
    ports:
      - '3002:3000'
      - '9092:9090'
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis-data:/data

  nginx:
    image: nginx:alpine
    ports:
      - '80:80'
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - websocket-1
      - websocket-2

volumes:
  redis-data:
```

### Kubernetes Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: websocket-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: websocket-server
  template:
    metadata:
      labels:
        app: websocket-server
    spec:
      containers:
        - name: websocket
          image: your-registry/websocket:latest
          env:
            - name: REDIS_HOST
              value: redis-service
            - name: WS_MAX_CONNECTIONS
              value: '10000'
          ports:
            - containerPort: 3000
            - containerPort: 9090
          resources:
            requests:
              memory: '256Mi'
              cpu: '250m'
            limits:
              memory: '512Mi'
              cpu: '500m'
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: websocket-service
spec:
  type: LoadBalancer
  sessionAffinity: ClientIP # Sticky sessions
  selector:
    app: websocket-server
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
```

## Testing

### Unit Tests

```typescript
// websocket.gateway.spec.ts
import { Test } from '@nestjs/testing';
import { WebSocketGateway } from '@the-new-fuse/websocket-infrastructure';

describe('WebSocketGateway', () => {
  let gateway: WebSocketGateway;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [WebSocketGateway],
    }).compile();

    gateway = module.get<WebSocketGateway>(WebSocketGateway);
  });

  it('should broadcast message to all clients', () => {
    const spy = jest.spyOn(gateway['server'], 'emit');

    gateway.broadcast('test', { message: 'hello' });

    expect(spy).toHaveBeenCalledWith(
      'test',
      expect.objectContaining({
        channel: 'test',
        data: { message: 'hello' },
      })
    );
  });
});
```

### Integration Tests

```typescript
// chat.e2e.spec.ts
import { WebSocketTestClient } from '@the-new-fuse/websocket-infrastructure/testing';

describe('Chat E2E', () => {
  let client1: WebSocketTestClient;
  let client2: WebSocketTestClient;

  beforeAll(async () => {
    client1 = new WebSocketTestClient({ url: 'http://localhost:3000' });
    client2 = new WebSocketTestClient({ url: 'http://localhost:3000' });

    await Promise.all([client1.connect(), client2.connect()]);
  });

  afterAll(() => {
    client1.disconnect();
    client2.disconnect();
  });

  it('should broadcast messages to room', (done) => {
    const roomId = 'test-room';

    client2.on('chat:message', (data) => {
      expect(data.text).toBe('Hello, room!');
      done();
    });

    client1.joinRoom(roomId);
    client2.joinRoom(roomId);

    setTimeout(() => {
      client1.send('chat:message', { roomId, text: 'Hello, room!' });
    }, 100);
  });
});
```

### Load Test

```typescript
// load-test.ts
import { WebSocketLoadTester } from '@the-new-fuse/websocket-infrastructure/testing';

async function runLoadTest() {
  const tester = new WebSocketLoadTester({
    url: 'http://localhost:3000',
    numClients: 1000,
    messageInterval: 100,
    duration: 60000,
    messageSize: 500,
    auth: {
      token: 'test-token',
    },
  });

  const results = await tester.run();

  console.log('Load Test Results:');
  console.log(`Total Connections: ${results.totalConnections}`);
  console.log(`Successful: ${results.successfulConnections}`);
  console.log(`Failed: ${results.failedConnections}`);
  console.log(`Messages Sent: ${results.totalMessagesSent}`);
  console.log(`Average Latency: ${results.averageLatency.toFixed(2)}ms`);
  console.log(`Messages/Second: ${results.messagesPerSecond.toFixed(2)}`);
}

runLoadTest().catch(console.error);
```

## Client Examples

### React Hook

```typescript
// useWebSocket.ts
import { useEffect, useState } from 'react';
import { WebSocketTestClient } from '@the-new-fuse/websocket-infrastructure/testing';

export function useWebSocket(url: string) {
  const [client, setClient] = useState<WebSocketTestClient | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocketTestClient({
      url,
      reconnection: { enabled: true },
    });

    ws.connect()
      .then(() => {
        setConnected(true);
        setClient(ws);
      })
      .catch(console.error);

    return () => {
      ws.disconnect();
    };
  }, [url]);

  const send = (channel: string, data: any) => {
    if (client && connected) {
      client.send(channel, data);
    }
  };

  const subscribe = (channel: string, handler: (data: any) => void) => {
    if (client) {
      client.on(channel, handler);
    }
  };

  return { connected, send, subscribe };
}
```

### Vue Composable

```typescript
// useWebSocket.ts
import { ref, onMounted, onUnmounted } from 'vue';
import { WebSocketTestClient } from '@the-new-fuse/websocket-infrastructure/testing';

export function useWebSocket(url: string) {
  const client = ref<WebSocketTestClient | null>(null);
  const connected = ref(false);

  onMounted(async () => {
    client.value = new WebSocketTestClient({
      url,
      reconnection: { enabled: true },
    });

    try {
      await client.value.connect();
      connected.value = true;
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  });

  onUnmounted(() => {
    client.value?.disconnect();
  });

  const send = (channel: string, data: any) => {
    if (client.value && connected.value) {
      client.value.send(channel, data);
    }
  };

  const subscribe = (channel: string, handler: (data: any) => void) => {
    if (client.value) {
      client.value.on(channel, handler);
    }
  };

  return { connected, send, subscribe };
}
```
