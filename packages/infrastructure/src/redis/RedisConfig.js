"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisConfig = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let RedisConfig = class RedisConfig {
    configService;
    constructor(configService) {
        this.configService = configService;
        console.log('[RedisConfig] Constructor called');
        console.log('[RedisConfig] ConfigService injected:', !!configService);
        if (!configService) {
            console.error('[RedisConfig] CRITICAL: ConfigService is undefined!');
            throw new Error('ConfigService was not injected into RedisConfig');
        }
    }
    parseRedisConfig() {
        let redisUrl = this.configService.get('REDIS_URL');
        if (redisUrl) {
            // Trim whitespace
            redisUrl = redisUrl.trim();
            // Check if URL was accidentally duplicated (e.g., in Railway environment vars)
            const redisPrefix = 'redis://';
            const firstIndex = redisUrl.indexOf(redisPrefix);
            const secondIndex = redisUrl.indexOf(redisPrefix, firstIndex + redisPrefix.length);
            if (firstIndex !== -1 && secondIndex !== -1) {
                // If a duplicated prefix is found, take only the first valid URL
                redisUrl = redisUrl.substring(0, secondIndex);
                console.warn(`[RedisConfig] Detected duplicated REDIS_URL in environment variable. Using only the first occurrence: ${redisUrl}`);
            }
            try {
                const url = new URL(redisUrl);
                // Parse database index safely
                const dbFromPath = url.pathname && url.pathname.length > 1 ? parseInt(url.pathname.slice(1), 10) : 0;
                const db = !isNaN(dbFromPath) && dbFromPath >= 0 ? dbFromPath : 0;
                console.log(`[RedisConfig] Using REDIS_URL: ${url.hostname}:${url.port || 6379} (db: ${db})`);
                return {
                    host: url.hostname,
                    port: parseInt(url.port || '6379', 10),
                    password: url.password || undefined,
                    db,
                };
            }
            catch (error) {
                console.error('[RedisConfig] Failed to parse REDIS_URL, falling back to individual env vars:', error);
            }
        }
        return {
            host: this.configService.get('REDIS_HOST', 'localhost'),
            port: this.configService.get('REDIS_PORT', 6379),
            password: this.configService.get('REDIS_PASSWORD'),
            db: this.configService.get('REDIS_DB', 0),
        };
    }
    getConfiguration() {
        const { host, port, password, db } = this.parseRedisConfig();
        return {
            host,
            port,
            password,
            db,
            upstash: {
                restUrl: this.configService.get('UPSTASH_REDIS_REST_URL'),
                restToken: this.configService.get('UPSTASH_REDIS_REST_TOKEN'),
            },
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
    getUpstashConfig() {
        const restUrl = this.configService.get('UPSTASH_REDIS_REST_URL');
        const restToken = this.configService.get('UPSTASH_REDIS_REST_TOKEN');
        if (restUrl && restToken) {
            return { url: restUrl, token: restToken };
        }
        return null;
    }
    getConnectionOptions() {
        const config = this.getConfiguration();
        // Check if Redis is explicitly disabled
        const redisEnabled = this.configService.get('REDIS_ENABLED', 'true');
        if (redisEnabled === 'false') {
            console.log('[RedisConfig] Redis is explicitly disabled via REDIS_ENABLED=false');
            return null;
        }
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
        return nodesStr ? nodesStr.split(',').map((node) => node.trim()) : [];
    }
};
exports.RedisConfig = RedisConfig;
exports.RedisConfig = RedisConfig = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisConfig);
//# sourceMappingURL=RedisConfig.js.map