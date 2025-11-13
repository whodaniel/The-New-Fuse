var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
let RedisConfig = class RedisConfig {
    configService;
    constructor(configService) {
        this.configService = configService;
    }
    getConfiguration() {
        return {
            host: this.configService.get('REDIS_HOST', 'localhost'),
            port: this.configService.get('REDIS_PORT', 6379),
            password: this.configService.get('REDIS_PASSWORD'),
            db: this.configService.get('REDIS_DB', 0),
            poolSize: this.configService.get('REDIS_POOL_SIZE', 10),
            retryAttempts: this.configService.get('REDIS_RETRY_ATTEMPTS', 3),
            retryDelay: this.configService.get('REDIS_RETRY_DELAY', 1000),
            connectTimeout: this.configService.get('REDIS_CONNECT_TIMEOUT', 10000),
            lazyConnect: this.configService.get('REDIS_LAZY_CONNECT', true),
            maxRetriesPerRequest: this.configService.get('REDIS_MAX_RETRIES_PER_REQUEST', 3),
            cluster: {
                enableReadyCheck: this.configService.get('REDIS_CLUSTER_READY_CHECK', false),
                maxRedirections: this.configService.get('REDIS_CLUSTER_MAX_REDIRECTIONS', 16),
                retryDelayOnFailover: this.configService.get('REDIS_CLUSTER_RETRY_DELAY', 100),
            },
        };
    }
    getConnectionOptions() {
        const config = this.getConfiguration();
        return {
            host: config.host,
            port: config.port,
            password: config.password,
            db: config.db,
            connectTimeout: config.connectTimeout,
            lazyConnect: config.lazyConnect,
            maxRetriesPerRequest: config.maxRetriesPerRequest,
            retryDelayOnFailover: config.retryDelay,
            retryAttempts: config.retryAttempts,
            family: 4,
            keepAlive: 30000,
            keyPrefix: this.configService.get('REDIS_KEY_PREFIX', ''),
        };
    }
    isClusterMode() {
        return this.configService.get('REDIS_CLUSTER_MODE', false);
    }
    getClusterNodes() {
        const nodesStr = this.configService.get('REDIS_CLUSTER_NODES', '');
        return nodesStr ? nodesStr.split(',').map(node => node.trim()) : [];
    }
};
RedisConfig = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], RedisConfig);
export { RedisConfig };
//# sourceMappingURL=RedisConfig.js.map