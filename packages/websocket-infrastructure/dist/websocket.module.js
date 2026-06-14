"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var WebSocketInfrastructureModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketInfrastructureModule = void 0;
const common_1 = require("@nestjs/common");
const websocket_gateway_1 = require("./websocket.gateway");
const redis_adapter_js_1 = require("./adapters/redis-adapter.js");
const infrastructure_1 = require("@the-new-fuse/infrastructure");
let WebSocketInfrastructureModule = WebSocketInfrastructureModule_1 = class WebSocketInfrastructureModule {
    static forRoot(config) {
        const providers = [
            {
                provide: 'WEBSOCKET_CONFIG',
                useValue: config || {},
            },
            websocket_gateway_1.WebSocketGateway,
        ];
        if (config?.redis) {
            providers.push({
                provide: redis_adapter_js_1.RedisWebSocketAdapter,
                useFactory: (redisService) => new redis_adapter_js_1.RedisWebSocketAdapter(config.redis, redisService),
                inject: [infrastructure_1.UnifiedRedisService],
            });
        }
        return {
            module: WebSocketInfrastructureModule_1,
            providers,
            exports: [websocket_gateway_1.WebSocketGateway],
        };
    }
    static forRootAsync(options) {
        return {
            module: WebSocketInfrastructureModule_1,
            providers: [
                {
                    provide: 'WEBSOCKET_CONFIG',
                    useFactory: options.useFactory,
                    inject: options.inject || [],
                },
                {
                    provide: redis_adapter_js_1.RedisWebSocketAdapter,
                    useFactory: (config, redisService) => {
                        if (config.redis) {
                            return new redis_adapter_js_1.RedisWebSocketAdapter(config.redis, redisService);
                        }
                        return undefined;
                    },
                    inject: ['WEBSOCKET_CONFIG', infrastructure_1.UnifiedRedisService],
                },
                websocket_gateway_1.WebSocketGateway,
            ],
            exports: [websocket_gateway_1.WebSocketGateway],
        };
    }
};
exports.WebSocketInfrastructureModule = WebSocketInfrastructureModule;
exports.WebSocketInfrastructureModule = WebSocketInfrastructureModule = WebSocketInfrastructureModule_1 = __decorate([
    (0, common_1.Module)({})
], WebSocketInfrastructureModule);
