import { describe, it, expect, beforeEach, jest } from '@jest/globals';
const vi = jest;
import { ConfigService } from '@nestjs/config';
import { SyncRedisConfig } from './SyncRedisConfig';

describe('SyncRedisConfig', () => {
  let config: SyncRedisConfig;
  let configService: ConfigService;

  beforeEach(() => {
    configService = {
      get: jest.fn((key: string, defaultValue?: any) => {
        const values: Record<string, any> = {
          'REDIS_KEY_PREFIX': 'tnf',
          'SYNC_LOCK_TTL': 30,
          'SYNC_HEARTBEAT_TTL': 60,
          'SYNC_REDIS_MAX_RETRIES': 3,
        };
        return values[key] ?? defaultValue;
      }),
    } as any;

    config = new SyncRedisConfig(configService);
  });

  it('should be defined', () => {
    expect(config).toBeDefined();
  });

  describe('getKeyspatterns', () => {
    it('should return keyspace patterns with correct prefix', () => {
      const patterns = config.getKeyspatterns();

      expect(patterns.masterClock.timestamp).toBe('tnf:sync:clock:timestamp');
      expect(patterns.tenantSync.state('tenant-1', 'agent', 'agent-123'))
        .toBe('tnf:sync:tenant:tenant-1:agent:agent-123:state');
      expect(patterns.globalSync.state('template', 'template-456'))
        .toBe('tnf:sync:global:template:template-456:state');
    });

    it('should generate correct channel patterns', () => {
      const patterns = config.getKeyspatterns();

      expect(patterns.channels.clockSync).toBe('tnf:sync:channel:clock');
      expect(patterns.channels.tenantSync('tenant-1')).toBe('tnf:sync:channel:tenant:tenant-1');
      expect(patterns.channels.globalSync).toBe('tnf:sync:channel:global');
    });

    it('should generate correct pattern subscriptions', () => {
      const patterns = config.getKeyspatterns();

      expect(patterns.patterns.tenantAll('tenant-1')).toBe('tnf:sync:tenant:tenant-1:*');
      expect(patterns.patterns.globalAll).toBe('tnf:sync:global:*');
      expect(patterns.patterns.clockAll).toBe('tnf:sync:clock:*');
    });
  });

  describe('getTTLConfig', () => {
    it('should return TTL configuration with correct values', () => {
      const ttlConfig = config.getTTLConfig();

      expect(ttlConfig.locks).toBe(30);
      expect(ttlConfig.heartbeat).toBe(60);
      expect(ttlConfig.syncState).toBeNull();
      expect(ttlConfig.conflicts).toBeNull();
    });
  });

  describe('getSyncRedisConfig', () => {
    it('should return sync-specific Redis configuration', () => {
      const syncConfig = config.getSyncRedisConfig();

      expect(syncConfig.keyPrefix).toBe('tnf');
      expect(syncConfig.maxRetries).toBe(3);
      expect(typeof syncConfig.lockTimeout).toBe('number');
      expect(typeof syncConfig.batchSize).toBe('number');
    });
  });

  describe('validateTenantId', () => {
    it('should validate correct tenant IDs', () => {
      expect(config.validateTenantId('tenant-1')).toBe(true);
      expect(config.validateTenantId('tenant_123')).toBe(true);
      expect(config.validateTenantId('TENANT-ABC')).toBe(true);
    });

    it('should reject invalid tenant IDs', () => {
      expect(config.validateTenantId('tenant@123')).toBe(false);
      expect(config.validateTenantId('tenant.123')).toBe(false);
      expect(config.validateTenantId('tenant 123')).toBe(false);
      expect(config.validateTenantId('')).toBe(false);
    });

    it('should reject tenant IDs that are too long', () => {
      const longTenantId = 'a'.repeat(65);
      expect(config.validateTenantId(longTenantId)).toBe(false);
    });
  });

  describe('sanitizeResourceId', () => {
    it('should sanitize resource IDs correctly', () => {
      expect(config.sanitizeResourceId('resource-123')).toBe('resource-123');
      expect(config.sanitizeResourceId('resource@123')).toBe('resource_123');
      expect(config.sanitizeResourceId('resource.123')).toBe('resource_123');
      expect(config.sanitizeResourceId('resource 123')).toBe('resource_123');
    });

    it('should limit resource ID length', () => {
      const longResourceId = 'a'.repeat(200);
      const sanitized = config.sanitizeResourceId(longResourceId);
      expect(sanitized.length).toBe(128);
    });
  });
});