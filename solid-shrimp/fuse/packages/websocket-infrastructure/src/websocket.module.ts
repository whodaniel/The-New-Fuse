import { Module, DynamicModule, Provider } from '@nestjs/common';
import { WebSocketGateway } from './websocket.gateway';
import { WebSocketConfig } from './types';
import { ConnectionPool } from './connection/connection-pool';
import { ConnectionManager } from './connection/connection-manager';
import { RedisWebSocketAdapter } from './adapters/redis-adapter';
import { MessageQueue } from './queue/message-queue';
import { WebSocketMonitoring } from './monitoring/websocket-metrics';

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
        useFactory: () => new RedisWebSocketAdapter(config.redis!),
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
        WebSocketGateway,
      ],
      exports: [WebSocketGateway],
    };
  }
}
