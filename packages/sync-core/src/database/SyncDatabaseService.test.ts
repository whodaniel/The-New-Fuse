import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { DrizzleClient } from '@the-new-fuse/database/generated/drizzle';
import { SyncDatabaseService } from './SyncDatabaseService';
const vi = jest;

describe('SyncDatabaseService', () => {
  let service: SyncDatabaseService;
  let drizzle: DrizzleClient;

  beforeEach(() => {
    drizzle = {
      syncState: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      syncConflict: {
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        deleteMany: jest.fn(),
        count: jest.fn(),
      },
      $queryRaw: jest.fn(),
    } as any;

    service = new SyncDatabaseService(drizzle);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('upsertSyncState', () => {
    it('should create new sync state when none exists', async () => {
      const mockSyncState = {
        id: 'test-id',
        resourceType: 'agent',
        resourceId: 'agent-123',
        tenantId: 'tenant-1',
        version: 1,
        checksum: 'abc123',
        lastSync: new Date(),
        syncedBy: 'instance-1',
        metadata: null,
      };

      jest.mocked(drizzle.syncState.findFirst).mockResolvedValue(null);
      jest.mocked(drizzle.syncState.create).mockResolvedValue(mockSyncState);

      const result = await service.upsertSyncState({
        resourceType: 'agent',
        resourceId: 'agent-123',
        tenantId: 'tenant-1',
        version: 1,
        checksum: 'abc123',
        lastSync: new Date(),
        syncedBy: 'instance-1',
      });

      expect(result).toEqual(mockSyncState);
      expect(drizzle.syncState.findFirst).toHaveBeenCalledWith({
        where: {
          resourceType: 'agent',
          resourceId: 'agent-123',
          tenantId: 'tenant-1',
        },
      });
      expect(drizzle.syncState.create).toHaveBeenCalled();
    });
  });

  describe('getSyncState', () => {
    it('should retrieve sync state by resource identifiers', async () => {
      const mockSyncState = {
        id: 'test-id',
        resourceType: 'agent',
        resourceId: 'agent-123',
        tenantId: 'tenant-1',
        version: 1,
        checksum: 'abc123',
        lastSync: new Date(),
        syncedBy: 'instance-1',
        metadata: null,
      };

      jest.mocked(drizzle.syncState.findFirst).mockResolvedValue(mockSyncState);

      const result = await service.getSyncState('agent', 'agent-123', 'tenant-1');

      expect(result).toEqual(mockSyncState);
      expect(drizzle.syncState.findFirst).toHaveBeenCalledWith({
        where: {
          resourceType: 'agent',
          resourceId: 'agent-123',
          tenantId: 'tenant-1',
        },
      });
    });
  });

  describe('createSyncConflict', () => {
    it('should create a sync conflict record', async () => {
      const mockConflict = {
        id: 'conflict-id',
        resourceType: 'agent',
        resourceId: 'agent-123',
        tenantId: 'tenant-1',
        conflictType: 'version',
        localVersion: { version: 1 },
        remoteVersion: { version: 2 },
        resolvedAt: null,
        resolvedBy: null,
        resolution: null,
        createdAt: new Date(),
      };

      jest.mocked(drizzle.syncConflict.create).mockResolvedValue(mockConflict);

      const result = await service.createSyncConflict({
        resourceType: 'agent',
        resourceId: 'agent-123',
        tenantId: 'tenant-1',
        conflictType: 'version',
        localVersion: { version: 1 },
        remoteVersion: { version: 2 },
      });

      expect(result).toEqual(mockConflict);
      expect(drizzle.syncConflict.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          resourceType: 'agent',
          resourceId: 'agent-123',
          tenantId: 'tenant-1',
          conflictType: 'version',
        }),
      });
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status when database is accessible', async () => {
      jest.mocked(drizzle.$queryRaw).mockResolvedValue([{ '?column?': 1 }]);

      const result = await service.healthCheck();

      expect(result.status).toBe('healthy');
      expect(typeof result.latency).toBe('number');
      expect(result.latency).toBeGreaterThanOrEqual(0);
    });

    it('should return unhealthy status when database is not accessible', async () => {
      jest.mocked(drizzle.$queryRaw).mockRejectedValue(new Error('Connection failed'));

      const result = await service.healthCheck();

      expect(result.status).toBe('unhealthy');
      expect(typeof result.latency).toBe('number');
    });
  });
});
