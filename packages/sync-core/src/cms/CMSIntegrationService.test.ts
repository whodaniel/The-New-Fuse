/**
 * CMS Integration Service Tests
 * 
 * Comprehensive tests for the CMS integration system including
 * personal content management, project configuration sync,
 * collaborative content sharing, and private data isolation.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
const vi = jest;
import { PrismaClient, UserRole } from '@the-new-fuse/database/generated/prisma';
import { CMSIntegrationService } from './CMSIntegrationService';
import { RedisService } from '../config/SyncRedisConfig';
import { SyncOrchestrator } from '../services/SyncOrchestrator';
import { EnhancedFileSystemWatcher } from '../watchers/EnhancedFileSystemWatcher';
import { 
  ContentType, 
  PrivacyLevel, 
  Permission,
  CMSConfig
} from './types';

// Mock dependencies
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  },
  authEvent: {
    create: jest.fn()
  },
  $executeRaw: jest.fn(),
  $queryRaw: jest.fn()
} as unknown as PrismaClient;

const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  setex: jest.fn(),
  del: jest.fn(),
  keys: jest.fn(),
  publish: jest.fn(),
  subscribe: jest.fn()
} as unknown as RedisService;

const mockSyncOrchestrator = {
  syncTenantData: jest.fn(),
  syncGlobalData: jest.fn()
} as unknown as SyncOrchestrator;

const mockFileWatcher = {
  onFileChange: jest.fn(),
  watchTenantFiles: jest.fn(),
  watchGlobalFiles: jest.fn()
} as unknown as EnhancedFileSystemWatcher;

describe('CMSIntegrationService', () => {
  let cmsService: CMSIntegrationService;
  let testConfig: CMSConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    
    testConfig = {
      enablePersonalContent: true,
      enableProjectSync: true,
      enableCollaboration: true,
      defaultPrivacy: PrivacyLevel.PRIVATE,
      maxContentSize: 1024 * 1024, // 1MB
      allowedContentTypes: [ContentType.DOCUMENT, ContentType.TEMPLATE],
      syncInterval: 10000 // 10 seconds
    };

    cmsService = new CMSIntegrationService(
      mockPrisma,
      mockRedis,
      mockSyncOrchestrator,
      mockFileWatcher,
      testConfig
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize CMS integration service successfully', async () => {
      // Mock database table creation
      mockPrisma.$executeRaw = jest.fn().mockResolvedValue(undefined);
      
      // Mock Redis subscription
      mockRedis.subscribe = jest.fn().mockResolvedValue(undefined);
      
      // Mock file watcher setup
      mockFileWatcher.onFileChange = jest.fn();

      await cmsService.initialize();

      // Verify database tables were created
      expect(mockPrisma.$executeRaw).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS personal_content')
      );
      expect(mockPrisma.$executeRaw).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS project_configurations')
      );

      // Verify event listeners were set up
      expect(mockRedis.subscribe).toHaveBeenCalledWith('cms_events', expect.any(Function));
      expect(mockRedis.subscribe).toHaveBeenCalledWith('privacy_events', expect.any(Function));

      // Verify file watcher was configured
      expect(mockFileWatcher.onFileChange).toHaveBeenCalled();
    });

    it('should handle initialization errors gracefully', async () => {
      mockPrisma.$executeRaw = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(cmsService.initialize()).rejects.toThrow('Database error');
    });
  });

  describe('Personal Content Management', () => {
    beforeEach(async () => {
      // Mock successful initialization
      mockPrisma.$executeRaw = jest.fn().mockResolvedValue(undefined);
      mockRedis.subscribe = jest.fn().mockResolvedValue(undefined);
      mockFileWatcher.onFileChange = jest.fn();
      
      await cmsService.initialize();
    });

    it('should create personal content successfully', async () => {
      const userId = 'user-123';
      const contentData = {
        type: ContentType.DOCUMENT,
        title: 'Test Document',
        content: 'This is test content',
        metadata: { tags: ['test'] },
        privacy: PrivacyLevel.PRIVATE,
        sharingSettings: {
          isPublic: false,
          allowedUsers: [],
          allowedRoles: [],
          permissions: []
        }
      };

      // Mock user validation
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue({
        id: userId,
        role: UserRole.USER,
        roles: [UserRole.USER],
        isActive: true
      });

      // Mock content creation
      mockPrisma.$executeRaw = jest.fn().mockResolvedValue(undefined);
      mockSyncOrchestrator.syncTenantData = jest.fn().mockResolvedValue(undefined);
      mockPrisma.authEvent.create = jest.fn().mockResolvedValue(undefined);
      mockRedis.publish = jest.fn().mockResolvedValue(undefined);

      const result = await cmsService.createPersonalContent(userId, contentData);

      expect(result).toMatchObject({
        type: ContentType.DOCUMENT,
        title: 'Test Document',
        content: 'This is test content',
        ownerId: userId,
        privacy: PrivacyLevel.PRIVATE
      });

      // Verify sync was triggered
      expect(mockSyncOrchestrator.syncTenantData).toHaveBeenCalledWith(
        userId,
        'personal_content',
        expect.any(Object)
      );

      // Verify audit event was created
      expect(mockPrisma.authEvent.create).toHaveBeenCalled();
    });

    it('should validate content size limits', async () => {
      const userId = 'user-123';
      const largeContent = 'x'.repeat(testConfig.maxContentSize + 1);
      
      const contentData = {
        type: ContentType.DOCUMENT,
        title: 'Large Document',
        content: largeContent,
        metadata: { tags: [] },
        privacy: PrivacyLevel.PRIVATE,
        sharingSettings: {
          isPublic: false,
          allowedUsers: [],
          allowedRoles: [],
          permissions: []
        }
      };

      mockPrisma.user.findUnique = jest.fn().mockResolvedValue({
        id: userId,
        role: UserRole.USER,
        isActive: true
      });

      await expect(cmsService.createPersonalContent(userId, contentData))
        .rejects.toThrow('Content size exceeds maximum allowed size');
    });

    it('should validate allowed content types', async () => {
      const userId = 'user-123';
      const contentData = {
        type: ContentType.MEDIA, // Not in allowed types
        title: 'Media File',
        content: 'media content',
        metadata: { tags: [] },
        privacy: PrivacyLevel.PRIVATE,
        sharingSettings: {
          isPublic: false,
          allowedUsers: [],
          allowedRoles: [],
          permissions: []
        }
      };

      mockPrisma.user.findUnique = jest.fn().mockResolvedValue({
        id: userId,
        role: UserRole.USER,
        isActive: true
      });

      await expect(cmsService.createPersonalContent(userId, contentData))
        .rejects.toThrow('Content type media is not allowed');
    });
  });

  describe('Project Configuration Sync', () => {
    beforeEach(async () => {
      mockPrisma.$executeRaw = jest.fn().mockResolvedValue(undefined);
      mockRedis.subscribe = jest.fn().mockResolvedValue(undefined);
      mockFileWatcher.onFileChange = jest.fn();
      
      await cmsService.initialize();
    });

    it('should create project configuration successfully', async () => {
      const userId = 'user-123';
      const projectData = {
        name: 'Test Project',
        description: 'A test project',
        config: { setting1: 'value1', setting2: 'value2' },
        privacy: PrivacyLevel.PRIVATE,
        collaborators: [],
        syncSettings: {
          enabled: true,
          frequency: 'real_time' as any,
          conflictResolution: 'last_write_wins' as any,
          backupEnabled: true,
          versionHistory: true
        }
      };

      mockPrisma.user.findUnique = jest.fn().mockResolvedValue({
        id: userId,
        role: UserRole.USER,
        roles: [UserRole.USER],
        isActive: true
      });

      mockPrisma.$executeRaw = jest.fn().mockResolvedValue(undefined);
      mockSyncOrchestrator.syncTenantData = jest.fn().mockResolvedValue(undefined);
      mockPrisma.authEvent.create = jest.fn().mockResolvedValue(undefined);
      mockRedis.publish = jest.fn().mockResolvedValue(undefined);
      mockFileWatcher.watchTenantFiles = jest.fn();

      const result = await cmsService.createProjectConfiguration(userId, projectData);

      expect(result).toMatchObject({
        name: 'Test Project',
        description: 'A test project',
        ownerId: userId,
        privacy: PrivacyLevel.PRIVATE
      });

      // Verify sync was triggered
      expect(mockSyncOrchestrator.syncTenantData).toHaveBeenCalled();

      // Verify file watching was set up
      expect(mockFileWatcher.watchTenantFiles).toHaveBeenCalled();
    });

    it('should validate project configuration size', async () => {
      const userId = 'user-123';
      const largeConfig = {};
      for (let i = 0; i < 10000; i++) {
        largeConfig[`key${i}`] = 'x'.repeat(1000);
      }

      const projectData = {
        name: 'Large Project',
        description: 'A project with large config',
        config: largeConfig,
        privacy: PrivacyLevel.PRIVATE,
        collaborators: [],
        syncSettings: {
          enabled: true,
          frequency: 'real_time' as any,
          conflictResolution: 'last_write_wins' as any,
          backupEnabled: true,
          versionHistory: true
        }
      };

      mockPrisma.user.findUnique = jest.fn().mockResolvedValue({
        id: userId,
        role: UserRole.USER,
        isActive: true
      });

      await expect(cmsService.createProjectConfiguration(userId, projectData))
        .rejects.toThrow('Configuration size exceeds maximum allowed size');
    });
  });

  describe('Collaborative Content Sharing', () => {
    beforeEach(async () => {
      mockPrisma.$executeRaw = jest.fn().mockResolvedValue(undefined);
      mockRedis.subscribe = jest.fn().mockResolvedValue(undefined);
      mockFileWatcher.onFileChange = jest.fn();
      
      await cmsService.initialize();
    });

    it('should share content successfully', async () => {
      const ownerId = 'owner-123';
      const targetUserId = 'target-456';
      const contentId = 'content-789';
      const permissions = [Permission.READ, Permission.WRITE];

      // Mock content exists and is owned by user
      mockPrisma.$queryRaw = jest.fn().mockResolvedValue([{
        id: contentId,
        owner_id: ownerId,
        privacy: 'shared',
        content: 'test content',
        metadata: '{}',
        sharing_settings: '{"isPublic": false, "permissions": []}'
      }]);

      mockRedis.get = jest.fn().mockResolvedValue(null);
      mockRedis.setex = jest.fn().mockResolvedValue(undefined);

      // Mock target user exists
      mockPrisma.user.findUnique = jest.fn()
        .mockResolvedValueOnce({ // For content validation
          id: ownerId,
          role: UserRole.USER,
          isActive: true
        })
        .mockResolvedValueOnce({ // For target user validation
          id: targetUserId,
          role: UserRole.USER,
          roles: [UserRole.USER],
          isActive: true
        });

      mockPrisma.$executeRaw = jest.fn().mockResolvedValue(undefined);
      mockSyncOrchestrator.syncTenantData = jest.fn().mockResolvedValue(undefined);
      mockRedis.publish = jest.fn().mockResolvedValue(undefined);
      mockPrisma.authEvent.create = jest.fn().mockResolvedValue(undefined);

      await cmsService.shareContent(ownerId, contentId, targetUserId, permissions);

      // Verify sharing permission was stored
      expect(mockPrisma.$executeRaw).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO content_sharing_permissions')
      );

      // Verify sync was triggered
      expect(mockSyncOrchestrator.syncTenantData).toHaveBeenCalledWith(
        targetUserId,
        'content_shared',
        expect.any(Object)
      );

      // Verify notification was sent
      expect(mockRedis.publish).toHaveBeenCalledWith(
        `user_notifications:${targetUserId}`,
        expect.any(String)
      );
    });

    it('should prevent sharing private content', async () => {
      const ownerId = 'owner-123';
      const targetUserId = 'target-456';
      const contentId = 'content-789';
      const permissions = [Permission.READ];

      // Mock private content
      mockPrisma.$queryRaw = jest.fn().mockResolvedValue([{
        id: contentId,
        owner_id: ownerId,
        privacy: 'private',
        content: 'private content',
        metadata: '{}',
        sharing_settings: '{"isPublic": false, "permissions": []}'
      }]);

      mockRedis.get = jest.fn().mockResolvedValue(null);

      mockPrisma.user.findUnique = jest.fn()
        .mockResolvedValueOnce({
          id: ownerId,
          role: UserRole.USER,
          isActive: true
        })
        .mockResolvedValueOnce({
          id: targetUserId,
          role: UserRole.USER,
          isActive: true
        });

      await expect(cmsService.shareContent(ownerId, contentId, targetUserId, permissions))
        .rejects.toThrow('Cannot share private content');
    });

    it('should add project collaborator successfully', async () => {
      const ownerId = 'owner-123';
      const collaboratorUserId = 'collaborator-456';
      const projectId = 'project-789';
      const role = UserRole.AGENCY_MANAGER;
      const permissions = [Permission.READ, Permission.WRITE];

      // Mock project exists and is owned by user
      mockPrisma.$queryRaw = jest.fn().mockResolvedValue([{
        id: projectId,
        owner_id: ownerId,
        name: 'Test Project',
        config: '{}',
        collaborators: '[]',
        sync_settings: '{}'
      }]);

      mockRedis.get = jest.fn().mockResolvedValue(null);

      mockPrisma.user.findUnique = jest.fn()
        .mockResolvedValueOnce({ // For project validation
          id: ownerId,
          role: UserRole.ADMIN,
          isActive: true
        })
        .mockResolvedValueOnce({ // For collaborator validation
          id: collaboratorUserId,
          role: UserRole.USER,
          isActive: true
        })
        .mockResolvedValueOnce({ // For role validation
          id: ownerId,
          role: UserRole.ADMIN,
          roles: [UserRole.ADMIN]
        });

      mockPrisma.$executeRaw = jest.fn().mockResolvedValue(undefined);
      mockSyncOrchestrator.syncTenantData = jest.fn().mockResolvedValue(undefined);
      mockRedis.publish = jest.fn().mockResolvedValue(undefined);
      mockPrisma.authEvent.create = jest.fn().mockResolvedValue(undefined);

      await cmsService.addProjectCollaborator(ownerId, projectId, collaboratorUserId, role, permissions);

      // Verify collaborator was added
      expect(mockPrisma.$executeRaw).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE project_configurations')
      );

      // Verify sync was triggered
      expect(mockSyncOrchestrator.syncTenantData).toHaveBeenCalledWith(
        collaboratorUserId,
        'project_collaboration',
        expect.any(Object)
      );

      // Verify notification was sent
      expect(mockRedis.publish).toHaveBeenCalledWith(
        `user_notifications:${collaboratorUserId}`,
        expect.any(String)
      );
    });
  });

  describe('Privacy and Data Isolation', () => {
    beforeEach(async () => {
      mockPrisma.$executeRaw = jest.fn().mockResolvedValue(undefined);
      mockRedis.subscribe = jest.fn().mockResolvedValue(undefined);
      mockFileWatcher.onFileChange = jest.fn();
      
      await cmsService.initialize();
    });

    it('should audit privacy compliance successfully', async () => {
      const tenantId = 'tenant-123';

      // Mock audit queries
      mockPrisma.$queryRaw = jest.fn()
        .mockResolvedValueOnce([{ // Personal content audit
          total_content: 10,
          private_content: 8,
          public_content: 1,
          shared_content: 1
        }])
        .mockResolvedValueOnce([{ // Project configurations audit
          total_projects: 5,
          private_projects: 4,
          collaborative_projects: 1
        }])
        .mockResolvedValueOnce([{ // Collaborative content audit
          total_permissions: 3,
          expired_permissions: 0
        }])
        .mockResolvedValueOnce([]) // Privacy boundary violations
        .mockResolvedValueOnce([]) // Sharing violations
        .mockResolvedValueOnce([]) // Sync violations
        .mockResolvedValueOnce([]) // Orphaned data
        .mockResolvedValueOnce([]); // Weak privacy settings

      mockRedis.get = jest.fn().mockResolvedValue(null);
      mockRedis.setex = jest.fn().mockResolvedValue(undefined);
      mockPrisma.authEvent.create = jest.fn().mockResolvedValue(undefined);

      const auditResult = await cmsService.auditPrivacyCompliance(tenantId);

      expect(auditResult).toMatchObject({
        compliant: true,
        violations: [],
        recommendations: [],
        details: {
          personalContent: {
            total_content: 10,
            private_content: 8,
            public_content: 1,
            shared_content: 1
          },
          projectConfigurations: {
            total_projects: 5,
            private_projects: 4,
            collaborative_projects: 1
          },
          collaborativeContent: {
            total_permissions: 3,
            expired_permissions: 0
          }
        }
      });

      // Verify audit was logged
      expect(mockPrisma.authEvent.create).toHaveBeenCalledWith({
        data: {
          userId: 'system',
          type: 'PRIVACY_AUDIT',
          details: expect.any(Object)
        }
      });
    });
  });

  describe('User Content Retrieval', () => {
    beforeEach(async () => {
      mockPrisma.$executeRaw = jest.fn().mockResolvedValue(undefined);
      mockRedis.subscribe = jest.fn().mockResolvedValue(undefined);
      mockFileWatcher.onFileChange = jest.fn();
      
      await cmsService.initialize();
    });

    it('should retrieve user content across all CMS features', async () => {
      const userId = 'user-123';

      // Mock personal content
      mockPrisma.$queryRaw = jest.fn()
        .mockResolvedValueOnce([{ // Personal content
          id: 'content-1',
          type: 'document',
          title: 'Personal Doc',
          content: 'content',
          metadata: '{}',
          owner_id: userId,
          tenant_id: userId,
          privacy: 'private',
          sharing_settings: '{}',
          created_at: new Date(),
          updated_at: new Date(),
          version: 1,
          checksum: 'abc123'
        }])
        .mockResolvedValueOnce([{ // Shared content
          id: 'content-2',
          type: 'document',
          title: 'Shared Doc',
          content: 'shared content',
          metadata: '{}',
          owner_id: 'other-user',
          tenant_id: 'other-user',
          privacy: 'shared',
          sharing_settings: '{"permissions": [{"userId": "' + userId + '", "permissions": ["read"]}]}',
          created_at: new Date(),
          updated_at: new Date(),
          version: 1,
          checksum: 'def456',
          shared_permissions: '["read"]'
        }])
        .mockResolvedValueOnce([{ // Collaborative projects
          id: 'project-1',
          name: 'Collaborative Project',
          description: 'A shared project',
          config: '{}',
          owner_id: 'other-user',
          tenant_id: 'other-user',
          privacy: 'shared',
          collaborators: `[{"userId": "${userId}", "role": "USER", "permissions": ["read"]}]`,
          sync_settings: '{}',
          created_at: new Date(),
          updated_at: new Date(),
          version: 1
        }]);

      mockRedis.get = jest.fn().mockResolvedValue(null);
      mockRedis.setex = jest.fn().mockResolvedValue(undefined);

      const result = await cmsService.getUserContent(userId);

      expect(result).toMatchObject({
        personalContent: expect.arrayContaining([
          expect.objectContaining({
            id: 'content-1',
            title: 'Personal Doc',
            ownerId: userId
          })
        ]),
        sharedContent: expect.arrayContaining([
          expect.objectContaining({
            id: 'content-2',
            title: 'Shared Doc'
          })
        ]),
        collaborativeProjects: expect.arrayContaining([
          expect.objectContaining({
            id: 'project-1',
            name: 'Collaborative Project'
          })
        ])
      });
    });
  });

  describe('CMS Data Synchronization', () => {
    beforeEach(async () => {
      mockPrisma.$executeRaw = jest.fn().mockResolvedValue(undefined);
      mockRedis.subscribe = jest.fn().mockResolvedValue(undefined);
      mockFileWatcher.onFileChange = jest.fn();
      
      await cmsService.initialize();
    });

    it('should sync all CMS data for a user', async () => {
      const userId = 'user-123';

      // Mock user's collaborative projects
      mockPrisma.$queryRaw = jest.fn().mockResolvedValue([{
        id: 'project-1',
        name: 'Test Project',
        description: 'A test project',
        config: '{}',
        owner_id: userId,
        tenant_id: userId,
        privacy: 'private',
        collaborators: '[]',
        sync_settings: '{}',
        created_at: new Date(),
        updated_at: new Date(),
        version: 1
      }]);

      mockSyncOrchestrator.syncTenantData = jest.fn().mockResolvedValue(undefined);
      mockRedis.publish = jest.fn().mockResolvedValue(undefined);
      mockPrisma.authEvent.create = jest.fn().mockResolvedValue(undefined);

      await cmsService.syncUserCMSData(userId);

      // Verify sync operations were called
      expect(mockSyncOrchestrator.syncTenantData).toHaveBeenCalled();

      // Verify sync completion event was emitted
      expect(mockRedis.publish).toHaveBeenCalledWith(
        'cms_events',
        expect.stringContaining('SYNC_COMPLETED')
      );
    });

    it('should handle sync errors gracefully', async () => {
      const userId = 'user-123';

      mockPrisma.$queryRaw = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(cmsService.syncUserCMSData(userId)).rejects.toThrow('Database error');
    });
  });

  describe('Error Handling', () => {
    it('should throw error when not initialized', async () => {
      const uninitializedService = new CMSIntegrationService(
        mockPrisma,
        mockRedis,
        mockSyncOrchestrator,
        mockFileWatcher
      );

      await expect(uninitializedService.createPersonalContent('user-123', {
        type: ContentType.DOCUMENT,
        title: 'Test',
        content: 'content',
        metadata: {},
        privacy: PrivacyLevel.PRIVATE,
        sharingSettings: {
          isPublic: false,
          allowedUsers: [],
          allowedRoles: [],
          permissions: []
        }
      })).rejects.toThrow('CMS Integration Service not initialized');
    });

    it('should handle invalid user scenarios', async () => {
      mockPrisma.$executeRaw = jest.fn().mockResolvedValue(undefined);
      mockRedis.subscribe = jest.fn().mockResolvedValue(undefined);
      mockFileWatcher.onFileChange = jest.fn();
      
      await cmsService.initialize();

      // Mock user not found
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(null);

      await expect(cmsService.createPersonalContent('invalid-user', {
        type: ContentType.DOCUMENT,
        title: 'Test',
        content: 'content',
        metadata: {},
        privacy: PrivacyLevel.PRIVATE,
        sharingSettings: {
          isPublic: false,
          allowedUsers: [],
          allowedRoles: [],
          permissions: []
        }
      })).rejects.toThrow('User not found or inactive');
    });

    it('should handle inactive user scenarios', async () => {
      mockPrisma.$executeRaw = jest.fn().mockResolvedValue(undefined);
      mockRedis.subscribe = jest.fn().mockResolvedValue(undefined);
      mockFileWatcher.onFileChange = jest.fn();
      
      await cmsService.initialize();

      // Mock inactive user
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue({
        id: 'user-123',
        role: UserRole.USER,
        isActive: false
      });

      await expect(cmsService.createPersonalContent('user-123', {
        type: ContentType.DOCUMENT,
        title: 'Test',
        content: 'content',
        metadata: {},
        privacy: PrivacyLevel.PRIVATE,
        sharingSettings: {
          isPublic: false,
          allowedUsers: [],
          allowedRoles: [],
          permissions: []
        }
      })).rejects.toThrow('User not found or inactive');
    });
  });
});