"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var RedisModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const UnifiedRedisService_1 = require("./UnifiedRedisService");
const RedisConfig_1 = require("./RedisConfig");
let RedisModule = RedisModule_1 = class RedisModule {
    static forRoot(options = {}) {
        return {
            module: RedisModule_1,
            global: options.isGlobal ?? true,
            imports: [config_1.ConfigModule],
            providers: [
                {
                    provide: 'REDIS_CONFIG_OPTIONS',
                    useValue: options.config ?? {},
                },
                RedisConfig_1.RedisConfig,
                UnifiedRedisService_1.UnifiedRedisService,
            ],
            exports: [UnifiedRedisService_1.UnifiedRedisService, RedisConfig_1.RedisConfig],
        };
    }
    static forRootAsync(options) {
        return {
            module: RedisModule_1,
            global: options.isGlobal ?? true,
            imports: [config_1.ConfigModule],
            providers: [
                {
                    provide: 'REDIS_CONFIG_OPTIONS',
                    useFactory: options.useFactory || (() => ({})),
                    inject: options.inject || [],
                },
                RedisConfig_1.RedisConfig,
                UnifiedRedisService_1.UnifiedRedisService,
            ],
            exports: [UnifiedRedisService_1.UnifiedRedisService, RedisConfig_1.RedisConfig],
        };
    }
};
exports.RedisModule = RedisModule;
exports.RedisModule = RedisModule = RedisModule_1 = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule],
    })
], RedisModule);
//# sourceMappingURL=RedisModule.js.map