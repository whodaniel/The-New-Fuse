import { Module, DynamicModule, Provider, Global } from '@nestjs/common';
import { WebSocketGateway } from './websocket.gateway.js';
import { WebSocketConfig } from './types/index.js';
import { ConnectionPool } from './connection/connection-pool.js';
import { ConnectionManager } from './connection/connection-manager.js';
import { RedisWebSocketAdapter } from './adapters/redis-adapter.js';
import { MessageQueue } from './queue/message-queue.js';
import { WebSocketMonitoring } from './monitoring/websocket-metrics.js';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';

@Module({})
export class WebSocketInfrastructureModule {
  static forRoot(config?: WebSocketConfig): DynamicModule {
    const providers: Provider[] = [
      {
        provide: 'WEBSOCKET_CONFIG',
        useValue: config || {},
      },
      WebSocketGateway,
    ];

    // Add Redis adapter if configured
    if (config?.redis) {
      providers.push({
        provide: RedisWebSocketAdapter,
        useFactory: (redisService: UnifiedRedisService) =>
          new RedisWebSocketAdapter(config.redis!, redisService),
        inject: [UnifiedRedisService],
      });
    }

    return {
      module: WebSocketInfrastructureModule,
      providers,
      exports: [WebSocketGateway],
    };
  }

  static forRootAsync(options: {
    useFactory: (...args: any[]) => Promise<WebSocketConfig> | WebSocketConfig;
    inject?: any[];
  }): DynamicModule {
    return {
      module: WebSocketInfrastructureModule,
      providers: [
        {
          provide: 'WEBSOCKET_CONFIG',
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        {
          provide: RedisWebSocketAdapter,
          useFactory: (config: WebSocketConfig, redisService: UnifiedRedisService) => {
            if (config.redis) {
              return new RedisWebSocketAdapter(config.redis, redisService);
            }
            return undefined;
          },
          inject: ['WEBSOCKET_CONFIG', UnifiedRedisService],
        },
        WebSocketGateway,
      ],
      exports: [WebSocketGateway],
    };
  }
}
