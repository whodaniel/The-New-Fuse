"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var A2ACoreModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.A2ACoreModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ap2_protocol_1 = require("@the-new-fuse/ap2-protocol");
const infrastructure_1 = require("@the-new-fuse/infrastructure");
const a2a_service_js_1 = require("./a2a.service.js");
const redis_adapter_js_1 = require("./redis-adapter.js");
const websocket_adapter_js_1 = require("./websocket-adapter.js");
let A2ACoreModule = A2ACoreModule_1 = class A2ACoreModule {
    static forRoot(config) {
        return {
            module: A2ACoreModule_1,
            imports: [config_1.ConfigModule, infrastructure_1.RedisModule.forRoot({ isGlobal: true }), ap2_protocol_1.Ap2ProtocolModule],
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
                    inject: [config_1.ConfigService],
                },
                {
                    provide: redis_adapter_js_1.A2ARedisAdapter,
                    useFactory: (config, unifiedRedis) => new redis_adapter_js_1.A2ARedisAdapter(config, unifiedRedis),
                    inject: ['A2A_CONFIG', infrastructure_1.UnifiedRedisService],
                },
                {
                    provide: websocket_adapter_js_1.A2AWebSocketAdapter,
                    useFactory: (config, redisAdapter) => new websocket_adapter_js_1.A2AWebSocketAdapter(config, redisAdapter),
                    inject: ['A2A_CONFIG', redis_adapter_js_1.A2ARedisAdapter],
                },
                {
                    provide: a2a_service_js_1.A2AService,
                    useFactory: (configService, ap2ProtocolService, redisService) => new a2a_service_js_1.A2AService(configService, ap2ProtocolService, redisService),
                    inject: [config_1.ConfigService, ap2_protocol_1.Ap2ProtocolService, infrastructure_1.UnifiedRedisService],
                },
            ],
            exports: [a2a_service_js_1.A2AService, redis_adapter_js_1.A2ARedisAdapter, websocket_adapter_js_1.A2AWebSocketAdapter, 'A2A_CONFIG'],
            global: true,
        };
    }
    static forRootAsync(options) {
        return {
            module: A2ACoreModule_1,
            imports: [config_1.ConfigModule, infrastructure_1.RedisModule.forRoot({ isGlobal: true }), ...(options.imports || [])],
            providers: [
                {
                    provide: 'A2A_CONFIG',
                    useFactory: options.useFactory,
                    inject: options.inject || [],
                },
                {
                    provide: redis_adapter_js_1.A2ARedisAdapter,
                    useFactory: (config, unifiedRedis) => new redis_adapter_js_1.A2ARedisAdapter(config, unifiedRedis),
                    inject: ['A2A_CONFIG', infrastructure_1.UnifiedRedisService],
                },
                {
                    provide: websocket_adapter_js_1.A2AWebSocketAdapter,
                    useFactory: (config, redisAdapter) => new websocket_adapter_js_1.A2AWebSocketAdapter(config, redisAdapter),
                    inject: ['A2A_CONFIG', redis_adapter_js_1.A2ARedisAdapter],
                },
                {
                    provide: a2a_service_js_1.A2AService,
                    useFactory: (configService, ap2ProtocolService, redisService) => new a2a_service_js_1.A2AService(configService, ap2ProtocolService, redisService),
                    inject: [config_1.ConfigService, ap2_protocol_1.Ap2ProtocolService, infrastructure_1.UnifiedRedisService],
                },
            ],
            exports: [a2a_service_js_1.A2AService, redis_adapter_js_1.A2ARedisAdapter, websocket_adapter_js_1.A2AWebSocketAdapter, 'A2A_CONFIG'],
            global: true,
        };
    }
};
exports.A2ACoreModule = A2ACoreModule;
exports.A2ACoreModule = A2ACoreModule = A2ACoreModule_1 = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({})
], A2ACoreModule);
//# sourceMappingURL=a2a.module.js.map