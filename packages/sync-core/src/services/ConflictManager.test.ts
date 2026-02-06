import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService, SyncConflict, SyncState } from '@the-new-fuse/database/generated/db';
import { SyncDatabaseService } from '../database/SyncDatabaseService';
import { ConflictManager } from './ConflictManager';

// Mock DatabaseService
const mockDbClient = {
  $transaction: jest.fn(),
  syncConflict: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
  user: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  authEvent: {
    create: jest.fn(),
  },
};

// Mock SyncDatabaseService
const mockSyncDatabaseService = {
  getSyncState: jest.fn(),
  upsertSyncState: jest.fn(),
  getPendingConflicts: jest.fn(),
  getResourceConflicts: jest.fn(),
  cleanupResolvedConflicts: jest.fn(),
  getSyncStatistics: jest.fn(),
};

describe('ConflictManager', () => {
  let service: ConflictManager;
  let db: jest.Mocked<DatabaseService>;
  let syncDb: jest.Mocked<SyncDatabaseService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConflictManager,
        {
          provide: DatabaseService,
          useValue: mockDbClient,
        },
        {
          provide: SyncDatabaseService,
          useValue: mockSyncDatabaseService,
        },
      ],
    }).compile();

    service = module.get<ConflictManager>(ConflictManager);
    db = module.get(DatabaseService);
    syncDb = module.get(SyncDatabaseService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('detectConflict', () => {
    it('should return null when no existing sync state', async () => {
      syncDb.getSyncState.mockResolvedValue(null);

      const result = await service.detectConflict(
        'agent',
        'test-agent-id',
        { version: 1 },
        { version: 2 }
      );

      expect(result).toBeNull();
      expect(syncDb.getSyncState).toHaveBeenCalledWith('agent', 'test-agent-id', undefined);
    });

    it('should return null when no conflict detected', async () => {
      const mockSyncState: SyncState = {
        id: 'sync-state-id',
        resourceType: 'agent',
        resourceId: 'test-agent-id',
        tenantId: null,
        version: 1,
        checksum: 'same-checksum',
        lastSync: new Date(),
        syncedBy: 'test-instance',
        metadata: null,
      };

      syncDb.getSyncState.mockResolvedValue(mockSyncState);

      // Mock the checksum calculation to return same values
      const originalCalculateChecksum = (service as any).calculateChecksum;
      (service as any).calculateChecksum = jest.fn().mockReturnValue('same-checksum');

      const result = await service.detectConflict(
        'agent',
        'test-agent-id',
        { version: 1 },
        { version: 1 }
      );

      expect(result).toBeNull();

      // Restore original method
      (service as any).calculateChecksum = originalCalculateChecksum;
    });

    it('should create conflict when version mismatch detected', async () => {
      const mockSyncState: SyncState = {
        id: 'sync-state-id',
        resourceType: 'agent',
        resourceId: 'test-agent-id',
        tenantId: null,
        version: 1,
        checksum: 'existing-checksum',
        lastSync: new Date(),
        syncedBy: 'test-instance',
        metadata: null,
      };

      const mockConflict: SyncConflict = {
        id: 'conflict-id',
        resourceType: 'agent',
        resourceId: 'test-agent-id',
        tenantId: null,
        conflictType: 'version',
        localVersion: { version: 1 },
        remoteVersion: { version: 2 },
        resolvedAt: null,
        resolvedBy: null,
        resolution: null,
        createdAt: new Date(),
      };

      const mockSystemUser = {
        id: 'system-user-id',
        username: 'system-sync-manager',
      };

      syncDb.getSyncState.mockResolvedValue(mockSyncState);

      // Mock transaction
      db.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          syncConflict: {
            create: jest.fn().mockResolvedValue(mockConflict),
          },
          user: {
            findFirst: jest.fn().mockResolvedValue(mockSystemUser),
          },
          authEvent: {
            create: jest.fn().mockResolvedValue({}),
          },
        };
        return await callback(mockTx);
      });

      const result = await service.detectConflict(
        'agent',
        'test-agent-id',
        { version: 1 },
        { version: 2 }
      );

      expect(result).toEqual(mockConflict);
      expect(db.$transaction).toHaveBeenCalled();
    });

    it('should handle tenant-specific conflicts', async () => {
      const tenantId = 'tenant-123';
      const mockSyncState: SyncState = {
        id: 'sync-state-id',
        resourceType: 'agent',
        resourceId: 'test-agent-id',
        tenantId,
        version: 1,
        checksum: 'existing-checksum',
        lastSync: new Date(),
        syncedBy: 'test-instance',
        metadata: null,
      };

      syncDb.getSyncState.mockResolvedValue(mockSyncState);

      await service.detectConflict(
        'agent',
        'test-agent-id',
        { version: 1 },
        { version: 2 },
        tenantId
      );

      expect(syncDb.getSyncState).toHaveBeenCalledWith('agent', 'test-agent-id', tenantId);
    });
  });

  describe('resolveConflict', () => {
    it('should resolve conflict with latest_wins strategy', async () => {
      const conflictId = 'conflict-id';
      const mockConflict: SyncConflict = {
        id: conflictId,
        resourceType: 'agent',
        resourceId: 'test-agent-id',
        tenantId: null,
        conflictType: 'version',
        localVersion: { version: 1, data: 'local' },
        remoteVersion: { version: 2, data: 'remote' },
        resolvedAt: null,
        resolvedBy: null,
        resolution: null,
        createdAt: new Date(),
      };

      const mockSystemUser = {
        id: 'system-user-id',
        username: 'system-sync-manager',
      };

      // Mock transaction
      db.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          syncConflict: {
            findUnique: jest.fn().mockResolvedValue(mockConflict),
            update: jest.fn().mockResolvedValue({
              ...mockConflict,
              resolvedAt: new Date(),
              resolvedBy: 'test-resolver',
            }),
          },
          user: {
            findFirst: jest.fn().mockResolvedValue(mockSystemUser),
          },
          authEvent: {
            create: jest.fn().mockResolvedValue({}),
          },
        };
        return await callback(mockTx);
      });

      syncDb.upsertSyncState.mockResolvedValue({} as any);

      const result = await service.resolveConflict(conflictId, 'latest_wins', 'test-resolver');

      expect(result.strategy).toBe('latest_wins');
      expect(result.resolvedData).toEqual(mockConflict.remoteVersion);
      expect(syncDb.upsertSyncState).toHaveBeenCalled();
    });

    it('should resolve conflict with merge strategy', async () => {
      const conflictId = 'conflict-id';
      const mockConflict: SyncConflict = {
        id: conflictId,
        resourceType: 'agent',
        resourceId: 'test-agent-id',
        tenantId: null,
        conflictType: 'checksum',
        localVersion: { version: 1, localData: 'local' },
        remoteVersion: { version: 1, remoteData: 'remote' },
        resolvedAt: null,
        resolvedBy: null,
        resolution: null,
        createdAt: new Date(),
      };

      const mockSystemUser = {
        id: 'system-user-id',
        username: 'system-sync-manager',
      };

      // Mock transaction
      db.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          syncConflict: {
            findUnique: jest.fn().mockResolvedValue(mockConflict),
            update: jest.fn().mockResolvedValue({
              ...mockConflict,
              resolvedAt: new Date(),
              resolvedBy: 'test-resolver',
            }),
          },
          user: {
            findFirst: jest.fn().mockResolvedValue(mockSystemUser),
          },
          authEvent: {
            create: jest.fn().mockResolvedValue({}),
          },
        };
        return await callback(mockTx);
      });

      syncDb.upsertSyncState.mockResolvedValue({} as any);

      const result = await service.resolveConflict(conflictId, 'merge', 'test-resolver');

      expect(result.strategy).toBe('merge');
      expect(result.resolvedData).toMatchObject({
        version: 1,
        localData: 'local',
        remoteData: 'remote',
      });
    });

    it('should throw error for already resolved conflict', async () => {
      const conflictId = 'conflict-id';
      const mockConflict: SyncConflict = {
        id: conflictId,
        resourceType: 'agent',
        resourceId: 'test-agent-id',
        tenantId: null,
        conflictType: 'version',
        localVersion: { version: 1 },
        remoteVersion: { version: 2 },
        resolvedAt: new Date(),
        resolvedBy: 'previous-resolver',
        resolution: null,
        createdAt: new Date(),
      };

      // Mock transaction
      db.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          syncConflict: {
            findUnique: jest.fn().mockResolvedValue(mockConflict),
          },
        };
        return await callback(mockTx);
      });

      await expect(
        service.resolveConflict(conflictId, 'latest_wins', 'test-resolver')
      ).rejects.toThrow('already resolved');
    });

    it('should throw error for manual resolution strategy', async () => {
      const conflictId = 'conflict-id';
      const mockConflict: SyncConflict = {
        id: conflictId,
        resourceType: 'agent',
        resourceId: 'test-agent-id',
        tenantId: null,
        conflictType: 'concurrent',
        localVersion: { version: 1 },
        remoteVersion: { version: 2 },
        resolvedAt: null,
        resolvedBy: null,
        resolution: null,
        createdAt: new Date(),
      };

      // Mock transaction
      db.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          syncConflict: {
            findUnique: jest.fn().mockResolvedValue(mockConflict),
          },
        };
        return await callback(mockTx);
      });

      await expect(service.resolveConflict(conflictId, 'manual', 'test-resolver')).rejects.toThrow(
        'Manual resolution strategy requires human intervention'
      );
    });
  });

  describe('getPendingConflicts', () => {
    it('should return pending conflicts for tenant', async () => {
      const tenantId = 'tenant-123';
      const mockConflicts: SyncConflict[] = [
        {
          id: 'conflict-1',
          resourceType: 'agent',
          resourceId: 'agent-1',
          tenantId,
          conflictType: 'version',
          localVersion: {},
          remoteVersion: {},
          resolvedAt: null,
          resolvedBy: null,
          resolution: null,
          createdAt: new Date(),
        },
      ];

      syncDb.getPendingConflicts.mockResolvedValue(mockConflicts);

      const result = await service.getPendingConflicts(tenantId);

      expect(result).toEqual(mockConflicts);
      expect(syncDb.getPendingConflicts).toHaveBeenCalledWith(tenantId);
    });
  });

  describe('getResourceConflicts', () => {
    it('should return conflicts for specific resource', async () => {
      const resourceType = 'agent';
      const resourceId = 'test-agent-id';
      const tenantId = 'tenant-123';
      const mockConflicts: SyncConflict[] = [
        {
          id: 'conflict-1',
          resourceType,
          resourceId,
          tenantId,
          conflictType: 'version',
          localVersion: {},
          remoteVersion: {},
          resolvedAt: null,
          resolvedBy: null,
          resolution: null,
          createdAt: new Date(),
        },
      ];

      syncDb.getResourceConflicts.mockResolvedValue(mockConflicts);

      const result = await service.getResourceConflicts(resourceType, resourceId, tenantId);

      expect(result).toEqual(mockConflicts);
      expect(syncDb.getResourceConflicts).toHaveBeenCalledWith(resourceType, resourceId, tenantId);
    });
  });

  describe('autoResolveConflicts', () => {
    it('should auto-resolve version conflicts with latest_wins', async () => {
      const tenantId = 'tenant-123';
      const mockConflicts: SyncConflict[] = [
        {
          id: 'conflict-1',
          resourceType: 'agent',
          resourceId: 'agent-1',
          tenantId,
          conflictType: 'version',
          localVersion: { version: 1 },
          remoteVersion: { version: 2 },
          resolvedAt: null,
          resolvedBy: null,
          resolution: null,
          createdAt: new Date(),
        },
      ];

      syncDb.getPendingConflicts.mockResolvedValue(mockConflicts);

      // Mock the resolveConflict method
      const resolveConflictSpy = jest.spyOn(service, 'resolveConflict').mockResolvedValue({
        strategy: 'latest_wins',
        resolvedData: { version: 2 },
      });

      const result = await service.autoResolveConflicts(tenantId);

      expect(result).toBe(1);
      expect(resolveConflictSpy).toHaveBeenCalledWith(
        'conflict-1',
        'latest_wins',
        'system-auto-resolver',
        { tenantId, permissions: [], isolationLevel: 'strict' }
      );

      resolveConflictSpy.mockRestore();
    });

    it('should skip concurrent conflicts (no auto-resolution)', async () => {
      const mockConflicts: SyncConflict[] = [
        {
          id: 'conflict-1',
          resourceType: 'agent',
          resourceId: 'agent-1',
          tenantId: null,
          conflictType: 'concurrent',
          localVersion: { version: 1 },
          remoteVersion: { version: 2 },
          resolvedAt: null,
          resolvedBy: null,
          resolution: null,
          createdAt: new Date(),
        },
      ];

      syncDb.getPendingConflicts.mockResolvedValue(mockConflicts);

      const resolveConflictSpy = jest.spyOn(service, 'resolveConflict');

      const result = await service.autoResolveConflicts();

      expect(result).toBe(0);
      expect(resolveConflictSpy).not.toHaveBeenCalled();

      resolveConflictSpy.mockRestore();
    });
  });

  describe('cleanupResolvedConflicts', () => {
    it('should cleanup old resolved conflicts', async () => {
      const olderThanDays = 30;
      const cleanedCount = 5;

      syncDb.cleanupResolvedConflicts.mockResolvedValue(cleanedCount);

      const result = await service.cleanupResolvedConflicts(olderThanDays);

      expect(result).toBe(cleanedCount);
      expect(syncDb.cleanupResolvedConflicts).toHaveBeenCalledWith(olderThanDays);
    });
  });

  describe('getConflictStatistics', () => {
    it('should return conflict statistics', async () => {
      const mockStats = {
        totalSyncStates: 100,
        pendingConflicts: 5,
        resolvedConflicts: 20,
        recentSyncs: 50,
        conflictRate: 0.25,
      };

      syncDb.getSyncStatistics.mockResolvedValue(mockStats);

      const result = await service.getConflictStatistics('tenant-123');

      expect(result).toEqual(mockStats);
      expect(syncDb.getSyncStatistics).toHaveBeenCalledWith('tenant-123');
    });
  });

  describe('error handling', () => {
    it('should handle database errors in detectConflict', async () => {
      const error = new Error('Database connection failed');
      syncDb.getSyncState.mockRejectedValue(error);

      await expect(
        service.detectConflict('agent', 'test-agent-id', { version: 1 }, { version: 2 })
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle transaction errors in resolveConflict', async () => {
      const error = new Error('Transaction failed');
      db.$transaction.mockRejectedValue(error);

      await expect(
        service.resolveConflict('conflict-id', 'latest_wins', 'test-resolver')
      ).rejects.toThrow('Transaction failed');
    });
  });

  describe('private methods', () => {
    it('should calculate consistent checksums', () => {
      const data1 = { a: 1, b: 2 };
      const data2 = { b: 2, a: 1 }; // Same data, different order

      const checksum1 = (service as any).calculateChecksum(data1);
      const checksum2 = (service as any).calculateChecksum(data2);

      expect(checksum1).toBe(checksum2);
      expect(typeof checksum1).toBe('string');
      expect(checksum1.length).toBe(64); // SHA-256 hex string
    });

    it('should merge versions correctly', () => {
      const local = { a: 1, b: 2 };
      const remote = { c: 3, d: 4 };

      const merged = (service as any).mergeVersions(local, remote);

      expect(merged).toMatchObject({
        a: 1,
        b: 2,
        c: 3,
        d: 4,
      });
      expect(merged._mergedAt).toBeInstanceOf(Date);
      expect(merged._mergeStrategy).toBe('auto');
    });

    it('should detect merge compatibility', () => {
      const compatible1 = { a: 1 };
      const compatible2 = { b: 2 };
      const incompatible1 = { a: 1 };
      const incompatible2 = { a: 2 }; // Same key, different value

      expect((service as any).canMerge(compatible1, compatible2)).toBe(true);
      expect((service as any).canMerge(incompatible1, incompatible2)).toBe(false);
      expect((service as any).canMerge(null, compatible1)).toBe(false);
      expect((service as any).canMerge('string', compatible1)).toBe(false);
    });
  });
});
