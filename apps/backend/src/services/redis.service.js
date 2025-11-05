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
var RedisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = __importDefault(require("ioredis"));
let RedisService = RedisService_1 = class RedisService {
    logger = new common_1.Logger(RedisService_1.name);
    client;
    subscriber;
    constructor() {
        this.client = new ioredis_1.default({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
            db: parseInt(process.env.REDIS_DB || '0'),
        });
        this.subscriber = new ioredis_1.default({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
            db: parseInt(process.env.REDIS_DB || '0'),
        });
        this.client.on('connect', () => {
            this.logger.log('Connected to Redis');
        });
        this.client.on('error', (error) => {
            this.logger.error('Redis connection error:', error);
        });
    }
    async get(key) {
        return this.client.get(key);
    }
    async set(key, value, ttl) {
        if (ttl) {
            await this.client.setex(key, ttl, value);
        }
        else {
            await this.client.set(key, value);
        }
    }
    async del(key) {
        await this.client.del(key);
    }
    async exists(key) {
        const result = await this.client.exists(key);
        return result === 1;
    }
    async lpush(key, ...values) {
        return this.client.lpush(key, ...values);
    }
    async rpop(key) {
        return this.client.rpop(key);
    }
    async llen(key) {
        return this.client.llen(key);
    }
    async publish(channel, message) {
        return this.client.publish(channel, message);
    }
    async subscribe(channel, callback) {
        this.subscriber.subscribe(channel);
        this.subscriber.on('message', (receivedChannel, message) => {
            if (receivedChannel === channel) {
                callback(message);
            }
        });
    }
    async unsubscribe(channel) {
        this.subscriber.unsubscribe(channel);
    }
    async getTasks() {
        const tasks = await this.client.lrange('tasks', 0, -1);
        return tasks.map(task => JSON.parse(task));
    }
    async addTask(task) {
        await this.client.lpush('tasks', JSON.stringify(task));
    }
    async getQueueLength(queueName) {
        return this.client.llen(queueName);
    }
    async flushAll() {
        await this.client.flushall();
    }
    getSubClient() {
        return this.subscriber;
    }
    async sendToComposer(message) {
        await this.publish('composer:messages', JSON.stringify(message));
    }
    async sendToRooCoder(message) {
        await this.publish('roocoder:messages', JSON.stringify(message));
    }
    async subscribeToChannel(channel, callback) {
        await this.subscribe(channel, callback);
    }
    async ping() {
        return this.client.ping();
    }
    async disconnect() {
        await this.client.disconnect();
        await this.subscriber.disconnect();
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], RedisService);
//# sourceMappingURL=redis.service.js.map