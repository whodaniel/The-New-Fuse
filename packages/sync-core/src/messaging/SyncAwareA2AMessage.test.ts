import { SyncAwareA2AMessage, SyncAwareMessageUtils, SyncMetadata } from './SyncAwareA2AMessage';

describe('SyncAwareA2AMessage', () => {
  describe('SyncAwareMessageUtils', () => {
    it('should create sync metadata with defaults', () => {
      const syncMetadata = SyncAwareMessageUtils.createSyncMetadata();

      expect(syncMetadata).toBeDefined();
      expect(syncMetadata.syncId).toBeDefined();
      expect(syncMetadata.syncVersion).toBe(1);
      expect(syncMetadata.syncTimestamp).toBeGreaterThan(0);
      expect(syncMetadata.crossTenantAllowed).toBe(false);
      expect(syncMetadata.routingKey).toBe('default');
      expect(syncMetadata.deliveryMode).toBe('direct');
      expect(syncMetadata.requiresAck).toBe(false);
      expect(syncMetadata.conflictResolution).toBe('latest_wins');
      expect(syncMetadata.checksumValidation).toBe(true);
      expect(syncMetadata.maxRetries).toBe(3);
      expect(syncMetadata.retryCount).toBe(0);
      expect(syncMetadata.priority).toBe('medium');
      expect(syncMetadata.syncState).toBe('pending');
    });

    it('should create sync metadata with custom options', () => {
      const options: Partial<SyncMetadata> = {
        tenantId: 'test-tenant',
        crossTenantAllowed: true,
        priority: 'high',
        maxRetries: 5,
        requiresAck: true,
      };

      const syncMetadata = SyncAwareMessageUtils.createSyncMetadata(options);

      expect(syncMetadata.tenantId).toBe('test-tenant');
      expect(syncMetadata.crossTenantAllowed).toBe(true);
      expect(syncMetadata.priority).toBe('high');
      expect(syncMetadata.maxRetries).toBe(5);
      expect(syncMetadata.requiresAck).toBe(true);
    });

    it('should convert A2A message to sync-aware message', () => {
      const originalMessage = {
        id: 'test-msg-1',
        type: 'TEST_MESSAGE',
        timestamp: Date.now(),
        sender: 'test-sender',
        recipient: 'test-recipient',
        payload: { test: 'data' },
        metadata: {
          priority: 'medium' as const,
          protocol_version: '1.0',
        },
      };

      const syncAwareMessage = SyncAwareMessageUtils.toSyncAware(originalMessage, {
        tenantId: 'test-tenant',
        priority: 'high',
      });

      expect(syncAwareMessage.id).toBe('test-msg-1');
      expect(syncAwareMessage.type).toBe('TEST_MESSAGE');
      expect(syncAwareMessage.metadata.sync).toBeDefined();
      expect(syncAwareMessage.metadata.sync.tenantId).toBe('test-tenant');
      expect(syncAwareMessage.metadata.sync.priority).toBe('high');
    });

    it('should extract sync metadata from sync-aware message', () => {
      const syncMetadata = SyncAwareMessageUtils.createSyncMetadata({
        tenantId: 'test-tenant',
        priority: 'critical',
      });

      const syncAwareMessage: SyncAwareA2AMessage = {
        id: 'test-msg-1',
        type: 'TEST_MESSAGE',
        timestamp: Date.now(),
        sender: 'test-sender',
        payload: { test: 'data' },
        metadata: {
          priority: 'critical',
          protocol_version: '1.0',
          sync: syncMetadata,
        },
      };

      const extractedMetadata = SyncAwareMessageUtils.extractSyncMetadata(syncAwareMessage);

      expect(extractedMetadata).toEqual(syncMetadata);
      expect(extractedMetadata.tenantId).toBe('test-tenant');
      expect(extractedMetadata.priority).toBe('critical');
    });

    it('should check cross-tenant allowance', () => {
      const crossTenantMessage: SyncAwareA2AMessage = {
        id: 'test-msg-1',
        type: 'TEST_MESSAGE',
        timestamp: Date.now(),
        sender: 'test-sender',
        payload: { test: 'data' },
        metadata: {
          priority: 'medium',
          protocol_version: '1.0',
          sync: SyncAwareMessageUtils.createSyncMetadata({
            crossTenantAllowed: true,
          }),
        },
      };

      const singleTenantMessage: SyncAwareA2AMessage = {
        id: 'test-msg-2',
        type: 'TEST_MESSAGE',
        timestamp: Date.now(),
        sender: 'test-sender',
        payload: { test: 'data' },
        metadata: {
          priority: 'medium',
          protocol_version: '1.0',
          sync: SyncAwareMessageUtils.createSyncMetadata({
            crossTenantAllowed: false,
          }),
        },
      };

      expect(SyncAwareMessageUtils.allowsCrossTenant(crossTenantMessage)).toBe(true);
      expect(SyncAwareMessageUtils.allowsCrossTenant(singleTenantMessage)).toBe(false);
    });

    it('should get tenant ID from message', () => {
      const message: SyncAwareA2AMessage = {
        id: 'test-msg-1',
        type: 'TEST_MESSAGE',
        timestamp: Date.now(),
        sender: 'test-sender',
        payload: { test: 'data' },
        metadata: {
          priority: 'medium',
          protocol_version: '1.0',
          sync: SyncAwareMessageUtils.createSyncMetadata({
            tenantId: 'test-tenant-123',
          }),
        },
      };

      const tenantId = SyncAwareMessageUtils.getTenantId(message);
      expect(tenantId).toBe('test-tenant-123');
    });

    it('should calculate message checksum', () => {
      const message1: SyncAwareA2AMessage = {
        id: 'test-msg-1',
        type: 'TEST_MESSAGE',
        timestamp: Date.now(),
        sender: 'test-sender',
        payload: { test: 'data', value: 123 },
        metadata: {
          priority: 'medium',
          protocol_version: '1.0',
          sync: SyncAwareMessageUtils.createSyncMetadata(),
        },
      };

      const message2: SyncAwareA2AMessage = {
        ...message1,
        payload: { test: 'different-data', value: 456 },
      };

      const checksum1 = SyncAwareMessageUtils.calculateChecksum(message1);
      const checksum2 = SyncAwareMessageUtils.calculateChecksum(message2);

      expect(checksum1).toBeDefined();
      expect(checksum2).toBeDefined();
      expect(checksum1).not.toBe(checksum2);
      expect(typeof checksum1).toBe('string');
      expect(typeof checksum2).toBe('string');
    });

    it('should generate unique sync IDs', () => {
      const syncId1 = SyncAwareMessageUtils.generateSyncId();
      const syncId2 = SyncAwareMessageUtils.generateSyncId();

      expect(syncId1).toBeDefined();
      expect(syncId2).toBeDefined();
      expect(syncId1).not.toBe(syncId2);
      expect(syncId1).toMatch(/^sync_\d+_[a-z0-9]+$/);
      expect(syncId2).toMatch(/^sync_\d+_[a-z0-9]+$/);
    });

    it('should generate unique trace IDs', () => {
      const traceId1 = SyncAwareMessageUtils.generateTraceId();
      const traceId2 = SyncAwareMessageUtils.generateTraceId();

      expect(traceId1).toBeDefined();
      expect(traceId2).toBeDefined();
      expect(traceId1).not.toBe(traceId2);
      expect(traceId1).toMatch(/^trace_\d+_[a-z0-9]+$/);
      expect(traceId2).toMatch(/^trace_\d+_[a-z0-9]+$/);
    });

    it('should validate message structure', () => {
      const validMessage: SyncAwareA2AMessage = {
        id: 'test-msg-1',
        type: 'TEST_MESSAGE',
        timestamp: Date.now(),
        sender: 'test-sender',
        payload: { test: 'data' },
        metadata: {
          priority: 'medium',
          protocol_version: '1.0',
          sync: SyncAwareMessageUtils.createSyncMetadata({
            tenantId: 'valid-tenant-123',
          }),
        },
      };

      const invalidMessage = {
        id: 'test-msg-2',
        type: 'TEST_MESSAGE',
        timestamp: Date.now(),
        sender: 'test-sender',
        payload: { test: 'data' },
        metadata: {
          priority: 'medium',
          protocol_version: '1.0',
          sync: {
            // Missing required fields
            syncVersion: 1,
          },
        },
      } as any;

      expect(SyncAwareMessageUtils.validateMessage(validMessage)).toBe(true);
      expect(SyncAwareMessageUtils.validateMessage(invalidMessage)).toBe(false);
    });

    it('should handle V2 message format', () => {
      const v2Message = {
        header: {
          id: 'test-msg-v2',
          type: 'TEST_MESSAGE_V2',
          version: '2.0',
          priority: 'high' as const,
          source: 'test-source',
          target: 'test-target',
        },
        body: {
          content: { test: 'v2-data' },
          metadata: {
            sent_at: Date.now(),
            sync: SyncAwareMessageUtils.createSyncMetadata({
              tenantId: 'v2-tenant',
            }),
          },
        },
      };

      const syncMetadata = SyncAwareMessageUtils.extractSyncMetadata(v2Message);
      expect(syncMetadata.tenantId).toBe('v2-tenant');

      const tenantId = SyncAwareMessageUtils.getTenantId(v2Message);
      expect(tenantId).toBe('v2-tenant');

      const checksum = SyncAwareMessageUtils.calculateChecksum(v2Message);
      expect(checksum).toBeDefined();
      expect(typeof checksum).toBe('string');
    });
  });
});
