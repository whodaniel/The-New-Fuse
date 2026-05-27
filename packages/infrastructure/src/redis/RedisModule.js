var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var RedisModule_1;
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisConfig } from './RedisConfig.js';
import { UnifiedRedisService } from './UnifiedRedisService.js';
let RedisModule = RedisModule_1 = class RedisModule {
    static forRoot(options = {}) {
        return {
            module: RedisModule_1,
            global: options.isGlobal ?? true,
            imports: [ConfigModule],
            providers: [
                {
                    provide: 'REDIS_CONFIG_OPTIONS',
                    useValue: options.config ?? {},
                },
                RedisConfig,
                UnifiedRedisService,
            ],
            exports: [UnifiedRedisService, RedisConfig],
        };
    }
    static forRootAsync(options) {
        return {
            module: RedisModule_1,
            global: options.isGlobal ?? true,
            imports: [ConfigModule],
            providers: [
                {
                    provide: 'REDIS_CONFIG_OPTIONS',
                    useFactory: options.useFactory || (() => ({})),
                    inject: options.inject || [],
                },
                RedisConfig,
                UnifiedRedisService,
            ],
            exports: [UnifiedRedisService, RedisConfig],
        };
    }
};
RedisModule = RedisModule_1 = __decorate([
    Module({
        imports: [ConfigModule],
    })
], RedisModule);
export { RedisModule };
//# sourceMappingURL=RedisModule.js.map