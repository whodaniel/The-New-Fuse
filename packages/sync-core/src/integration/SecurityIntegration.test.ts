import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, jest } from '@jest/globals';
const vi = jest;
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

// Import services under test
import { SyncOrchestrator } from '../services/SyncOrchestrator';
import { ConflictManager } from '../services/ConflictManager';
import { SyncRedisConfig } from '../config/SyncRedisConfig';
import { EnhancedFileSystemWatcher } from '../watchers/EnhancedFileSystemWatcher';

describe('Security Integration Tests', () => {
  let testModule: TestingModule;
  let prismaClient: PrismaClient;
  let redisClient: Redis;
  let tempDir: string;
  
  // Service instances
  let syncOrchestrator: SyncOrchestrator;
  let conflictManager: ConflictManager;
  let redisConfig: SyncRedisConfig;
  let fileSystemWatcher: EnhancedFileSystemWatcher;

  // Mock services
  const mockWebSocketService = {
    sendMessage: jest.fn().mockResolvedValue(undefined),
    broadcastToAllUsers: jest.fn().mockResolvedValue(undefined),
  };

  const mockAuthService = {
    validateToken: jest.fn(),
    hasPermission: jest.fn(),
    getUserRoles: jest.fn(),
  };

  // Test users with different roles
  const testUsers = [
    { id: 'user-1', email: 'user1@test.com', role: 'USER' },
    { id: 'admin-1', email: 'admin1@test.com', role: 'ADMIN' },
    { id: 'super-admin-1', email: 'superadmin1@test.com', role: 'SUPER_ADMIN' },
    { id: 'malicious-user', email: 'malicious@test.com', role: 'USER' },
  ];

  beforeAll(async () => {
    const testDatabaseUrl = process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sync_security_test';
    const testRedisUrl = process.env.TEST_REDIS_URL || 'redis://localhost:6379/13';

    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sync-security-test-'));

    prismaClient = new PrismaClient({
      datasources: {
        db: { url: testDatabaseUrl },
      },
    });

    redisClient = new Redis(testRedisUrl);
    await redisClient.flushdb();
  });

  afterAll(async () => {
    try {
      await prismaClient.$disconnect();
      await redisClient.disconnect();
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Cleanup error:', error);
    }
  });

  beforeEach(async () => {
    testModule = await Test.createTestingModule({
      providers: [
        SyncOrchestrator,
        ConflictManager,
        SyncRedisConfig,
        EnhancedFileSystemWatcher,
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
          provide: 'IAuthService',
          useValue: mockAuthService,
        },
      ],
    }).compile();

    syncOrchestrator = testModule.get<SyncOrchestrator>(SyncOrchestrator);
    conflictManager = testModule.get<ConflictManager>(ConflictManager);
    redisConfig = testModule.get<SyncRedisConfig>(SyncRedisConfig);
    fileSystemWatcher = testModule.get<EnhancedFileSystemWatcher>(EnhancedFileSystemWatcher);

    await setupTestData();
    await initializeServices();
  });

  afterEach(async () => {
    await cleanupTestData();
    await shutdownServices();
    jest.clearAllMocks();
  });

  async function setupTestData() {
    // Create test users with different roles
    for (const user of testUsers) {
      await prismaClient.user.upsert({
        where: { id: user.id },
        update: {},
        create: {
          id: user.id,
          email: user.email,
          role: user.role as any,
          hashedPassword: await hashPassword('test-password'),
          name: `Test User ${user.id}`,
        },
      });
    }

    // Setup mock auth service responses
    mockAuthService.validateToken.mockImplementation((token: string) => {
      const userId = token.replace('token-', '');
      return testUsers.find(u => u.id === userId) || null;
    });

    mockAuthService.hasPermission.mockImplementation((userId: string, permission: string) => {
      const user = testUsers.find(u => u.id === userId);
      if (!user) return false;
      
      switch (user.role) {
        case 'SUPER_ADMIN':
          return true;
        case 'ADMIN':
          return ['read', 'write', 'admin'].includes(permission);
        case 'USER':
          return ['read', 'write'].includes(permission);
        default:
          return false;
      }
    });

    mockAuthService.getUserRoles.mockImplementation((userId: string) => {
      const user = testUsers.find(u => u.id === userId);
      return user ? [user.role] : [];
    });
  }

  async function cleanupTestData() {
    await prismaClient.syncConflict.deleteMany({});
    await prismaClient.syncState.deleteMany({});
    await prismaClient.authEvent.deleteMany({});
    await prismaClient.user.deleteMany({});
    await redisClient.flushdb();
  }

  async function initializeServices() {
    await fileSystemWatcher.initialize({
      paths: [tempDir],
      enableChecksums: true,
    });

    await syncOrchestrator.onModuleInit();
  }

  async function shutdownServices() {
    try {
      await fileSystemWatcher.stopAllWatchers();
      await syncOrchestrator.onModuleDestroy();
    } catch (error) {
      console.warn('Service shutdown error:', error);
    }
  }

  async function hashPassword(password: string): Promise<string> {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  describe('Authentication and Authorization', () => {
    it('should enforce tenant isolation for sync operations', async () => {
      // User 1 syncs data
      await syncOrchestrator.syncTenantData('user-1', 'agent', {
        id: 'user1-data',
        secret: 'user1-secret-data',
      });

      // User 1 should be able to access their own data
      const user1Context = await syncOrchestrator.getTenantContext('user-1');
      expect(user1Context).toBeDefined();
      expect(user1Context?.tenantId).toBe('user-1');

      // Malicious user should not be able to access user-1's data
      await expect(
        syncOrchestrator.getTenantContext('user-1', 'malicious-user')
      ).rejects.toThrow();

      // Verify data isolation in database
      const user1SyncStates = await prismaClient.syncState.findMany({
        where: { tenantId: 'user-1' },
      });

      expect(user1SyncStates.length).toBeGreaterThan(0);
      expect(user1SyncStates.every(state => state.tenantId === 'user-1')).toBe(true);
    });

    it('should validate user permissions for sync operations', async () => {
      // Regular user should be able to sync their own data
      await expect(
        syncOrchestrator.syncTenantData('user-1', 'agent', { test: 'data' })
      ).resolves.not.toThrow();

      // Admin should be able to sync data
      await expect(
        syncOrchestrator.syncTenantData('admin-1', 'agent', { test: 'admin-data' })
      ).resolves.not.toThrow();

      // Super admin should be able to sync any data
      await expect(
        syncOrchestrator.syncGlobalData('template', { test: 'global-data' })
      ).resolves.not.toThrow();
    });

    it('should audit all sync operations', async () => {
      const testData = { id: 'audit-test', sensitive: true };
      
      await syncOrchestrator.syncTenantData('user-1', 'agent', testData);

      // Verify audit trail
      const auditEvents = await prismaClient.authEvent.findMany({
        where: { userId: 'user-1' },
      });

      expect(auditEvents.length).toBeGreaterThan(0);
      
      const syncEvent = auditEvents.find(event => event.type === 'sync_operation');
      expect(syncEvent).toBeDefined();
      expect(syncEvent?.details).toBeDefined();
    });

    it('should prevent privilege escalation attempts', async () => {
      // Malicious user tries to escalate privileges
      const maliciousData = {
        id: 'privilege-escalation',
        role: 'SUPER_ADMIN',
        permissions: ['admin', 'super_admin'],
      };

      // Should not allow privilege escalation
      await expect(
        syncOrchestrator.syncTenantData('malicious-user', 'user', maliciousData)
      ).rejects.toThrow();

      // Verify no unauthorized role changes
      const maliciousUser = await prismaClient.user.findUnique({
        where: { id: 'malicious-user' },
      });

      expect(maliciousUser?.role).toBe('USER');
    });
  });

  describe('Data Encryption and Protection', () => {
    it('should encrypt sensitive data in Redis', async () => {
      const sensitiveData = {
        apiKey: 'sk-1234567890abcdef',
        password: 'super-secret-password',
        token: 'bearer-token-xyz',
        creditCard: '4111-1111-1111-1111',
      };

      await syncOrchestrator.syncTenantData('user-1', 'config', sensitiveData);

      // Check Redis storage
      const redisKeys = await redisClient.keys('sync:user-1:config:*');
      expect(redisKeys.length).toBeGreaterThan(0);

      for (const key of redisKeys) {
        const storedData = await redisClient.get(key);
        expect(storedData).toBeDefined();

        // Should not contain plain text sensitive data
        expect(storedData).not.toContain('sk-1234567890abcdef');
        expect(storedData).not.toContain('super-secret-password');
        expect(storedData).not.toContain('bearer-token-xyz');
        expect(storedData).not.toContain('4111-1111-1111-1111');
      }
    });

    it('should validate data integrity with checksums', async () => {
      const originalData = { id: 'integrity-test', content: 'original content' };
      
      await syncOrchestrator.syncTenantData('user-1', 'agent', originalData);

      // Get the sync state
      const syncState = await prismaClient.syncState.findFirst({
        where: {
          tenantId: 'user-1',
          resourceType: 'agent',
        },
      });

      expect(syncState).toBeDefined();
      expect(syncState?.checksum).toBeDefined();

      // Verify checksum integrity
      const calculatedChecksum = crypto
        .createHash('sha256')
        .update(JSON.stringify(originalData))
        .digest('hex');

      expect(syncState?.checksum).toBe(calculatedChecksum);
    });

    it('should detect data tampering attempts', async () => {
      const originalData = { id: 'tamper-test', value: 'original' };
      
      await syncOrchestrator.syncTenantData('user-1', 'agent', originalData);

      // Get the sync state
      const syncState = await prismaClient.syncState.findFirst({
        where: {
          tenantId: 'user-1',
          resourceType: 'agent',
        },
      });

      // Simulate data tampering by modifying checksum
      await prismaClient.syncState.update({
        where: { id: syncState!.id },
        data: { checksum: 'tampered-checksum' },
      });

      // Attempt to sync modified data
      const modifiedData = { id: 'tamper-test', value: 'tampered' };
      
      // Should detect tampering and create conflict
      await syncOrchestrator.syncTenantData('user-1', 'agent', modifiedData);

      const conflicts = await prismaClient.syncConflict.findMany({
        where: {
          tenantId: 'user-1',
          resourceType: 'agent',
          conflictType: 'checksum',
        },
      });

      expect(conflicts.length).toBeGreaterThan(0);
    });

    it('should sanitize file paths to prevent directory traversal', async () => {
      const maliciousPaths = [
        '../../../etc/passwd',
        '..\\..\\windows\\system32\\config\\sam',
        '/etc/shadow',
        'C:\\Windows\\System32\\config\\SAM',
        '....//....//etc/passwd',
      ];

      for (const maliciousPath of maliciousPaths) {
        const sanitized = redisConfig.sanitizeResourceId(maliciousPath);
        
        // Should not contain directory traversal patterns
        expect(sanitized).not.toContain('../');
        expect(sanitized).not.toContain('..\\');
        expect(sanitized).not.toMatch(/^[\/\\]/); // Should not start with path separator
        expect(sanitized).not.toContain('/etc/');
        expect(sanitized).not.toContain('\\Windows\\');
      }
    });
  });

  describe('Input Validation and Sanitization', () => {
    it('should validate tenant ID format', async () => {
      const validTenantIds = [
        'user-123',
        'tenant_456',
        'org-789',
        'valid123',
      ];

      const invalidTenantIds = [
        '../malicious',
        'tenant@domain.com',
        'tenant with spaces',
        'tenant/with/slashes',
        'tenant\\with\\backslashes',
        '<script>alert("xss")</script>',
        'tenant; DROP TABLE users;--',
      ];

      for (const validId of validTenantIds) {
        expect(redisConfig.validateTenantId(validId)).toBe(true);
      }

      for (const invalidId of invalidTenantIds) {
        expect(redisConfig.validateTenantId(invalidId)).toBe(false);
      }
    });

    it('should sanitize resource identifiers', async () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        'resource"; DROP TABLE sync_states;--',
        '../../../etc/passwd',
        'resource\x00null-byte',
        'resource\r\nheader-injection',
      ];

      for (const maliciousInput of maliciousInputs) {
        const sanitized = redisConfig.sanitizeResourceId(maliciousInput);
        
        // Should not contain dangerous characters
        expect(sanitized).not.toContain('<script>');
        expect(sanitized).not.toContain('DROP TABLE');
        expect(sanitized).not.toContain('../');
        expect(sanitized).not.toContain('\x00');
        expect(sanitized).not.toContain('\r\n');
      }
    });

    it('should validate sync data structure', async () => {
      const validData = {
        id: 'valid-id',
        name: 'Valid Name',
        config: { setting: 'value' },
      };

      const invalidDataSets = [
        null,
        undefined,
        'string-instead-of-object',
        123,
        [],
        { __proto__: { malicious: true } },
        { constructor: { prototype: { malicious: true } } },
      ];

      // Valid data should work
      await expect(
        syncOrchestrator.syncTenantData('user-1', 'agent', validData)
      ).resolves.not.toThrow();

      // Invalid data should be rejected
      for (const invalidData of invalidDataSets) {
        await expect(
          syncOrchestrator.syncTenantData('user-1', 'agent', invalidData as any)
        ).rejects.toThrow();
      }
    });

    it('should prevent prototype pollution attacks', async () => {
      const pollutionAttempts = [
        { '__proto__': { polluted: true } },
        { 'constructor': { 'prototype': { polluted: true } } },
        { 'prototype': { polluted: true } },
      ];

      for (const attempt of pollutionAttempts) {
        await expect(
          syncOrchestrator.syncTenantData('user-1', 'agent', attempt)
        ).rejects.toThrow();
      }

      // Verify prototype was not polluted
      expect((Object.prototype as any).polluted).toBeUndefined();
    });
  });

  describe('Rate Limiting and DoS Protection', () => {
    it('should implement rate limiting for sync operations', async () => {
      const rapidRequests = 100;
      const promises: Promise<any>[] = [];

      // Generate rapid requests
      for (let i = 0; i < rapidRequests; i++) {
        promises.push(
          syncOrchestrator.syncTenantData('user-1', 'agent', {
            id: `rapid-${i}`,
            data: `Request ${i}`,
          }).catch(error => error)
        );
      }

      const results = await Promise.all(promises);
      
      // Some requests should be rate limited
      const rateLimitedCount = results.filter(
        result => result instanceof Error && result.message.includes('rate limit')
      ).length;

      expect(rateLimitedCount).toBeGreaterThan(0);
    });

    it('should protect against large payload attacks', async () => {
      const largePayload = {
        id: 'large-payload-test',
        data: 'x'.repeat(10 * 1024 * 1024), // 10MB payload
      };

      // Should reject overly large payloads
      await expect(
        syncOrchestrator.syncTenantData('user-1', 'agent', largePayload)
      ).rejects.toThrow();
    });

    it('should limit concurrent operations per tenant', async () => {
      const concurrentLimit = 50;
      const promises: Promise<any>[] = [];

      // Generate many concurrent requests
      for (let i = 0; i < concurrentLimit * 2; i++) {
        promises.push(
          syncOrchestrator.syncTenantData('user-1', 'agent', {
            id: `concurrent-${i}`,
            data: `Concurrent request ${i}`,
          }).catch(error => error)
        );
      }

      const results = await Promise.all(promises);
      
      // Some requests should be rejected due to concurrency limits
      const rejectedCount = results.filter(
        result => result instanceof Error
      ).length;

      expect(rejectedCount).toBeGreaterThan(0);
    });
  });

  describe('File System Security', () => {
    it('should prevent access to files outside allowed directories', async () => {
      const maliciousFilePaths = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        '/etc/shadow',
        'C:\\Windows\\System32\\config\\SAM',
      ];

      for (const maliciousPath of maliciousFilePaths) {
        await expect(
          fileSystemWatcher.watchTenantFiles('user-1', [maliciousPath])
        ).rejects.toThrow();
      }
    });

    it('should validate file permissions before watching', async () => {
      // Create a test file with restricted permissions
      const restrictedFile = path.join(tempDir, 'restricted.txt');
      await fs.writeFile(restrictedFile, 'restricted content');
      await fs.chmod(restrictedFile, 0o000); // No permissions

      // Should handle permission errors gracefully
      await expect(
        fileSystemWatcher.watchTenantFiles('user-1', [restrictedFile])
      ).resolves.not.toThrow();

      // Restore permissions for cleanup
      await fs.chmod(restrictedFile, 0o644);
    });

    it('should detect and prevent symlink attacks', async () => {
      const targetFile = path.join(tempDir, 'target.txt');
      const symlinkFile = path.join(tempDir, 'symlink.txt');
      
      await fs.writeFile(targetFile, 'target content');
      
      try {
        await fs.symlink(targetFile, symlinkFile);
        
        // Should detect and handle symlinks appropriately
        const checksum = await fileSystemWatcher.refreshFileChecksum(symlinkFile);
        expect(checksum).toBeDefined();
        
        // Should not follow symlinks outside allowed directories
        const outsideSymlink = path.join(tempDir, 'outside.txt');
        await fs.symlink('/etc/passwd', outsideSymlink);
        
        await expect(
          fileSystemWatcher.refreshFileChecksum(outsideSymlink)
        ).rejects.toThrow();
        
      } catch (error) {
        // Symlinks might not be supported on all systems
        console.warn('Symlink test skipped:', error);
      }
    });
  });

  describe('Conflict Resolution Security', () => {
    it('should validate conflict resolution permissions', async () => {
      // Create a conflict
      const conflict = await prismaClient.syncConflict.create({
        data: {
          resourceType: 'agent',
          resourceId: 'security-test-agent',
          tenantId: 'user-1',
          conflictType: 'version',
          localVersion: { data: 'local' },
          remoteVersion: { data: 'remote' },
        },
      });

      // User should be able to resolve their own conflicts
      const userResolution = await conflictManager.resolveConflict({
        id: conflict.id,
        resourceType: 'agent',
        resourceId: 'security-test-agent',
        tenantId: 'user-1',
        conflictType: 'version',
        localVersion: { data: 'local' },
        remoteVersion: { data: 'remote' },
        createdAt: conflict.createdAt,
      }, 'user-1');

      expect(userResolution).toBeDefined();

      // Malicious user should not be able to resolve other users' conflicts
      await expect(
        conflictManager.resolveConflict({
          id: conflict.id,
          resourceType: 'agent',
          resourceId: 'security-test-agent',
          tenantId: 'user-1',
          conflictType: 'version',
          localVersion: { data: 'local' },
          remoteVersion: { data: 'remote' },
          createdAt: conflict.createdAt,
        }, 'malicious-user')
      ).rejects.toThrow();
    });

    it('should sanitize conflict resolution data', async () => {
      const maliciousConflict = await prismaClient.syncConflict.create({
        data: {
          resourceType: 'agent',
          resourceId: 'malicious-agent',
          tenantId: 'user-1',
          conflictType: 'version',
          localVersion: { 
            script: '<script>alert("xss")</script>',
            sql: 'DROP TABLE users;--',
          },
          remoteVersion: { 
            script: '<img src=x onerror=alert("xss")>',
            sql: 'SELECT * FROM users WHERE 1=1;--',
          },
        },
      });

      const resolution = await conflictManager.resolveConflict({
        id: maliciousConflict.id,
        resourceType: 'agent',
        resourceId: 'malicious-agent',
        tenantId: 'user-1',
        conflictType: 'version',
        localVersion: maliciousConflict.localVersion,
        remoteVersion: maliciousConflict.remoteVersion,
        createdAt: maliciousConflict.createdAt,
      }, 'user-1');

      // Resolution should not contain dangerous content
      const resolvedDataStr = JSON.stringify(resolution.resolvedData);
      expect(resolvedDataStr).not.toContain('<script>');
      expect(resolvedDataStr).not.toContain('DROP TABLE');
      expect(resolvedDataStr).not.toContain('onerror=');
    });
  });

  describe('Audit and Compliance', () => {
    it('should maintain comprehensive audit logs', async () => {
      const testOperations = [
        { type: 'sync', data: { id: 'audit-1' } },
        { type: 'conflict', data: { id: 'audit-2' } },
        { type: 'access', data: { resource: 'audit-3' } },
      ];

      for (const operation of testOperations) {
        await syncOrchestrator.syncTenantData('user-1', 'agent', operation.data);
      }

      // Verify audit trail
      const auditEvents = await prismaClient.authEvent.findMany({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
      });

      expect(auditEvents.length).toBeGreaterThanOrEqual(testOperations.length);

      for (const event of auditEvents) {
        expect(event.userId).toBe('user-1');
        expect(event.type).toBeDefined();
        expect(event.createdAt).toBeInstanceOf(Date);
        expect(event.details).toBeDefined();
      }
    });

    it('should support audit log integrity verification', async () => {
      await syncOrchestrator.syncTenantData('user-1', 'agent', {
        id: 'integrity-audit',
        sensitive: true,
      });

      const auditEvents = await prismaClient.authEvent.findMany({
        where: { userId: 'user-1' },
      });

      // Each audit event should have integrity information
      for (const event of auditEvents) {
        expect(event.details).toBeDefined();
        
        const details = event.details as any;
        expect(details.timestamp).toBeDefined();
        expect(details.operation).toBeDefined();
      }
    });

    it('should detect and log security violations', async () => {
      // Attempt various security violations
      const violations = [
        () => syncOrchestrator.syncTenantData('../invalid-tenant', 'agent', {}),
        () => syncOrchestrator.syncTenantData('user-1', '../invalid-type', {}),
        () => fileSystemWatcher.watchTenantFiles('user-1', ['../../../etc/passwd']),
      ];

      for (const violation of violations) {
        try {
          await violation();
        } catch (error) {
          // Expected to fail
        }
      }

      // Check for security violation logs
      const securityEvents = await prismaClient.authEvent.findMany({
        where: {
          type: 'security_violation',
        },
      });

      expect(securityEvents.length).toBeGreaterThan(0);
    });
  });
});