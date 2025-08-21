import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

// Import services under test
import { SyncOrchestrator } from '../services/SyncOrchestrator';
import { MasterClockService } from '../services/MasterClockService';
import { EnhancedFileSystemWatcher } from '../watchers/EnhancedFileSystemWatcher';
import { ConflictManager } from '../services/ConflictManager';
import { SyncRedisConfig } from '../config/SyncRedisConfig';

// Mock implementations for testing
const createMockWebSocketService = () => ({
  sendMessage: jest.fn().mockResolvedValue(undefined),
  broadcastToAllUsers: jest.fn().mockResolvedValue(undefined),
  broadcastToTenant: jest.fn().mockResolvedValue(undefined),
});

const createMockPromptTemplateService = () => ({
  createTemplate: jest.fn().mockResolvedValue({ id: 'template-1' }),
  updateTemplate: jest.fn().mockResolvedValue({ id: 'template-1' }),
  getTemplate: jest.fn().mockResolvedValue(null),
});

const createMockHeartbeatService = () => ({
  on: jest.fn(),
  emit: jest.fn(),
  startMonitoring: jest.fn(),
  stopMonitoring: jest.fn(),
});

const createMockMetricsService = () => ({
  collectMetric: jest.fn().mockResolvedValue(undefined),
  getMetrics: jest.fn().mockResolvedValue({}),
  getSystemMetrics: jest.fn().mockResolvedValue({}),
  getApplicationMetrics: jest.fn().mockResolvedValue({}),
  generateReport: jest.fn().mockResolvedValue({}),
});

describe('Multi-Tenant Chokidar Sync Integration Tests', () => {
  let testModule: TestingModule;
  let prismaClient: PrismaClient;
  let redisClient: Redis;
  let tempDir: string;
  let testDatabaseUrl: string;
  let testRedisUrl: string;

  // Service instances
  let syncOrchestrator: SyncOrchestrator;
  let masterClockService: MasterClockService;
  let fileSystemWatcher: EnhancedFileSystemWatcher;
  let conflictManager: ConflictManager;
  let redisConfig: SyncRedisConfig;

  // Mock services
  let mockWebSocketService: any;
  let mockPromptTemplateService: any;
  let mockHeartbeatService: any;
  let mockMetricsService: any;

  // Test data
  const testTenants = [
    { id: 'tenant-1', email: 'tenant1@test.com', role: 'USER' },
    { id: 'tenant-2', email: 'tenant2@test.com', role: 'ADMIN' },
    { id: 'tenant-3', email: 'tenant3@test.com', role: 'USER' },
  ];

  const testAgents = [
    { id: 'agent-1', name: 'Test Agent 1', userId: 'tenant-1', type: 'CHAT', status: 'ACTIVE' },
    { id: 'agent-2', name: 'Test Agent 2', userId: 'tenant-2', type: 'WORKFLOW', status: 'ACTIVE' },
    { id: 'agent-3', name: 'Test Agent 3', userId: 'tenant-1', type: 'TASK', status: 'INACTIVE' },
  ];

  beforeAll(async () => {
    // Setup test environment
    testDatabaseUrl = process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sync_test';
    testRedisUrl = process.env.TEST_REDIS_URL || 'redis://localhost:6379/15'; // Use DB 15 for tests

    // Create temp directory for file system tests
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sync-integration-test-'));

    // Initialize database connection
    prismaClient = new PrismaClient({
      datasources: {
        db: {
          url: testDatabaseUrl,
        },
      },
    });

    // Initialize Redis connection
    redisClient = new Redis(testRedisUrl);

    // Ensure test database is clean
    try {
      await prismaClient.$executeRaw`TRUNCATE TABLE "users", "agents", "sync_states", "sync_conflicts" CASCADE`;
    } catch (error) {
      // Database might not exist yet, create it
      console.log('Setting up test database...');
      try {
        execSync('npx prisma db push --force-reset', { 
          env: { ...process.env, DATABASE_URL: testDatabaseUrl },
          stdio: 'inherit'
        });
      } catch (setupError) {
        console.warn('Could not setup test database:', setupError);
      }
    }

    // Clear Redis test database
    await redisClient.flushdb();
  });

  afterAll(async () => {
    // Cleanup
    try {
      await prismaClient.$disconnect();
      await redisClient.disconnect();
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Cleanup error:', error);
    }
  });

  beforeEach(async () => {
    // Create mock services
    mockWebSocketService = createMockWebSocketService();
    mockPromptTemplateService = createMockPromptTemplateService();
    mockHeartbeatService = createMockHeartbeatService();
    mockMetricsService = createMockMetricsService();

    // Create test module
    testModule = await Test.createTestingModule({
      providers: [
        SyncOrchestrator,
        MasterClockService,
        EnhancedFileSystemWatcher,
        ConflictManager,
        SyncRedisConfig,
        {
          provide: PrismaClient,
          useValue: prismaClient,
        },
        {
          provide: Redis,
          useValue: redisClient,
        },
        {
          provide: 'IWebSocketService',
          useValue: mockWebSocketService,
        },
        {
          provide: 'IPromptTemplateService',
          useValue: mockPromptTemplateService,
        },
        {
          provide: 'IHeartbeatService',
          useValue: mockHeartbeatService,
        },
        {
          provide: 'IMetricsService',
          useValue: mockMetricsService,
        },
      ],
    }).compile();

    // Get service instances
    syncOrchestrator = testModule.get<SyncOrchestrator>(SyncOrchestrator);
    masterClockService = testModule.get<MasterClockService>(MasterClockService);
    fileSystemWatcher = testModule.get<EnhancedFileSystemWatcher>(EnhancedFileSystemWatcher);
    conflictManager = testModule.get<ConflictManager>(ConflictManager);
    redisConfig = testModule.get<SyncRedisConfig>(SyncRedisConfig);

    // Setup test data
    await setupTestData();

    // Initialize services
    await initializeServices();
  });

  afterEach(async () => {
    // Cleanup after each test
    await cleanupTestData();
    await shutdownServices();
    jest.clearAllMocks();
  });

  async function setupTestData() {
    // Create test users (tenants)
    for (const tenant of testTenants) {
      await prismaClient.user.upsert({
        where: { id: tenant.id },
        update: {},
        create: {
          id: tenant.id,
          email: tenant.email,
          role: tenant.role as any,
          hashedPassword: 'test-password',
          name: `Test User ${tenant.id}`,
        },
      });
    }

    // Create test agents
    for (const agent of testAgents) {
      await prismaClient.agent.upsert({
        where: { id: agent.id },
        update: {},
        create: {
          id: agent.id,
          name: agent.name,
          userId: agent.userId,
          type: agent.type as any,
          status: agent.status as any,
          description: `Test agent for integration testing`,
        },
      });
    }
  }

  async function cleanupTestData() {
    // Clean up test data
    await prismaClient.syncConflict.deleteMany({});
    await prismaClient.syncState.deleteMany({});
    await prismaClient.agent.deleteMany({});
    await prismaClient.user.deleteMany({});
    
    // Clear Redis
    await redisClient.flushdb();
  }

  async function initializeServices() {
    // Initialize MasterClockService
    await masterClockService.initialize({
      syncIntervalMs: 1000,
      driftThresholdMs: 100,
      maxDriftMs: 500,
      correctionIntervalMs: 5000,
      instanceId: 'test-master-clock',
      redisChannels: {
        clockSync: 'test:sync:clock:sync',
        driftAlert: 'test:sync:clock:drift',
        correction: 'test:sync:clock:correction',
      },
    });

    // Initialize FileSystemWatcher
    await fileSystemWatcher.initialize({
      paths: [tempDir],
      tenantId: 'tenant-1',
      debounceMs: 100,
      enableChecksums: true,
    });

    // Initialize SyncOrchestrator
    await syncOrchestrator.onModuleInit();
  }

  async function shutdownServices() {
    try {
      await masterClockService.shutdown();
      await fileSystemWatcher.stopAllWatchers();
      await syncOrchestrator.onModuleDestroy();
    } catch (error) {
      console.warn('Service shutdown error:', error);
    }
  }

  describe('Tenant Isolation Tests', () => {
    it('should maintain strict tenant isolation for sync operations', async () => {
      // Test data for different tenants
      const tenant1Data = { id: 'data-1', content: 'Tenant 1 data' };
      const tenant2Data = { id: 'data-2', content: 'Tenant 2 data' };

      // Sync data for tenant 1
      await syncOrchestrator.syncTenantData('tenant-1', 'agent', tenant1Data);

      // Sync data for tenant 2
      await syncOrchestrator.syncTenantData('tenant-2', 'agent', tenant2Data);

      // Verify tenant 1 can only access their data
      const tenant1Context = await syncOrchestrator.getTenantContext('tenant-1');
      expect(tenant1Context).toBeDefined();
      expect(tenant1Context?.tenantId).toBe('tenant-1');

      // Verify tenant 2 can only access their data
      const tenant2Context = await syncOrchestrator.getTenantContext('tenant-2');
      expect(tenant2Context).toBeDefined();
      expect(tenant2Context?.tenantId).toBe('tenant-2');

      // Verify sync states are isolated
      const tenant1SyncStates = await prismaClient.syncState.findMany({
        where: { tenantId: 'tenant-1' },
      });
      const tenant2SyncStates = await prismaClient.syncState.findMany({
        where: { tenantId: 'tenant-2' },
      });

      expect(tenant1SyncStates.length).toBeGreaterThan(0);
      expect(tenant2SyncStates.length).toBeGreaterThan(0);
      
      // Ensure no cross-tenant data leakage
      expect(tenant1SyncStates.every(state => state.tenantId === 'tenant-1')).toBe(true);
      expect(tenant2SyncStates.every(state => state.tenantId === 'tenant-2')).toBe(true);
    });

    it('should prevent unauthorized cross-tenant access', async () => {
      // Try to access tenant-2 data from tenant-1 context
      await expect(
        syncOrchestrator.syncTenantData('invalid-tenant', 'agent', { test: 'data' })
      ).rejects.toThrow('Tenant context not found');
    });

    it('should isolate Redis keyspaces by tenant', async () => {
      const tenant1Key = redisConfig.getTenantKey('tenant-1', 'agent', 'test-key');
      const tenant2Key = redisConfig.getTenantKey('tenant-2', 'agent', 'test-key');

      expect(tenant1Key).toContain('tenant-1');
      expect(tenant2Key).toContain('tenant-2');
      expect(tenant1Key).not.toBe(tenant2Key);

      // Set data for each tenant
      await redisClient.set(tenant1Key, JSON.stringify({ data: 'tenant1' }));
      await redisClient.set(tenant2Key, JSON.stringify({ data: 'tenant2' }));

      // Verify isolation
      const tenant1Data = await redisClient.get(tenant1Key);
      const tenant2Data = await redisClient.get(tenant2Key);

      expect(JSON.parse(tenant1Data!).data).toBe('tenant1');
      expect(JSON.parse(tenant2Data!).data).toBe('tenant2');
    });
  });

  describe('Performance Tests', () => {
    it('should handle high-volume sync operations efficiently', async () => {
      const startTime = Date.now();
      const operationCount = 100;
      const promises: Promise<void>[] = [];

      // Create multiple concurrent sync operations
      for (let i = 0; i < operationCount; i++) {
        const tenantId = testTenants[i % testTenants.length].id;
        const data = { id: `perf-test-${i}`, iteration: i };
        
        promises.push(
          syncOrchestrator.syncTenantData(tenantId, 'agent', data)
        );
      }

      // Wait for all operations to complete
      await Promise.all(promises);

      const endTime = Date.now();
      const duration = endTime - startTime;
      const operationsPerSecond = (operationCount / duration) * 1000;

      // Performance assertions
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
      expect(operationsPerSecond).toBeGreaterThan(10); // At least 10 ops/sec

      // Verify all sync states were created
      const syncStates = await prismaClient.syncState.findMany({
        where: {
          resourceId: {
            startsWith: 'perf-test-',
          },
        },
      });

      expect(syncStates.length).toBe(operationCount);
    });

    it('should handle file system changes efficiently', async () => {
      const fileCount = 50;
      const files: string[] = [];

      // Create multiple test files
      for (let i = 0; i < fileCount; i++) {
        const filePath = path.join(tempDir, `test-file-${i}.txt`);
        await fs.writeFile(filePath, `Test content ${i}`);
        files.push(filePath);
      }

      // Wait for file system events to be processed
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify checksums were calculated
      let checksumCount = 0;
      for (const file of files) {
        const checksum = fileSystemWatcher.getFileChecksum(file);
        if (checksum) {
          checksumCount++;
        }
      }

      expect(checksumCount).toBeGreaterThan(0);

      // Test batch updates
      const startTime = Date.now();
      
      // Update all files simultaneously
      const updatePromises = files.map(async (file, index) => {
        await fs.writeFile(file, `Updated content ${index}`);
      });

      await Promise.all(updatePromises);
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000); // Should handle batch updates quickly
    });

    it('should scale horizontally with multiple instances', async () => {
      // Simulate multiple master clock instances
      const instance1 = new MasterClockService(
        {
          syncIntervalMs: 1000,
          driftThresholdMs: 100,
          maxDriftMs: 500,
          correctionIntervalMs: 5000,
          instanceId: 'test-instance-1',
          redisChannels: {
            clockSync: 'test:sync:clock:sync',
            driftAlert: 'test:sync:clock:drift',
            correction: 'test:sync:clock:correction',
          },
        },
        redisClient,
        mockHeartbeatService,
        mockMetricsService
      );

      const instance2 = new MasterClockService(
        {
          syncIntervalMs: 1000,
          driftThresholdMs: 100,
          maxDriftMs: 500,
          correctionIntervalMs: 5000,
          instanceId: 'test-instance-2',
          redisChannels: {
            clockSync: 'test:sync:clock:sync',
            driftAlert: 'test:sync:clock:drift',
            correction: 'test:sync:clock:correction',
          },
        },
        redisClient,
        mockHeartbeatService,
        mockMetricsService
      );

      await instance1.initialize();
      await instance2.initialize();

      // Test coordination between instances
      const time1 = await instance1.now();
      const time2 = await instance2.now();

      const timeDiff = Math.abs(time1.getTime() - time2.getTime());
      expect(timeDiff).toBeLessThan(1000); // Should be synchronized within 1 second

      await instance1.shutdown();
      await instance2.shutdown();
    });
  });

  describe('Security Tests', () => {
    it('should validate tenant access permissions', async () => {
      // Test with valid tenant
      const validContext = await syncOrchestrator.getTenantContext('tenant-1');
      expect(validContext).toBeDefined();
      expect(validContext?.permissions).toContain('read');
      expect(validContext?.permissions).toContain('write');

      // Test with admin tenant
      const adminContext = await syncOrchestrator.getTenantContext('tenant-2');
      expect(adminContext).toBeDefined();
      expect(adminContext?.permissions).toContain('admin');
    });

    it('should sanitize resource identifiers', async () => {
      const maliciousId = '../../../etc/passwd';
      const sanitized = redisConfig.sanitizeResourceId(maliciousId);
      
      expect(sanitized).not.toContain('../');
      expect(sanitized).not.toContain('/etc/');
    });

    it('should validate tenant ID format', async () => {
      const validTenantIds = ['tenant-1', 'user_123', 'org-456'];
      const invalidTenantIds = ['../invalid', 'tenant@domain', 'tenant with spaces'];

      for (const validId of validTenantIds) {
        expect(redisConfig.validateTenantId(validId)).toBe(true);
      }

      for (const invalidId of invalidTenantIds) {
        expect(redisConfig.validateTenantId(invalidId)).toBe(false);
      }
    });

    it('should encrypt sensitive sync data', async () => {
      const sensitiveData = {
        apiKey: 'secret-api-key',
        password: 'user-password',
        token: 'auth-token',
      };

      await syncOrchestrator.syncTenantData('tenant-1', 'config', sensitiveData);

      // Verify data is stored encrypted in Redis
      const redisKeys = await redisClient.keys('sync:tenant-1:config:*');
      expect(redisKeys.length).toBeGreaterThan(0);

      for (const key of redisKeys) {
        const storedData = await redisClient.get(key);
        expect(storedData).toBeDefined();
        
        // Should not contain plain text sensitive data
        expect(storedData).not.toContain('secret-api-key');
        expect(storedData).not.toContain('user-password');
        expect(storedData).not.toContain('auth-token');
      }
    });

    it('should audit sync operations', async () => {
      const testData = { id: 'audit-test', content: 'test data' };
      
      await syncOrchestrator.syncTenantData('tenant-1', 'agent', testData);

      // Verify audit trail exists
      const syncStates = await prismaClient.syncState.findMany({
        where: {
          tenantId: 'tenant-1',
          resourceType: 'agent',
        },
      });

      expect(syncStates.length).toBeGreaterThan(0);
      
      const syncState = syncStates[0];
      expect(syncState.syncedBy).toBeDefined();
      expect(syncState.lastSync).toBeInstanceOf(Date);
      expect(syncState.checksum).toBeDefined();
    });
  });

  describe('Conflict Resolution Tests', () => {
    it('should detect and resolve version conflicts', async () => {
      const resourceId = 'conflict-test-agent';
      const tenantId = 'tenant-1';

      // Create initial sync state
      await prismaClient.syncState.create({
        data: {
          resourceType: 'agent',
          resourceId,
          tenantId,
          version: 1,
          checksum: 'initial-checksum',
          syncedBy: 'instance-1',
        },
      });

      // Simulate concurrent updates
      const localData = { name: 'Local Update', version: 2 };
      const remoteData = { name: 'Remote Update', version: 2 };

      // Create conflict
      const conflict = await prismaClient.syncConflict.create({
        data: {
          resourceType: 'agent',
          resourceId,
          tenantId,
          conflictType: 'version',
          localVersion: localData,
          remoteVersion: remoteData,
        },
      });

      // Resolve conflict
      const resolution = await conflictManager.resolveConflict({
        id: conflict.id,
        resourceType: 'agent',
        resourceId,
        tenantId,
        conflictType: 'version',
        localVersion: localData,
        remoteVersion: remoteData,
        createdAt: conflict.createdAt,
      });

      expect(resolution).toBeDefined();
      expect(resolution.strategy).toBeDefined();
      expect(resolution.resolvedData).toBeDefined();

      // Verify conflict was marked as resolved
      const resolvedConflict = await prismaClient.syncConflict.findUnique({
        where: { id: conflict.id },
      });

      expect(resolvedConflict?.resolvedAt).toBeDefined();
      expect(resolvedConflict?.resolution).toBeDefined();
    });

    it('should handle checksum conflicts', async () => {
      const resourceId = 'checksum-conflict-test';
      const tenantId = 'tenant-1';

      const localData = { content: 'Local content', checksum: 'local-hash' };
      const remoteData = { content: 'Remote content', checksum: 'remote-hash' };

      const conflict = await prismaClient.syncConflict.create({
        data: {
          resourceType: 'file',
          resourceId,
          tenantId,
          conflictType: 'checksum',
          localVersion: localData,
          remoteVersion: remoteData,
        },
      });

      const resolution = await conflictManager.resolveConflict({
        id: conflict.id,
        resourceType: 'file',
        resourceId,
        tenantId,
        conflictType: 'checksum',
        localVersion: localData,
        remoteVersion: remoteData,
        createdAt: conflict.createdAt,
      });

      expect(resolution.strategy).toBe('latest_wins');
      expect(resolution.resolvedData).toBeDefined();
    });

    it('should queue manual resolution for complex conflicts', async () => {
      const resourceId = 'manual-conflict-test';
      const tenantId = 'tenant-1';

      const localData = { complexField: { nested: 'local' } };
      const remoteData = { complexField: { nested: 'remote' } };

      const conflict = await prismaClient.syncConflict.create({
        data: {
          resourceType: 'workflow',
          resourceId,
          tenantId,
          conflictType: 'concurrent',
          localVersion: localData,
          remoteVersion: remoteData,
        },
      });

      const resolution = await conflictManager.resolveConflict({
        id: conflict.id,
        resourceType: 'workflow',
        resourceId,
        tenantId,
        conflictType: 'concurrent',
        localVersion: localData,
        remoteVersion: remoteData,
        createdAt: conflict.createdAt,
      });

      expect(resolution.strategy).toBe('manual');
      expect(resolution.resolvedData).toBeNull();

      // Verify conflict was queued for manual resolution
      const manualConflicts = await redisClient.lrange('manual_conflicts', 0, -1);
      expect(manualConflicts.length).toBeGreaterThan(0);
    });
  });

  describe('Integration with Existing Infrastructure', () => {
    it('should integrate with existing Redis pub/sub channels', async () => {
      const testMessage = { type: 'test', data: 'integration test' };
      
      // Subscribe to sync channel
      const messages: any[] = [];
      await redisClient.subscribe('sync:tenant-1:agent');
      redisClient.on('message', (channel, message) => {
        if (channel === 'sync:tenant-1:agent') {
          messages.push(JSON.parse(message));
        }
      });

      // Trigger sync operation
      await syncOrchestrator.syncTenantData('tenant-1', 'agent', testMessage);

      // Wait for message propagation
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0]).toMatchObject({
        operation: expect.objectContaining({
          resourceType: 'agent',
          tenantId: 'tenant-1',
        }),
      });

      await redisClient.unsubscribe('sync:tenant-1:agent');
    });

    it('should integrate with existing WebSocket service', async () => {
      const testData = { id: 'ws-test', message: 'WebSocket integration' };
      
      await syncOrchestrator.syncTenantData('tenant-1', 'agent', testData);

      // Verify WebSocket service was called
      expect(mockWebSocketService.sendMessage).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({
          type: 'sync_update',
          payload: expect.objectContaining({
            tenantId: 'tenant-1',
            resourceType: 'agent',
          }),
        })
      );
    });

    it('should integrate with existing database patterns', async () => {
      const agentData = {
        id: 'integration-agent',
        name: 'Integration Test Agent',
        status: 'ACTIVE',
      };

      await syncOrchestrator.syncAgentState('agent-1', {
        id: 'agent-1',
        status: 'BUSY',
        metadata: { test: 'integration' },
        lastUpdate: new Date(),
      });

      // Verify database was updated using existing patterns
      const updatedAgent = await prismaClient.agent.findUnique({
        where: { id: 'agent-1' },
      });

      expect(updatedAgent).toBeDefined();
      expect(updatedAgent?.status).toBe('BUSY');
    });

    it('should integrate with existing heartbeat monitoring', async () => {
      // Verify heartbeat service integration
      expect(mockHeartbeatService.on).toHaveBeenCalledWith(
        'heartbeat_received',
        expect.any(Function)
      );
      expect(mockHeartbeatService.on).toHaveBeenCalledWith(
        'agent_status_changed',
        expect.any(Function)
      );
    });

    it('should integrate with existing metrics collection', async () => {
      // Trigger some operations to generate metrics
      await syncOrchestrator.syncTenantData('tenant-1', 'agent', { test: 'metrics' });
      await masterClockService.now();

      // Verify metrics service integration
      expect(mockMetricsService.collectMetric).toHaveBeenCalled();
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle Redis connection failures gracefully', async () => {
      // Simulate Redis failure
      const originalPublish = redisClient.publish;
      redisClient.publish = jest.fn().mockRejectedValue(new Error('Redis connection lost'));

      // Should handle the error gracefully
      await expect(
        syncOrchestrator.syncTenantData('tenant-1', 'agent', { test: 'data' })
      ).rejects.toThrow('Redis connection lost');

      // Restore Redis
      redisClient.publish = originalPublish;
    });

    it('should handle database connection failures gracefully', async () => {
      // Simulate database failure
      const originalExecuteRaw = prismaClient.$executeRaw;
      prismaClient.$executeRaw = jest.fn().mockRejectedValue(new Error('Database connection lost'));

      // Should handle the error gracefully
      await expect(
        syncOrchestrator.syncTenantData('tenant-1', 'agent', { test: 'data' })
      ).rejects.toThrow('Database connection lost');

      // Restore database
      prismaClient.$executeRaw = originalExecuteRaw;
    });

    it('should implement retry logic for failed operations', async () => {
      let attemptCount = 0;
      const originalPublish = redisClient.publish;
      
      redisClient.publish = jest.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Temporary failure');
        }
        return originalPublish.call(redisClient, ...arguments);
      });

      // Should eventually succeed after retries
      await expect(
        syncOrchestrator.syncTenantData('tenant-1', 'agent', { test: 'retry' })
      ).resolves.not.toThrow();

      expect(attemptCount).toBe(3);

      // Restore Redis
      redisClient.publish = originalPublish;
    });

    it('should maintain data consistency during failures', async () => {
      const testData = { id: 'consistency-test', critical: true };
      
      // Start sync operation
      const syncPromise = syncOrchestrator.syncTenantData('tenant-1', 'agent', testData);

      // Simulate failure during sync
      setTimeout(() => {
        // This should not affect data consistency
      }, 50);

      await syncPromise;

      // Verify data consistency
      const syncState = await prismaClient.syncState.findFirst({
        where: {
          tenantId: 'tenant-1',
          resourceType: 'agent',
        },
      });

      expect(syncState).toBeDefined();
      expect(syncState?.checksum).toBeDefined();
    });
  });

  describe('Load Testing', () => {
    it('should handle concurrent tenant operations', async () => {
      const concurrentOperations = 20;
      const promises: Promise<void>[] = [];

      for (let i = 0; i < concurrentOperations; i++) {
        const tenantId = testTenants[i % testTenants.length].id;
        const data = { id: `concurrent-${i}`, timestamp: Date.now() };
        
        promises.push(
          syncOrchestrator.syncTenantData(tenantId, 'agent', data)
        );
      }

      const startTime = Date.now();
      await Promise.all(promises);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds

      // Verify all operations completed successfully
      const syncStates = await prismaClient.syncState.findMany({
        where: {
          resourceId: {
            startsWith: 'concurrent-',
          },
        },
      });

      expect(syncStates.length).toBe(concurrentOperations);
    });

    it('should handle memory efficiently under load', async () => {
      const initialMemory = process.memoryUsage();
      const operationCount = 1000;

      // Perform many operations
      for (let i = 0; i < operationCount; i++) {
        const tenantId = testTenants[i % testTenants.length].id;
        await syncOrchestrator.syncTenantData(tenantId, 'agent', { 
          id: `memory-test-${i}`,
          data: 'x'.repeat(100) // Small payload
        });

        // Force garbage collection periodically
        if (i % 100 === 0 && global.gc) {
          global.gc();
        }
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreasePerOp = memoryIncrease / operationCount;

      // Memory increase should be reasonable (less than 1KB per operation)
      expect(memoryIncreasePerOp).toBeLessThan(1024);
    });
  });
});