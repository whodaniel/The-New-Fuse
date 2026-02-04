"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const redis_service_js_1 = require("../services/redis.service.js");
const consolidated_redis_service_js_1 = require("./consolidated-redis.service.js");
let RedisModule = class RedisModule {
};
exports.RedisModule = RedisModule;
exports.RedisModule = RedisModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot()
        ],
        providers: [
            {
                provide: redis_service_js_1.RedisService,
                useClass: consolidated_redis_service_js_1.ConsolidatedRedisService
            },
            consolidated_redis_service_js_1.ConsolidatedRedisService
        ],
        exports: [
            redis_service_js_1.RedisService,
            consolidated_redis_service_js_1.ConsolidatedRedisService
        ]
    })
], RedisModule);
//# sourceMappingURL=redis.module.js.map