/**
 * CMS Integration Service
 * 
 * Main orchestration service for Content Management System integration.
 * Coordinates personal content management, project configuration sync,
 * collaborative content sharing, and private data isolation using
 * existing user and tenant systems.
 */

import { PrismaClient, User, UserRole } from '@prisma/client';
import { RedisService } from '../config/SyncRedisConfig';
import { SyncOrchestrator } from '../services/SyncOrchestrator';
import { EnhancedFileSystemWatcher } from '../watchers/EnhancedFileSystemWatcher';
import { PersonalContentManager } from './PersonalContentManager';
import { ProjectConfigurationSync } from './ProjectConfigurationSync';
import { CollaborativeContentService } from './CollaborativeContentService';
import { PrivateDataIsolationService } from './PrivateDataIsolationService';
import { 
  CMSConfig,
  ContentItem,
  ProjectConfiguration,
  ContentType,
  PrivacyLevel,
  Permission,
  CMSEvent,
  CMSEventType
} from './types';

export class CMSIntegrationService {
  private prisma: PrismaClient;
  private redis: RedisService;
  private syncOrchestrator: SyncOrchestrator;
  private fileWatcher: EnhancedFileSystemWatcher;
  
  private personalContentManager: PersonalContentManager;
  private projectConfigSync: ProjectConfigurationSync;
  private collaborativeContentService: CollaborativeContentService;
  private privateDataIsolationService: PrivateDataIsolationService;
  
  private config: CMSConfig;
  private initialized: boolean = false;

  constructor(
    prisma: PrismaClient,
    redis: RedisService,
    syncOrchestrator: SyncOrchestrator,
    fileWatcher: EnhancedFileSystemWatcher,
    config?: Partial<CMSConfig>
  ) {
    this.prisma = prisma;
    this.redis = redis;
    this.syncOrchestrator = syncOrchestrator;
    this.fileWatcher = fileWatcher;
    
    // Set default configuration
    this.config = {
      enablePersonalContent: true,
      enableProjectSync: true,
      enableCollaboration: true,
      defaultPrivacy: PrivacyLevel.PRIVATE,
      maxContentSize: 10 * 1024 * 1024, // 10MB
      allowedContentTypes: Object.values(ContentType),
      syncInterval: 30000, // 30 seconds
      ...config
    };

    // Initialize component services
    this.initializeServices();
  }

  /**
   * Initialize the CMS integration system
   * Requirement 13.1, 13.2, 13.3, 13.4: Complete CMS integration setup
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Create necessary database tables if they don't exist
      await this.createDatabaseTables();

      // Set up event listeners
      await this.setupEventListeners();

      // Initialize file watching for configuration files
      await this.initializeFileWatching();

      // Start periodic sync processes
      await this.startPeriodicSync();

      this.initialized = true;

      console.log('CMS Integration Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize CMS Integration Service:', error);
      throw error;
    }
  }

  /**
   * Create personal content with full CMS integration
   * Requirement 13.1: Personal content management using existing User and tenant models
   */
  async createPersonalContent(
    userId: string,
    content: Omit<ContentItem, 'id' | 'ownerId' | 'createdAt' | 'updatedAt' | 'version' | 'checksum'>
  ): Promise<ContentItem> {
    this.ensureInitialized();
    
    // Validate content against configuration
    await this.validateContentCreation(userId, content);

    // Create content using PersonalContentManager
    const createdContent = await this.personalContentManager.createPersonalContent(userId, content);

    // Apply privacy isolation if needed
    if (content.privacy === PrivacyLevel.PRIVATE) {
      await this.privateDataIsolationService.isolatePrivateContent(createdContent.id, userId);
    }

    return createdContent;
  }

  /**
   * Create project configuration with sync integration
   * Requirement 13.2: Project configuration sync with existing privacy boundaries
   */
  async createProjectConfiguration(
    userId: string,
    config: Omit<ProjectConfiguration, 'id' | 'ownerId' | 'createdAt' | 'updatedAt' | 'version'>
  ): Promise<ProjectConfiguration> {
    this.ensureInitialized();

    // Validate project configuration
    await this.validateProjectConfiguration(userId, config);

    // Create project configuration
    const projectConfig = await this.projectConfigSync.createProjectConfiguration(userId, config);

    // Set up privacy boundaries if needed
    if (config.privacy === PrivacyLevel.PRIVATE) {
      await this.privateDataIsolationService.createPrivacyBoundary(
        userId,
        projectConfig.tenantId || userId,
        ['project_configuration'],
        []
      );
    }

    return projectConfig;
  }

  /**
   * Share content with collaborative features
   * Requirement 13.3: Collaborative content sharing using existing UserRole access control
   */
  async shareContent(
    ownerId: string,
    contentId: string,
    targetUserId: string,
    permissions: Permission[],
    expiresAt?: Date
  ): Promise<void> {
    this.ensureInitialized();

    // Validate sharing permissions
    await this.validateContentSharing(ownerId, contentId, targetUserId, permissions);

    // Share content using CollaborativeContentService
    await this.collaborativeContentService.shareContent(
      ownerId,
      contentId,
      targetUserId,
      permissions,
      expiresAt
    );

    // Update privacy boundaries if needed
    await this.updatePrivacyBoundariesForSharing(contentId, targetUserId);
  }

  /**
   * Add project collaborator with role-based access
   * Requirement 13.3: Use existing role-based access control (UserRole enum)
   */
  async addProjectCollaborator(
    ownerId: string,
    projectId: string,
    collaboratorUserId: string,
    role: UserRole,
    permissions: Permission[]
  ): Promise<void> {
    this.ensureInitialized();

    // Validate collaboration setup
    await this.validateProjectCollaboration(ownerId, projectId, collaboratorUserId, role);

    // Add collaborator
    await this.collaborativeContentService.addProjectCollaborator(
      ownerId,
      projectId,
      collaboratorUserId,
      role,
      permissions
    );

    // Update privacy boundaries for collaboration
    await this.updatePrivacyBoundariesForCollaboration(projectId, collaboratorUserId);
  }

  /**
   * Get user's accessible content across all CMS features
   * Requirement 13.1, 13.3: Unified content access with proper isolation
   */
  async getUserContent(userId: string, filters?: {
    includePersonal?: boolean;
    includeShared?: boolean;
    includeCollaborative?: boolean;
    contentType?: ContentType;
    privacy?: PrivacyLevel;
    limit?: number;
    offset?: number;
  }): Promise<{
    personalContent: ContentItem[];
    sharedContent: ContentItem[];
    collaborativeProjects: ProjectConfiguration[];
  }> {
    this.ensureInitialized();

    const result = {
      personalContent: [] as ContentItem[],
      sharedContent: [] as ContentItem[],
      collaborativeProjects: [] as ProjectConfiguration[]
    };

    // Get personal content if requested
    if (filters?.includePersonal !== false) {
      result.personalContent = await this.personalContentManager.listPersonalContent(userId, {
        type: filters?.contentType,
        privacy: filters?.privacy,
        limit: filters?.limit,
        offset: filters?.offset
      });
    }

    // Get shared content if requested
    if (filters?.includeShared !== false) {
      result.sharedContent = await this.collaborativeContentService.getSharedContent(userId, {
        contentType: filters?.contentType,
        limit: filters?.limit,
        offset: filters?.offset
      });
    }

    // Get collaborative projects if requested
    if (filters?.includeCollaborative !== false) {
      result.collaborativeProjects = await this.collaborativeContentService.getCollaborativeProjects(userId);
    }

    return result;
  }

  /**
   * Audit privacy compliance across all CMS features
   * Requirement 13.4: Comprehensive privacy audit using existing tenant patterns
   */
  async auditPrivacyCompliance(tenantId: string): Promise<{
    compliant: boolean;
    violations: string[];
    recommendations: string[];
    details: {
      personalContent: any;
      projectConfigurations: any;
      collaborativeContent: any;
      dataIsolation: any;
    };
  }> {
    this.ensureInitialized();

    // Run privacy audit
    const auditResult = await this.privateDataIsolationService.auditPrivacyCompliance(tenantId);

    // Get detailed audit information
    const details = {
      personalContent: await this.auditPersonalContentCompliance(tenantId),
      projectConfigurations: await this.auditProjectConfigurationCompliance(tenantId),
      collaborativeContent: await this.auditCollaborativeContentCompliance(tenantId),
      dataIsolation: await this.auditDataIsolationCompliance(tenantId)
    };

    return {
      ...auditResult,
      details
    };
  }

  /**
   * Sync all CMS data for a user across environments
   * Requirement 13.1, 13.2: Synchronized across user's active environments
   */
  async syncUserCMSData(userId: string): Promise<void> {
    this.ensureInitialized();

    try {
      // Sync personal content
      await this.personalContentManager.syncPersonalContentAcrossSessions(userId);

      // Sync project configurations
      const projects = await this.collaborativeContentService.getCollaborativeProjects(userId);
      for (const project of projects) {
        await this.projectConfigSync.syncConfigurationFiles(project.id, userId);
      }

      // Emit sync completion event
      await this.emitCMSEvent({
        type: CMSEventType.SYNC_COMPLETED,
        contentId: 'all_cms_data',
        userId,
        metadata: {
          syncType: 'full_cms_sync',
          projectCount: projects.length
        },
        timestamp: new Date()
      });

    } catch (error) {
      console.error(`Failed to sync CMS data for user ${userId}:`, error);
      throw error;
    }
  }

  // Private helper methods

  private initializeServices(): void {
    this.personalContentManager = new PersonalContentManager(
      this.prisma,
      this.redis,
      this.syncOrchestrator
    );

    this.projectConfigSync = new ProjectConfigurationSync(
      this.prisma,
      this.redis,
      this.syncOrchestrator,
      this.fileWatcher
    );

    this.collaborativeContentService = new CollaborativeContentService(
      this.prisma,
      this.redis,
      this.syncOrchestrator
    );

    this.privateDataIsolationService = new PrivateDataIsolationService(
      this.prisma,
      this.redis,
      this.syncOrchestrator
    );
  }

  private async createDatabaseTables(): Promise<void> {
    // Create CMS-specific tables if they don't exist
    await this.prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS personal_content (
        id VARCHAR(255) PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(500) NOT NULL,
        content TEXT,
        metadata JSON,
        owner_id VARCHAR(255) NOT NULL,
        tenant_id VARCHAR(255),
        privacy VARCHAR(20) NOT NULL DEFAULT 'private',
        sharing_settings JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        version INT DEFAULT 1,
        checksum VARCHAR(64),
        INDEX idx_owner_id (owner_id),
        INDEX idx_tenant_id (tenant_id),
        INDEX idx_privacy (privacy),
        INDEX idx_type (type)
      )
    `;

    await this.prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS project_configurations (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(500) NOT NULL,
        description TEXT,
        config JSON,
        owner_id VARCHAR(255) NOT NULL,
        tenant_id VARCHAR(255),
        privacy VARCHAR(20) NOT NULL DEFAULT 'private',
        collaborators JSON,
        sync_settings JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        version INT DEFAULT 1,
        INDEX idx_owner_id (owner_id),
        INDEX idx_tenant_id (tenant_id),
        INDEX idx_privacy (privacy)
      )
    `;

    await this.prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS content_sharing_permissions (
        id VARCHAR(255) PRIMARY KEY DEFAULT (UUID()),
        content_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        permissions JSON,
        granted_by VARCHAR(255) NOT NULL,
        granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NULL,
        UNIQUE KEY unique_content_user (content_id, user_id),
        INDEX idx_content_id (content_id),
        INDEX idx_user_id (user_id)
      )
    `;

    await this.prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS privacy_boundaries (
        id VARCHAR(255) PRIMARY KEY DEFAULT (UUID()),
        tenant_id VARCHAR(255) NOT NULL UNIQUE,
        user_id VARCHAR(255) NOT NULL,
        data_types JSON,
        restrictions JSON,
        audit_required BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_tenant_id (tenant_id),
        INDEX idx_user_id (user_id)
      )
    `;
  }

  private async setupEventListeners(): Promise<void> {
    // Listen for CMS events
    await this.redis.subscribe('cms_events', (message) => {
      try {
        const event: CMSEvent = JSON.parse(message);
        this.handleCMSEvent(event);
      } catch (error) {
        console.error('Failed to handle CMS event:', error);
      }
    });

    // Listen for privacy events
    await this.redis.subscribe('privacy_events', (message) => {
      try {
        const event = JSON.parse(message);
        this.handlePrivacyEvent(event);
      } catch (error) {
        console.error('Failed to handle privacy event:', error);
      }
    });
  }

  private async initializeFileWatching(): Promise<void> {
    // Set up file watching for CMS-related files
    this.fileWatcher.onFileChange(async (event) => {
      if (this.isCMSRelatedFile(event.filePath)) {
        await this.handleCMSFileChange(event);
      }
    });
  }

  private async startPeriodicSync(): Promise<void> {
    // Start periodic sync process
    setInterval(async () => {
      try {
        await this.performPeriodicSync();
      } catch (error) {
        console.error('Periodic sync failed:', error);
      }
    }, this.config.syncInterval);
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('CMS Integration Service not initialized. Call initialize() first.');
    }
  }

  private async validateContentCreation(
    userId: string,
    content: Omit<ContentItem, 'id' | 'ownerId' | 'createdAt' | 'updatedAt' | 'version' | 'checksum'>
  ): Promise<void> {
    // Validate content size
    if (content.content.length > this.config.maxContentSize) {
      throw new Error(`Content size exceeds maximum allowed size of ${this.config.maxContentSize} bytes`);
    }

    // Validate content type
    if (!this.config.allowedContentTypes.includes(content.type)) {
      throw new Error(`Content type ${content.type} is not allowed`);
    }

    // Validate user permissions
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, roles: true, isActive: true }
    });

    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }
  }

  private async validateProjectConfiguration(
    userId: string,
    config: Omit<ProjectConfiguration, 'id' | 'ownerId' | 'createdAt' | 'updatedAt' | 'version'>
  ): Promise<void> {
    // Validate user permissions for project creation
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, roles: true, isActive: true }
    });

    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    // Validate configuration size
    const configSize = JSON.stringify(config.config).length;
    if (configSize > this.config.maxContentSize) {
      throw new Error(`Configuration size exceeds maximum allowed size`);
    }
  }

  private async validateContentSharing(
    ownerId: string,
    contentId: string,
    targetUserId: string,
    permissions: Permission[]
  ): Promise<void> {
    // Validate that content exists and user owns it
    const content = await this.personalContentManager.getPersonalContent(ownerId, contentId);
    if (!content) {
      throw new Error('Content not found or access denied');
    }

    // Validate target user exists
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, isActive: true }
    });

    if (!targetUser || !targetUser.isActive) {
      throw new Error('Target user not found or inactive');
    }

    // Validate privacy level allows sharing
    if (content.privacy === PrivacyLevel.PRIVATE && permissions.length > 0) {
      throw new Error('Cannot share private content');
    }
  }

  private async validateProjectCollaboration(
    ownerId: string,
    projectId: string,
    collaboratorUserId: string,
    role: UserRole
  ): Promise<void> {
    // Validate project exists and user owns it
    const project = await this.projectConfigSync.getProjectConfiguration(ownerId, projectId);
    if (!project) {
      throw new Error('Project not found or access denied');
    }

    // Validate collaborator user exists
    const collaborator = await this.prisma.user.findUnique({
      where: { id: collaboratorUserId },
      select: { id: true, role: true, isActive: true }
    });

    if (!collaborator || !collaborator.isActive) {
      throw new Error('Collaborator user not found or inactive');
    }
  }

  private async updatePrivacyBoundariesForSharing(contentId: string, targetUserId: string): Promise<void> {
    // Update privacy boundaries when content is shared
    // Implementation would depend on specific privacy requirements
  }

  private async updatePrivacyBoundariesForCollaboration(projectId: string, collaboratorUserId: string): Promise<void> {
    // Update privacy boundaries when collaborator is added
    // Implementation would depend on specific privacy requirements
  }

  private async auditPersonalContentCompliance(tenantId: string): Promise<any> {
    // Audit personal content for compliance
    const result = await this.prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_content,
        COUNT(CASE WHEN privacy = 'private' THEN 1 END) as private_content,
        COUNT(CASE WHEN privacy = 'public' THEN 1 END) as public_content,
        COUNT(CASE WHEN JSON_LENGTH(sharing_settings->'$.permissions') > 0 THEN 1 END) as shared_content
      FROM personal_content 
      WHERE tenant_id = ${tenantId} AND deleted_at IS NULL
    `;

    return result[0];
  }

  private async auditProjectConfigurationCompliance(tenantId: string): Promise<any> {
    // Audit project configurations for compliance
    const result = await this.prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_projects,
        COUNT(CASE WHEN privacy = 'private' THEN 1 END) as private_projects,
        COUNT(CASE WHEN JSON_LENGTH(collaborators) > 0 THEN 1 END) as collaborative_projects
      FROM project_configurations 
      WHERE tenant_id = ${tenantId} AND deleted_at IS NULL
    `;

    return result[0];
  }

  private async auditCollaborativeContentCompliance(tenantId: string): Promise<any> {
    // Audit collaborative content for compliance
    const result = await this.prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_permissions,
        COUNT(CASE WHEN expires_at IS NOT NULL AND expires_at < NOW() THEN 1 END) as expired_permissions
      FROM content_sharing_permissions csp
      JOIN personal_content pc ON csp.content_id = pc.id
      WHERE pc.tenant_id = ${tenantId}
    `;

    return result[0];
  }

  private async auditDataIsolationCompliance(tenantId: string): Promise<any> {
    // Audit data isolation compliance
    return await this.privateDataIsolationService.auditPrivacyCompliance(tenantId);
  }

  private isCMSRelatedFile(filePath: string): boolean {
    // Check if file is related to CMS (configuration files, content files, etc.)
    const cmsExtensions = ['.json', '.yaml', '.yml', '.md', '.txt', '.config'];
    const ext = filePath.substring(filePath.lastIndexOf('.'));
    return cmsExtensions.includes(ext.toLowerCase());
  }

  private async handleCMSEvent(event: CMSEvent): Promise<void> {
    // Handle CMS events for real-time updates
    console.log(`Handling CMS event: ${event.type} for content ${event.contentId}`);
    
    // Could trigger additional sync operations, notifications, etc.
  }

  private async handlePrivacyEvent(event: any): Promise<void> {
    // Handle privacy-related events
    console.log(`Handling privacy event: ${event.type} for tenant ${event.tenantId}`);
  }

  private async handleCMSFileChange(event: any): Promise<void> {
    // Handle file changes related to CMS
    console.log(`Handling CMS file change: ${event.filePath}`);
    
    // Could trigger configuration reloads, content updates, etc.
  }

  private async performPeriodicSync(): Promise<void> {
    // Perform periodic synchronization tasks
    console.log('Performing periodic CMS sync...');
    
    // Could include cleanup tasks, cache refreshes, etc.
  }

  private async emitCMSEvent(event: CMSEvent): Promise<void> {
    await this.redis.publish('cms_events', JSON.stringify(event));
    
    await this.prisma.authEvent.create({
      data: {
        userId: event.userId,
        type: event.type,
        details: {
          contentId: event.contentId,
          tenantId: event.tenantId,
          metadata: event.metadata,
          timestamp: event.timestamp
        }
      }
    });
  }
}