"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const config_1 = require("@nestjs/config");
const rate_limiter_service_1 = require("../rate-limiter.service");
// Mock Redis
jest.mock('ioredis', () => {
    return jest.fn().mockImplementation(() => ({
        get: jest.fn(),
        setex: jest.fn(),
        multi: jest.fn(),
        exec: jest.fn(),
        del: jest.fn(),
        zremrangebyscore: jest.fn(),
        zcard: jest.fn(),
        zadd: jest.fn(),
        expire: jest.fn(),
        zcount: jest.fn(),
        keys: jest.fn(),
        quit: jest.fn(),
    }));
});
describe('RateLimiterService', () => {
    let service;
    let redis;
    let configService;
    beforeEach(async () => {
        const mockConfigService = {
            get: jest.fn().mockReturnValue('redis://localhost:6379'),
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                rate_limiter_service_1.RateLimiterService,
                {
                    provide: config_1.ConfigService,
                    useValue: mockConfigService,
                },
            ],
        }).compile();
        service = module.get(rate_limiter_service_1.RateLimiterService);
        configService = module.get(config_1.ConfigService);
        // Get the mocked Redis instance
        redis = service.redis;
        // Reset all mocks
        jest.clearAllMocks();
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('checkRateLimit', () => {
        it('should allow request when under limit', async () => {
            const mockMulti = {
                zremrangebyscore: jest.fn().mockReturnThis(),
                zcard: jest.fn().mockReturnThis(),
                zadd: jest.fn().mockReturnThis(),
                expire: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue([
                    [null, null], // zremrangebyscore
                    [null, 2], // zcard (current hits)
                    [null, 1], // zadd
                    [null, 1], // expire
                ]),
            };
            redis.get.mockResolvedValue(null); // Not blocked
            redis.multi.mockReturnValue(mockMulti);
            const result = await service.checkRateLimit('test-key', {
                windowMs: 60000,
                max: 5,
            });
            expect(result.isAllowed).toBe(true);
            expect(result.totalHits).toBe(3); // 2 existing + 1 current
            expect(result.remainingPoints).toBe(2); // 5 - 2 - 1
        });
        it('should block request when limit exceeded', async () => {
            const mockMulti = {
                zremrangebyscore: jest.fn().mockReturnThis(),
                zcard: jest.fn().mockReturnThis(),
                zadd: jest.fn().mockReturnThis(),
                expire: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue([
                    [null, null], // zremrangebyscore
                    [null, 5], // zcard (current hits at limit)
                    [null, 1], // zadd
                    [null, 1], // expire
                ]),
            };
            redis.get.mockResolvedValue(null); // Not blocked initially
            redis.multi.mockReturnValue(mockMulti);
            redis.setex.mockResolvedValue('OK');
            const result = await service.checkRateLimit('test-key', {
                windowMs: 60000,
                max: 5,
                blockDuration: 300000, // 5 minutes
            });
            expect(result.isAllowed).toBe(false);
            expect(result.totalHits).toBe(6); // 5 existing + 1 current
            expect(result.remainingPoints).toBe(0);
            expect(redis.setex).toHaveBeenCalled(); // Should set block
        });
        it('should respect existing block', async () => {
            const futureTime = (Date.now() + 300000).toString(); // 5 minutes from now
            redis.get.mockResolvedValue(futureTime);
            const result = await service.checkRateLimit('test-key', {
                windowMs: 60000,
                max: 5,
            });
            expect(result.isAllowed).toBe(false);
            expect(result.remainingPoints).toBe(0);
            expect(result.msBeforeNext).toBeGreaterThan(0);
        });
    });
    describe('checkAuthRateLimit', () => {
        it('should apply login rate limiting', async () => {
            const mockMulti = {
                zremrangebyscore: jest.fn().mockReturnThis(),
                zcard: jest.fn().mockReturnThis(),
                zadd: jest.fn().mockReturnThis(),
                expire: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue([
                    [null, null],
                    [null, 1],
                    [null, 1],
                    [null, 1],
                ]),
            };
            redis.get.mockResolvedValue(null);
            redis.multi.mockReturnValue(mockMulti);
            const result = await service.checkAuthRateLimit('/auth/login', 'ip:192.168.1.1', false // Failed login
            );
            expect(result.isAllowed).toBe(true);
            expect(redis.multi).toHaveBeenCalled();
        });
        it('should skip counting successful logins when configured', async () => {
            const result = await service.checkAuthRateLimit('/auth/login', 'ip:192.168.1.1', true // Successful login
            );
            expect(result.isAllowed).toBe(true);
            expect(result.totalHits).toBe(0);
            expect(result.remainingPoints).toBe(5); // Login rule max
        });
        it('should apply registration rate limiting', async () => {
            const mockMulti = {
                zremrangebyscore: jest.fn().mockReturnThis(),
                zcard: jest.fn().mockReturnThis(),
                zadd: jest.fn().mockReturnThis(),
                expire: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue([
                    [null, null],
                    [null, 0],
                    [null, 1],
                    [null, 1],
                ]),
            };
            redis.get.mockResolvedValue(null);
            redis.multi.mockReturnValue(mockMulti);
            const result = await service.checkAuthRateLimit('/auth/register', 'ip:192.168.1.1');
            expect(result.isAllowed).toBe(true);
        });
        it('should apply general auth rate limiting for unknown endpoints', async () => {
            const mockMulti = {
                zremrangebyscore: jest.fn().mockReturnThis(),
                zcard: jest.fn().mockReturnThis(),
                zadd: jest.fn().mockReturnThis(),
                expire: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue([
                    [null, null],
                    [null, 10],
                    [null, 1],
                    [null, 1],
                ]),
            };
            redis.get.mockResolvedValue(null);
            redis.multi.mockReturnValue(mockMulti);
            const result = await service.checkAuthRateLimit('/auth/unknown-endpoint', 'ip:192.168.1.1');
            expect(result.isAllowed).toBe(true);
        });
    });
    describe('checkIPRateLimit', () => {
        it('should check rate limit for IP address', async () => {
            const mockMulti = {
                zremrangebyscore: jest.fn().mockReturnThis(),
                zcard: jest.fn().mockReturnThis(),
                zadd: jest.fn().mockReturnThis(),
                expire: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue([
                    [null, null],
                    [null, 0],
                    [null, 1],
                    [null, 1],
                ]),
            };
            redis.get.mockResolvedValue(null);
            redis.multi.mockReturnValue(mockMulti);
            const result = await service.checkIPRateLimit('/auth/login', '192.168.1.1');
            expect(result.isAllowed).toBe(true);
        });
    });
    describe('checkUserRateLimit', () => {
        it('should check rate limit for user ID', async () => {
            const mockMulti = {
                zremrangebyscore: jest.fn().mockReturnThis(),
                zcard: jest.fn().mockReturnThis(),
                zadd: jest.fn().mockReturnThis(),
                expire: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue([
                    [null, null],
                    [null, 2],
                    [null, 1],
                    [null, 1],
                ]),
            };
            redis.get.mockResolvedValue(null);
            redis.multi.mockReturnValue(mockMulti);
            const result = await service.checkUserRateLimit('/auth/refresh-token/refresh', 'user-123');
            expect(result.isAllowed).toBe(true);
        });
    });
    describe('resetRateLimit', () => {
        it('should reset rate limit for a key', async () => {
            redis.del.mockResolvedValue(1);
            await service.resetRateLimit('test-key');
            expect(redis.del).toHaveBeenCalledWith('test-key');
            expect(redis.del).toHaveBeenCalledWith('block:test-key');
        });
    });
    describe('getRateLimitStatus', () => {
        it('should get current status without incrementing', async () => {
            redis.get.mockResolvedValue(null); // Not blocked
            redis.zcount.mockResolvedValue(3); // Current hits
            const result = await service.getRateLimitStatus('test-key', {
                windowMs: 60000,
                max: 5,
            });
            expect(result.totalHits).toBe(3);
            expect(result.remainingPoints).toBe(2);
            expect(result.isAllowed).toBe(true);
            expect(redis.zcount).toHaveBeenCalled();
        });
    });
    describe('clearAllRateLimits', () => {
        it('should clear all rate limiting data', async () => {
            redis.keys
                .mockResolvedValueOnce(['auth:login:ip:1', 'auth:register:ip:2'])
                .mockResolvedValueOnce(['block:auth:login:ip:1']);
            redis.del.mockResolvedValue(2);
            await service.clearAllRateLimits();
            expect(redis.keys).toHaveBeenCalledWith('auth:*');
            expect(redis.keys).toHaveBeenCalledWith('block:auth:*');
            expect(redis.del).toHaveBeenCalledTimes(2);
        });
    });
    describe('getRateLimitStats', () => {
        it('should return rate limiting statistics', async () => {
            redis.keys
                .mockResolvedValueOnce(['auth:login:ip:1', 'auth:register:ip:2', 'auth:refresh:user:3'])
                .mockResolvedValueOnce(['block:auth:login:ip:1']);
            redis.zcard
                .mockResolvedValueOnce(5)
                .mockResolvedValueOnce(3)
                .mockResolvedValueOnce(1);
            const result = await service.getRateLimitStats();
            expect(result.totalKeys).toBe(3);
            expect(result.blockedKeys).toBe(1);
            expect(result.topAbusers).toHaveLength(3);
            expect(result.topAbusers[0].hits).toBe(5); // Should be sorted by hits desc
        });
    });
    describe('onModuleDestroy', () => {
        it('should quit Redis connection on module destroy', async () => {
            redis.quit.mockResolvedValue('OK');
            await service.onModuleDestroy();
            expect(redis.quit).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=rate-limiter.service.test.js.map