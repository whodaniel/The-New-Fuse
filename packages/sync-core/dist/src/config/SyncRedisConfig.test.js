"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const SyncRedisConfig_1 = require("./SyncRedisConfig");
const vi = globals_1.jest;
(0, globals_1.describe)('SyncRedisConfig', () => {
    let config;
    let configService;
    (0, globals_1.beforeEach)(() => {
        configService = {
            get: globals_1.jest.fn((key, defaultValue) => {
                const values = {
                    REDIS_KEY_PREFIX: 'tnf',
                    SYNC_LOCK_TTL: 30,
                    SYNC_HEARTBEAT_TTL: 60,
                    SYNC_REDIS_MAX_RETRIES: 3,
                };
                return values[key] ?? defaultValue;
            }),
        };
        config = new SyncRedisConfig_1.SyncRedisConfig(configService);
    });
    (0, globals_1.it)('should be defined', () => {
        (0, globals_1.expect)(config).toBeDefined();
    });
    (0, globals_1.describe)('getKeyspatterns', () => {
        (0, globals_1.it)('should return keyspace patterns with correct prefix', () => {
            const patterns = config.getKeyspatterns();
            (0, globals_1.expect)(patterns.masterClock.timestamp).toBe('tnf:sync:clock:timestamp');
            (0, globals_1.expect)(patterns.tenantSync.state('tenant-1', 'agent', 'agent-123')).toBe('tnf:sync:tenant:tenant-1:agent:agent-123:state');
            (0, globals_1.expect)(patterns.globalSync.state('template', 'template-456')).toBe('tnf:sync:global:template:template-456:state');
        });
        (0, globals_1.it)('should generate correct channel patterns', () => {
            const patterns = config.getKeyspatterns();
            (0, globals_1.expect)(patterns.channels.clockSync).toBe('tnf:sync:channel:clock');
            (0, globals_1.expect)(patterns.channels.tenantSync('tenant-1')).toBe('tnf:sync:channel:tenant:tenant-1');
            (0, globals_1.expect)(patterns.channels.globalSync).toBe('tnf:sync:channel:global');
        });
        (0, globals_1.it)('should generate correct pattern subscriptions', () => {
            const patterns = config.getKeyspatterns();
            (0, globals_1.expect)(patterns.patterns.tenantAll('tenant-1')).toBe('tnf:sync:tenant:tenant-1:*');
            (0, globals_1.expect)(patterns.patterns.globalAll).toBe('tnf:sync:global:*');
            (0, globals_1.expect)(patterns.patterns.clockAll).toBe('tnf:sync:clock:*');
        });
    });
    (0, globals_1.describe)('getTTLConfig', () => {
        (0, globals_1.it)('should return TTL configuration with correct values', () => {
            const ttlConfig = config.getTTLConfig();
            (0, globals_1.expect)(ttlConfig.locks).toBe(30);
            (0, globals_1.expect)(ttlConfig.heartbeat).toBe(60);
            (0, globals_1.expect)(ttlConfig.syncState).toBeNull();
            (0, globals_1.expect)(ttlConfig.conflicts).toBeNull();
        });
    });
    (0, globals_1.describe)('getSyncRedisConfig', () => {
        (0, globals_1.it)('should return sync-specific Redis configuration', () => {
            const syncConfig = config.getSyncRedisConfig();
            (0, globals_1.expect)(syncConfig.keyPrefix).toBe('tnf');
            (0, globals_1.expect)(syncConfig.maxRetries).toBe(3);
            (0, globals_1.expect)(typeof syncConfig.lockTimeout).toBe('number');
            (0, globals_1.expect)(typeof syncConfig.batchSize).toBe('number');
        });
    });
    (0, globals_1.describe)('validateTenantId', () => {
        (0, globals_1.it)('should validate correct tenant IDs', () => {
            (0, globals_1.expect)(config.validateTenantId('tenant-1')).toBe(true);
            (0, globals_1.expect)(config.validateTenantId('tenant_123')).toBe(true);
            (0, globals_1.expect)(config.validateTenantId('TENANT-ABC')).toBe(true);
        });
        (0, globals_1.it)('should reject invalid tenant IDs', () => {
            (0, globals_1.expect)(config.validateTenantId('tenant@123')).toBe(false);
            (0, globals_1.expect)(config.validateTenantId('tenant.123')).toBe(false);
            (0, globals_1.expect)(config.validateTenantId('tenant 123')).toBe(false);
            (0, globals_1.expect)(config.validateTenantId('')).toBe(false);
        });
        (0, globals_1.it)('should reject tenant IDs that are too long', () => {
            const longTenantId = 'a'.repeat(65);
            (0, globals_1.expect)(config.validateTenantId(longTenantId)).toBe(false);
        });
    });
    (0, globals_1.describe)('sanitizeResourceId', () => {
        (0, globals_1.it)('should sanitize resource IDs correctly', () => {
            (0, globals_1.expect)(config.sanitizeResourceId('resource-123')).toBe('resource-123');
            (0, globals_1.expect)(config.sanitizeResourceId('resource@123')).toBe('resource_123');
            (0, globals_1.expect)(config.sanitizeResourceId('resource.123')).toBe('resource_123');
            (0, globals_1.expect)(config.sanitizeResourceId('resource 123')).toBe('resource_123');
        });
        (0, globals_1.it)('should limit resource ID length', () => {
            const longResourceId = 'a'.repeat(200);
            const sanitized = config.sanitizeResourceId(longResourceId);
            (0, globals_1.expect)(sanitized.length).toBe(128);
        });
    });
});
//# sourceMappingURL=SyncRedisConfig.test.js.map