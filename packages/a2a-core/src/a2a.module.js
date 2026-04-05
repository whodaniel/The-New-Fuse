var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var A2ACoreModule_1;
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Ap2ProtocolModule, Ap2ProtocolService } from // @ts-ignore
 '@the-new-fuse/ap2-protocol';
import { RedisModule, UnifiedRedisService } from // @ts-ignore
 '@the-new-fuse/infrastructure';
import { A2AService } from './a2a.service';
import { A2ARedisAdapter } from './redis-adapter';
import { A2AWebSocketAdapter } from './websocket-adapter';
let A2ACoreModule = A2ACoreModule_1 = class A2ACoreModule {
    static forRoot(config) {
        return {
            module: A2ACoreModule_1,
            imports: [ConfigModule, RedisModule.forRoot({ isGlobal: true }), Ap2ProtocolModule],
            providers: [
                {
                    provide: 'A2A_CONFIG',
                    useFactory: (configService) => {
                        const defaultConfig = {
                            redis: {
                                url: configService.get('REDIS_URL') || 'redis://localhost:6379',
                                keyPrefix: 'a2a:',
                                ttl: 3600,
                            },
                            websocket: {
                                port: configService.get('A2A_WEBSOCKET_PORT') || 3001,
                                cors: {
                                    origin: configService.get('FRONTEND_URL') || 'http://localhost:3000',
                                    credentials: true,
                                },
                            },
                            security: {
                                enableSignatures: configService.get('A2A_ENABLE_SIGNATURES') || false,
                                secretKey: configService.get('A2A_SECRET_KEY'),
                                enableEncryption: configService.get('A2A_ENABLE_ENCRYPTION') || false,
                            },
                            monitoring: {
                                enableMetrics: configService.get('A2A_ENABLE_METRICS') || true,
                                heartbeatInterval: configService.get('A2A_HEARTBEAT_INTERVAL') || 30000,
                                connectionTimeout: configService.get('A2A_CONNECTION_TIMEOUT') || 60000,
                            },
                        };
                        return { ...defaultConfig, ...config };
                    },
                    inject: [ConfigService],
                },
                {
                    provide: A2ARedisAdapter,
                    useFactory: (config, unifiedRedis) => new A2ARedisAdapter(config, unifiedRedis),
                    inject: ['A2A_CONFIG', UnifiedRedisService],
                },
                {
                    provide: A2AWebSocketAdapter,
                    useFactory: (config, redisAdapter) => new A2AWebSocketAdapter(config, redisAdapter),
                    inject: ['A2A_CONFIG', A2ARedisAdapter],
                },
                {
                    provide: A2AService,
                    useFactory: (configService, ap2ProtocolService, redisService) => new A2AService(configService, ap2ProtocolService, redisService),
                    inject: [ConfigService, Ap2ProtocolService, UnifiedRedisService],
                },
            ],
            exports: [A2AService, A2ARedisAdapter, A2AWebSocketAdapter, 'A2A_CONFIG'],
            global: true,
        };
    }
    static forRootAsync(options) {
        return {
            module: A2ACoreModule_1,
            imports: [ConfigModule, RedisModule.forRoot({ isGlobal: true }), ...(options.imports || [])],
            providers: [
                {
                    provide: 'A2A_CONFIG',
                    useFactory: options.useFactory,
                    inject: options.inject || [],
                },
                {
                    provide: A2ARedisAdapter,
                    useFactory: (config, unifiedRedis) => new A2ARedisAdapter(config, unifiedRedis),
                    inject: ['A2A_CONFIG', UnifiedRedisService],
                },
                {
                    provide: A2AWebSocketAdapter,
                    useFactory: (config, redisAdapter) => new A2AWebSocketAdapter(config, redisAdapter),
                    inject: ['A2A_CONFIG', A2ARedisAdapter],
                },
                {
                    provide: A2AService,
                    useFactory: (configService, ap2ProtocolService, redisService) => new A2AService(configService, ap2ProtocolService, redisService),
                    inject: [ConfigService, Ap2ProtocolService, UnifiedRedisService],
                },
            ],
            exports: [A2AService, A2ARedisAdapter, A2AWebSocketAdapter, 'A2A_CONFIG'],
            global: true,
        };
    }
};
A2ACoreModule = A2ACoreModule_1 = __decorate([
    Global(),
    Module({})
], A2ACoreModule);
export { A2ACoreModule };
