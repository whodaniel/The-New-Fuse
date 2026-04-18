import { Module, DynamicModule, Provider, Global } from '@nestjs/common';
import { WebSocketGateway } from './websocket.gateway';
import { WebSocketConfig } from './types';
import { ConnectionPool } from './connection/connection-pool';
import { ConnectionManager } from './connection/connection-manager';
import { RedisWebSocketAdapter } from './adapters/redis-adapter';
import { MessageQueue } from './queue/message-queue';
import { WebSocketMonitoring } from './monitoring/websocket-metrics';
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
