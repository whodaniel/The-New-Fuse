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
var CacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = require("ioredis");
let CacheService = CacheService_1 = class CacheService {
    constructor(configService) {
        this.configService = configService;
        this.client = null;
        this.logger = new common_1.Logger(CacheService_1.name);
        this.enabled = true;
        // Check if Redis is explicitly disabled
        const redisEnabled = configService.get('REDIS_ENABLED', 'true');
        if (redisEnabled === 'false') {
            this.logger.warn('[CacheService] Redis is disabled via REDIS_ENABLED=false. Cache operations will be no-ops.');
            this.enabled = false;
            return;
        }
        // Parse Redis connection - support both REDIS_URL and individual env vars
        let redisUrl = configService.get('REDIS_URL');
        if (redisUrl) {
            // Trim whitespace
            redisUrl = redisUrl.trim();
            // Check if URL was accidentally duplicated (e.g., in CloudRuntime environment vars)
            // Check for both redis:// and rediss:// (TLS) prefixes
            const supportedPrefixes = ['redis://', 'rediss://'];
            const prefix = supportedPrefixes.find((p) => redisUrl.startsWith(p));
            if (prefix) {
                const secondIndex = redisUrl.indexOf(prefix, prefix.length);
                if (secondIndex !== -1) {
                    // If a duplicated prefix is found, take only the first valid URL
                    const originalUrlLength = redisUrl.length;
                    redisUrl = redisUrl.substring(0, secondIndex);
                    this.logger.warn(`[CacheService] Detected duplicated REDIS_URL in environment variable. Truncated from ${originalUrlLength} to ${redisUrl.length} characters.`);
                }
            }
            // CloudRuntime Redis Check: Log if it is a CloudRuntime URL
            if (redisUrl.includes('cloud_runtime')) {
                this.logger.log(`[CacheService] Detected CloudRuntime Redis URL`);
            }
            // Initialize Redis client with the connection string
            // This automatically handles hostname, port, password, database, and TLS (rediss://)
            try {
                // Validate URL parsing before passing to ioredis to ensure it's valid
                // and to extract information for logging
                const url = new URL(redisUrl);
                this.client = new ioredis_1.Redis(redisUrl);
                this.logger.log(`[CacheService] Connecting to Redis at ${url.hostname}:${url.port || 6379}${url.pathname && url.pathname.length > 1 ? ` (db: ${url.pathname.slice(1)})` : ''}`);
            }
            catch (error) {
                this.logger.error(`[CacheService] Failed to parse REDIS_URL: ${error.message}`);
                throw error;
            }
        }
        else {
            // Fallback to individual environment variables
            const host = configService.get('REDIS_HOST') || 'localhost';
            const port = configService.get('REDIS_PORT') || 6379;
            const password = configService.get('REDIS_PASSWORD');
            const dbEnv = configService.get('REDIS_DB');
            // Parse database index safely - handle empty strings, NaN, invalid values
            let db = 0;
            if (dbEnv !== undefined && dbEnv !== null && dbEnv !== '') {
                const parsed = typeof dbEnv === 'string' ? parseInt(dbEnv, 10) : dbEnv;
                db = !isNaN(parsed) && parsed >= 0 ? parsed : 0;
            }
            this.client = new ioredis_1.Redis({
                host,
                port: typeof port === 'string' ? parseInt(port, 10) : port,
                password,
                db,
            });
            this.logger.log(`[CacheService] Connecting to Redis at ${host}:${port} (db: ${db})`);
        }
        this.client.on('error', (err) => this.logger.error('Redis error', err));
        this.client.on('connect', () => this.logger.log('Redis connected successfully'));
    }
    async get(key) {
        if (!this.enabled || !this.client)
            return null;
        return this.client.get(key);
    }
    async set(key, value) {
        if (!this.enabled || !this.client)
            return 'OK';
        return this.client.set(key, value);
    }
    async del(key) {
        if (!this.enabled || !this.client)
            return 0;
        return this.client.del(key);
    }
    async sadd(key, member) {
        if (!this.enabled || !this.client)
            return 0;
        return this.client.sadd(key, member);
    }
    async srem(key, member) {
        if (!this.enabled || !this.client)
            return 0;
        return this.client.srem(key, member);
    }
    async scard(key) {
        if (!this.enabled || !this.client)
            return 0;
        return this.client.scard(key);
    }
    async hget(key, field) {
        if (!this.enabled || !this.client)
            return null;
        return this.client.hget(key, field);
    }
    async hgetall(key) {
        if (!this.enabled || !this.client)
            return {};
        return this.client.hgetall(key);
    }
    async lrange(key, start, stop) {
        if (!this.enabled || !this.client)
            return [];
        return this.client.lrange(key, start, stop);
    }
};
exports.CacheService = CacheService;
exports.CacheService = CacheService = CacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], CacheService);
//# sourceMappingURL=cache.service.js.map