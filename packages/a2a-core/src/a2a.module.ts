import { Module, DynamicModule, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule, UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { A2AService } from './a2a.service';
import { A2ARedisAdapter } from './redis-adapter';
import { A2AWebSocketAdapter } from './websocket-adapter';
import { A2AConfig } from './types';
import { Ap2ProtocolModule, Ap2ProtocolService } from '@the-new-fuse/ap2-protocol';

@Global()
@Module({})
export class A2ACoreModule {
  static forRoot(config?: Partial<A2AConfig>): DynamicModule {
    return {
      module: A2ACoreModule,
      imports: [
        ConfigModule,
        RedisModule.forRoot({ isGlobal: true }),
        Ap2ProtocolModule
      ],
      providers: [
        {
          provide: 'A2A_CONFIG',
          useFactory: (configService: ConfigService): A2AConfig => {
            const defaultConfig: A2AConfig = {
              redis: {
                url: configService.get<string>('REDIS_URL') || 'redis://localhost:6379',
                keyPrefix: 'a2a:',
                ttl: 3600
              },
              websocket: {
                port: configService.get<number>('A2A_WEBSOCKET_PORT') || 3001,
                cors: {
                  origin: configService.get<string>('FRONTEND_URL') || 'http://localhost:3000',
                  credentials: true
                }
              },
              security: {
                enableSignatures: configService.get<boolean>('A2A_ENABLE_SIGNATURES') || false,
                secretKey: configService.get<string>('A2A_SECRET_KEY'),
                enableEncryption: configService.get<boolean>('A2A_ENABLE_ENCRYPTION') || false
              },
              monitoring: {
                enableMetrics: configService.get<boolean>('A2A_ENABLE_METRICS') || true,
                heartbeatInterval: configService.get<number>('A2A_HEARTBEAT_INTERVAL') || 30000,
                connectionTimeout: configService.get<number>('A2A_CONNECTION_TIMEOUT') || 60000
              }
            };

            return { ...defaultConfig, ...config };
          },
          inject: [ConfigService]
        },
        {
          provide: A2ARedisAdapter,
          useFactory: (config: A2AConfig, unifiedRedis: UnifiedRedisService) => 
            new A2ARedisAdapter(config, unifiedRedis),
          inject: ['A2A_CONFIG', UnifiedRedisService]
        },
        {
          provide: A2AWebSocketAdapter,
          useFactory: (config: A2AConfig, redisAdapter: A2ARedisAdapter) => 
            new A2AWebSocketAdapter(config, redisAdapter),
          inject: ['A2A_CONFIG', A2ARedisAdapter]
        },
        {
          provide: A2AService,
          useFactory: (
            configService: ConfigService,
            ap2ProtocolService: Ap2ProtocolService
          ) => new A2AService(configService, ap2ProtocolService),
          inject: [ConfigService, Ap2ProtocolService]
        }
      ],
      exports: [A2AService, A2ARedisAdapter, A2AWebSocketAdapter, 'A2A_CONFIG'],
      global: true
    };
  }

  static forRootAsync(options: {
    imports?: any[];
    useFactory: (...args: any[]) => Promise<A2AConfig> | A2AConfig;
    inject?: any[];
  }): DynamicModule {
    return {
      module: A2ACoreModule,
      imports: [
        ConfigModule, 
        RedisModule.forRoot({ isGlobal: true }),
        ...(options.imports || [])
      ],
      providers: [
        {
          provide: 'A2A_CONFIG',
          useFactory: options.useFactory,
          inject: options.inject || []
        },
        {
          provide: A2ARedisAdapter,
          useFactory: (config: A2AConfig, unifiedRedis: UnifiedRedisService) => 
            new A2ARedisAdapter(config, unifiedRedis),
          inject: ['A2A_CONFIG', UnifiedRedisService]
        },
        {
          provide: A2AWebSocketAdapter,
          useFactory: (config: A2AConfig, redisAdapter: A2ARedisAdapter) => 
            new A2AWebSocketAdapter(config, redisAdapter),
          inject: ['A2A_CONFIG', A2ARedisAdapter]
        },
        {
          provide: A2AService,
          useFactory: (
            configService: ConfigService,
            ap2ProtocolService: Ap2ProtocolService
          ) => new A2AService(configService, ap2ProtocolService),
          inject: [ConfigService, Ap2ProtocolService]
        }
      ],
      exports: [A2AService, A2ARedisAdapter, A2AWebSocketAdapter, 'A2A_CONFIG'],
      global: true
    };
  }
}
