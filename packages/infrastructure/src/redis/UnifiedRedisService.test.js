"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const config_1 = require("@nestjs/config");
const UnifiedRedisService_1 = require("./UnifiedRedisService");
const RedisConfig_1 = require("./RedisConfig");
describe('UnifiedRedisService', () => {
    let service;
    let module;
    const mockConfigService = {
        get: jest.fn((key, defaultValue) => {
            const config = {
                'REDIS_HOST': 'localhost',
                'REDIS_PORT': 6379,
                'REDIS_PASSWORD': '',
                'REDIS_DB': 0,
                'REDIS_POOL_SIZE': 10,
                'REDIS_RETRY_ATTEMPTS': 3,
                'REDIS_RETRY_DELAY': 1000,
                'REDIS_CONNECT_TIMEOUT': 10000,
                'REDIS_LAZY_CONNECT': true,
            };
            return config[key] ?? defaultValue;
        }),
    };
    beforeEach(async () => {
        module = await testing_1.Test.createTestingModule({
            providers: [
                UnifiedRedisService_1.UnifiedRedisService,
                RedisConfig_1.RedisConfig,
                {
                    provide: config_1.ConfigService,
                    useValue: mockConfigService,
                },
                {
                    provide: 'REDIS_CONFIG_OPTIONS',
                    useValue: {},
                },
            ],
        }).compile();
        service = module.get(UnifiedRedisService_1.UnifiedRedisService);
    });
    afterEach(async () => {
        await module.close();
    });
    describe('Service Creation', () => {
        it('should be defined', () => {
            expect(service).toBeDefined();
        });
        it('should have proper configuration access', () => {
            const redisConfig = module.get(RedisConfig_1.RedisConfig);
            expect(redisConfig).toBeDefined();
            const config = redisConfig.getConfiguration();
            expect(config.host).toBe('localhost');
            expect(config.port).toBe(6379);
            expect(config.db).toBe(0);
            expect(config.poolSize).toBe(10);
        });
    });
    describe('Service Methods', () => {
        it('should have all required cache methods', () => {
            expect(typeof service.set).toBe('function');
            expect(typeof service.get).toBe('function');
            expect(typeof service.del).toBe('function');
            expect(typeof service.exists).toBe('function');
        });
        it('should have queue management methods', () => {
            expect(typeof service.enqueue).toBe('function');
            expect(typeof service.dequeue).toBe('function');
            expect(typeof service.llen).toBe('function'); // Queue length via list length
        });
        it('should have pub/sub methods', () => {
            expect(typeof service.publish).toBe('function');
            expect(typeof service.subscribe).toBe('function');
            expect(typeof service.unsubscribe).toBe('function');
            expect(typeof service.psubscribe).toBe('function'); // Pattern subscribe
        });
        it('should have search capabilities', () => {
            expect(typeof service.vectorSet).toBe('function');
            expect(typeof service.vectorSearch).toBe('function');
            expect(typeof service.vectorGet).toBe('function');
        });
    });
    describe('Health and Metrics', () => {
        it('should provide health check method', async () => {
            const health = await service.getHealth();
            expect(health).toHaveProperty('status');
            expect(['healthy', 'unhealthy', 'degraded']).toContain(health.status);
        });
        it('should provide metrics method', () => {
            expect(typeof service.getMetrics).toBe('function');
            const metrics = service.getMetrics();
            expect(typeof metrics).toBe('object');
        });
        it('should provide operation logs method', () => {
            expect(typeof service.getOperationLogs).toBe('function');
            const logs = service.getOperationLogs();
            expect(Array.isArray(logs)).toBe(true);
        });
    });
});
//# sourceMappingURL=UnifiedRedisService.test.js.map