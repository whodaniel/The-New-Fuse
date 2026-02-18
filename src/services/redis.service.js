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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = __importDefault(require("ioredis"));
const LoggingService_ts_1 = require("../services/LoggingService.ts");
let RedisService = class RedisService {
    configService;
    client = null;
    logger;
    constructor(configService) {
        this.configService = configService;
        this.logger = new LoggingService_ts_1.LoggingService('RedisService');
        this.connect();
    }
    async connect() {
        if (this.client) {
            return;
        }
        try {
            const options = {
                host: this.configService.get('REDIS_HOST', 'localhost'),
                port: this.configService.get('REDIS_PORT', 6379),
                password: this.configService.get('REDIS_PASSWORD'),
                db: this.configService.get('REDIS_DB', 0),
            };
            this.client = new ioredis_1.default(options);
            this.client.on('error', (error) => {
                this.logger.error('Redis connection error:', error);
            });
            this.client.on('connect', () => {
                this.logger.info('Connected to Redis');
            });
        }
        catch (error) {
            this.logger.error('Failed to create Redis connection:', error);
            throw error;
        }
    }
    async onModuleDestroy() {
        if (this.client) {
            await this.client.quit();
            this.client = null;
        }
    }
    getClient() {
        if (!this.client) {
            throw new Error('Redis client not initialized');
        }
        return this.client;
    }
    async set(key, value, mode, duration) {
        const client = this.getClient();
        if (mode === 'EX' && duration) {
            await client.set(key, value, 'EX', duration);
        }
        else {
            await client.set(key, value);
        }
    }
    async get(key) {
        const client = this.getClient();
        return client.get(key);
    }
    async del(key) {
        const client = this.getClient();
        await client.del(key);
    }
    async keys(pattern) {
        const client = this.getClient();
        return client.keys(pattern);
    }
    async flushDb() {
        const client = this.getClient();
        await client.flushdb();
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisService);
//# sourceMappingURL=redis.service.js.map