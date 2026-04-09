/**
 * Project Configuration Sync
 * 
 * Implements project configuration synchronization with existing privacy boundaries.
 * Manages project settings, configurations, and collaborative access while maintaining
 * data isolation and security using existing tenant patterns.
 */

import { DrizzleClient, User, UserRole } from '@the-new-fuse/database/generated/drizzle';
import { RedisService } from '../config/SyncRedisConfig';
import { SyncOrchestrator } from '../services/SyncOrchestrator';
import { EnhancedFileSystemWatcher } from '../watchers/EnhancedFileSystemWatcher';
import { 
  ProjectConfiguration, 
  PrivacyLevel, 
  CMSEvent, 
  CMSEventType,
  Collaborator,
  SyncSettings,
  ConflictResolutionStrategy
} from './types';
import { createHash } from 'crypto';
import * as path from 'path';

export class ProjectConfigurationSync {
  private drizzle: DrizzleClient;
  private redis: RedisService;
  private syncOrchestrator: SyncOrchestrator;
  private fileWatcher: EnhancedFileSystemWatcher;

  constructor(
    drizzle: DrizzleClient,
    redis: RedisService,
    syncOrchestrator: SyncOrchestrator,
    fileWatcher: EnhancedFileSystemWatcher
  ) {
    this.drizzle = drizzle;
    this.redis = redis;
    this.syncOrchestrator = syncOrchestrator;
    this.fileWatcher = fileWatcher;
    
    this.initializeFileWatching();
  }

  /**
   * Create project configuration with privacy boundaries
   * Requirement 13.2: Project configuration sync with existing privacy boundaries
   */
  async createProjectConfiguration(
    userId: string,
    config: Omit<ProjectConfiguration, 'id' | 'ownerId' | 'createdAt' | 'updatedAt' | 'version'>
  ): Promise<ProjectConfiguration> {
    // Verify user exists and has appropriate permissions
    const user = await this.drizzle.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, roles: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Validate privacy boundaries
    await this.validatePrivacyBoundaries(userId, config.privacy, config.config);

    // Generate project ID
    const projectId = this.generateProjectId();

    // Create project configuration with tenant isolation
    const projectConfig: ProjectConfiguration = {
      ...config,
      id: projectId,
      ownerId: userId,
      tenantId: this.deriveTenantId(userId, config.privacy),
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1
    };

    // Store in database using existing tenant patterns
    await this.storeProjectConfiguration(projectConfig);

    // Set up file watching for configuration files
    await this.setupConfigurationFileWatching(projectConfig);

    // Sync across relevant environments
    await this.syncOrchestrator.syncTenantData(
      projectConfig.tenantId || userId,
      'project_configuration',
      projectConfig
    );

    // Emit creation event
    await this.emitCMSEvent({
      type: CMSEventType.CONTENT_CREATED,
      contentId: projectConfig.id,
      userId,
      tenantId: projectConfig.tenantId,
      metadata: { 
        projectName: config.name, 
        privacy: config.privacy,
        collaboratorCount: config.collaborators.length 
      },
      timestamp: new Date()
    });

    return projectConfig;
  }

  /**
   * Update project configuration with conflict resolution
   * Requirement 13.2: Changes propagated to all user's active environments
   */
  async updateProjectConfiguration(
    userId: string,
    projectId: string,
    updates: Partial<Pick<ProjectConfiguration, 'name' | 'description' | 'config' | 'collaborators' | 'syncSettings'>>
  ): Promise<ProjectConfiguration> {
    // Verify access permissions
    const existingConfig = await this.getProjectConfiguration(userId, projectId);
    if (!existingConfig) {
      throw new Error('Project configuration not found or access denied');
    }

    // Check if user has write permissions
    if (!this.hasWritePermission(userId, existingConfig)) {
      throw new Error('Insufficient permissions to update project configuration');
    }

    // Validate privacy boundaries for config changes
    if (updates.config) {
      await this.validatePrivacyBoundaries(userId, existingConfig.privacy, updates.config);
    }

    // Handle concurrent updates with conflict resolution
    const resolvedUpdates = await this.resolveConfigurationConflicts(
      existingConfig,
      updates,
      userId
    );

    // Update configuration with version increment
    const updatedConfig: ProjectConfiguration = {
      ...existingConfig,
      ...resolvedUpdates,
      updatedAt: new Date(),
      version: existingConfig.version + 1
    };

    // Store updated configuration
    await this.storeProjectConfiguration(updatedConfig);

    // Update file watching if configuration paths changed
    if (updates.config) {
      await this.updateConfigurationFileWatching(updatedConfig);
    }

    // Sync changes across all environments
    await this.syncOrchestrator.syncTenantData(
      updatedConfig.tenantId || userId,
      'project_configuration',
      updatedConfig
    );

    // Notify collaborators of changes
    await this.notifyCollaborators(updatedConfig, userId, 'configuration_updated');

    // Emit update event
    await this.emitCMSEvent({
      type: CMSEventType.CONTENT_UPDATED,
      contentId: projectId,
      userId,
      tenantId: updatedConfig.tenantId,
      metadata: { 
        version: updatedConfig.version, 
        changes: Object.keys(resolvedUpdates),
        conflictResolved: Object.keys(resolvedUpdates).length !== Object.keys(updates).length
      },
      timestamp: new Date()
    });

    return updatedConfig;
  }

  /**
   * Get project configuration with privacy enforcement
   * Requirement 13.2: Maintain privacy boundaries defined in existing schema
   */
  async getProjectConfiguration(userId: string, projectId: string): Promise<ProjectConfiguration | null> {
    // Check cache first
    const cacheKey = `project_config:${userId}:${projectId}`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      const config = JSON.parse(cached);
      // Verify access is still valid
      if (this.hasReadPermission(userId, config)) {
        return config;
      }
    }

    // Retrieve from database with privacy enforcement
    const config = await this.retrieveProjectConfiguration(projectId, userId);
    
    if (config && this.hasReadPermission(userId, config)) {
      // Cache for future access
      await this.redis.setex(cacheKey, 300, JSON.stringify(config));
      
      // Track access for audit
      await this.trackConfigurationAccess(userId, projectId);
      
      return config;
    }

    return null;
  }

  /**
   * List user's accessible project configurations
   * Requirement 13.2: Use existing privacy boundaries
   */
  async listProjectConfigurations(
    userId: string,
    filters?: {
      privacy?: PrivacyLevel;
      owned?: boolean;
      collaborative?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<ProjectConfiguration[]> {
    const cacheKey = `project_configs:${userId}:${JSON.stringify(filters)}`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    // Query configurations with privacy enforcement
    const configs = await this.queryUserProjectConfigurations(userId, filters);
    
    // Filter based on read permissions
    const accessibleConfigs = configs.filter(config => 
      this.hasReadPermission(userId, config)
    );
    
    // Cache results
    await this.redis.setex(cacheKey, 60, JSON.stringify(accessibleConfigs));
    
    return accessibleConfigs;
  }

  /**
   * Sync project configuration files
   * Requirement 13.2: File-based configuration synchronization
   */
  async syncConfigurationFiles(projectId: string, userId: string): Promise<void> {
    const config = await this.getProjectConfiguration(userId, projectId);
    if (!config) {
      throw new Error('Project configuration not found or access denied');
    }

    // Get configuration file paths
    const configPaths = this.extractConfigurationPaths(config.config);
    
    // Sync each configuration file
    for (const configPath of configPaths) {
      try {
        await this.syncSingleConfigurationFile(config, configPath, userId);
      } catch (error) {
        console.error(`Failed to sync configuration file ${configPath}:`, error);
        // Continue with other files
      }
    }

    // Emit sync completion event
    await this.emitCMSEvent({
      type: CMSEventType.SYNC_COMPLETED,
      contentId: projectId,
      userId,
      tenantId: config.tenantId,
      metadata: { 
        fileCount: configPaths.length,
        syncType: 'configuration_files'
      },
      timestamp: new Date()
    });
  }

  // Private helper methods

  private async initializeFileWatching(): Promise<void> {
    // Set up file change handler for configuration files
    this.fileWatcher.onFileChange(async (event) => {
      if (this.isConfigurationFile(event.filePath)) {
        await this.handleConfigurationFileChange(event);
      }
    });
  }

  private generateProjectId(): string {
    return `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private deriveTenantId(userId: string, privacy: PrivacyLevel): string | undefined {
    // Use existing tenant patterns
    switch (privacy) {
      case PrivacyLevel.PRIVATE:
        return userId;
      case PrivacyLevel.TENANT:
        return `tenant_${userId}`;
      case PrivacyLevel.SHARED:
      case PrivacyLevel.PUBLIC:
        return undefined;
      default:
        return userId;
    }
  }

  private async validatePrivacyBoundaries(
    userId: string,
    privacy: PrivacyLevel,
    config: Record<string, any>
  ): Promise<void> {
    // Check for sensitive data in configuration
    const sensitiveKeys = ['password', 'secret', 'key', 'token', 'credential'];
    const configString = JSON.stringify(config).toLowerCase();
    
    const hasSensitiveData = sensitiveKeys.some(key => 
      configString.includes(key)
    );

    if (hasSensitiveData && privacy !== PrivacyLevel.PRIVATE) {
      throw new Error('Configuration contains sensitive data and must be private');
    }

    // Validate user has permission to create configurations at this privacy level
    const user = await this.drizzle.user.findUnique({
      where: { id: userId },
      select: { role: true, roles: true }
    });

    if (privacy === PrivacyLevel.PUBLIC && 
        !user?.roles.includes(UserRole.ADMIN) && 
        !user?.roles.includes(UserRole.SUPER_ADMIN)) {
      throw new Error('Insufficient permissions to create public configurations');
    }
  }

  private hasReadPermission(userId: string, config: ProjectConfiguration): boolean {
    // Owner always has access
    if (config.ownerId === userId) {
      return true;
    }

    // Check collaborator permissions
    const collaborator = config.collaborators.find(c => c.userId === userId);
    if (collaborator) {
      return true; // All collaborators have read access
    }

    // Check privacy level
    switch (config.privacy) {
      case PrivacyLevel.PUBLIC:
        return true;
      case PrivacyLevel.SHARED:
        return true; // Could be enhanced with more specific sharing rules
      case PrivacyLevel.TENANT:
        return config.tenantId === userId || config.tenantId === `tenant_${userId}`;
      case PrivacyLevel.PRIVATE:
        return false;
      default:
        return false;
    }
  }

  private hasWritePermission(userId: string, config: ProjectConfiguration): boolean {
    // Owner always has write access
    if (config.ownerId === userId) {
      return true;
    }

    // Check collaborator permissions
    const collaborator = config.collaborators.find(c => c.userId === userId);
    if (collaborator) {
      return collaborator.role !== UserRole.USER; // Non-user roles can write
    }

    return false;
  }

  private async storeProjectConfiguration(config: ProjectConfiguration): Promise<void> {
    await this.drizzle.$executeRaw`
      INSERT INTO project_configurations (
        id, name, description, config, owner_id, tenant_id, privacy,
        collaborators, sync_settings, created_at, updated_at, version
      ) VALUES (
        ${config.id}, ${config.name}, ${config.description}, ${JSON.stringify(config.config)},
        ${config.ownerId}, ${config.tenantId}, ${config.privacy},
        ${JSON.stringify(config.collaborators)}, ${JSON.stringify(config.syncSettings)},
        ${config.createdAt}, ${config.updatedAt}, ${config.version}
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        config = EXCLUDED.config,
        collaborators = EXCLUDED.collaborators,
        sync_settings = EXCLUDED.sync_settings,
        updated_at = EXCLUDED.updated_at,
        version = EXCLUDED.version
    `;
  }

  private async retrieveProjectConfiguration(projectId: string, userId: string): Promise<ProjectConfiguration | null> {
    const result = await this.drizzle.$queryRaw<any[]>`
      SELECT * FROM project_configurations 
      WHERE id = ${projectId} 
      AND (
        owner_id = ${userId} 
        OR tenant_id = ${userId} 
        OR privacy IN ('shared', 'public')
        OR JSON_EXTRACT(collaborators, '$[*].userId') LIKE '%${userId}%'
      )
      AND deleted_at IS NULL
    `;

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      config: JSON.parse(row.config),
      ownerId: row.owner_id,
      tenantId: row.tenant_id,
      privacy: row.privacy,
      collaborators: JSON.parse(row.collaborators),
      syncSettings: JSON.parse(row.sync_settings),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      version: row.version
    };
  }

  private async queryUserProjectConfigurations(
    userId: string,
    filters?: {
      privacy?: PrivacyLevel;
      owned?: boolean;
      collaborative?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<ProjectConfiguration[]> {
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;
    
    let whereClause = `deleted_at IS NULL`;
    
    if (filters?.owned) {
      whereClause += ` AND owner_id = '${userId}'`;
    } else if (filters?.collaborative) {
      whereClause += ` AND JSON_EXTRACT(collaborators, '$[*].userId') LIKE '%${userId}%'`;
    } else {
      whereClause += ` AND (
        owner_id = '${userId}' 
        OR tenant_id = '${userId}' 
        OR privacy IN ('shared', 'public')
        OR JSON_EXTRACT(collaborators, '$[*].userId') LIKE '%${userId}%'
      )`;
    }
    
    if (filters?.privacy) {
      whereClause += ` AND privacy = '${filters.privacy}'`;
    }

    const result = await this.drizzle.$queryRaw<any[]>`
      SELECT * FROM project_configurations 
      WHERE ${whereClause}
      ORDER BY updated_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    return result.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      config: JSON.parse(row.config),
      ownerId: row.owner_id,
      tenantId: row.tenant_id,
      privacy: row.privacy,
      collaborators: JSON.parse(row.collaborators),
      syncSettings: JSON.parse(row.sync_settings),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      version: row.version
    }));
  }

  private async resolveConfigurationConflicts(
    existing: ProjectConfiguration,
    updates: Partial<ProjectConfiguration>,
    userId: string
  ): Promise<Partial<ProjectConfiguration>> {
    const strategy = existing.syncSettings.conflictResolution;
    
    switch (strategy) {
      case ConflictResolutionStrategy.LAST_WRITE_WINS:
        return updates;
      
      case ConflictResolutionStrategy.MERGE:
        return this.mergeConfigurations(existing, updates);
      
      case ConflictResolutionStrategy.MANUAL:
        // Store conflict for manual resolution
        await this.storeConfigurationConflict(existing, updates, userId);
        throw new Error('Configuration conflict detected. Manual resolution required.');
      
      case ConflictResolutionStrategy.VERSION_BRANCH:
        // Create a new version branch
        return await this.createVersionBranch(existing, updates, userId);
      
      default:
        return updates;
    }
  }

  private mergeConfigurations(
    existing: ProjectConfiguration,
    updates: Partial<ProjectConfiguration>
  ): Partial<ProjectConfiguration> {
    const merged = { ...updates };
    
    // Deep merge configuration objects
    if (updates.config && existing.config) {
      merged.config = { ...existing.config, ...updates.config };
    }
    
    // Merge collaborators
    if (updates.collaborators && existing.collaborators) {
      const existingCollaborators = new Map(
        existing.collaborators.map(c => [c.userId, c])
      );
      
      updates.collaborators.forEach(c => {
        existingCollaborators.set(c.userId, c);
      });
      
      merged.collaborators = Array.from(existingCollaborators.values());
    }
    
    return merged;
  }

  private async storeConfigurationConflict(
    existing: ProjectConfiguration,
    updates: Partial<ProjectConfiguration>,
    userId: string
  ): Promise<void> {
    await this.drizzle.syncConflict.create({
      data: {
        resourceType: 'project_configuration',
        resourceId: existing.id,
        tenantId: existing.tenantId,
        conflictType: 'concurrent',
        localVersion: existing,
        remoteVersion: updates,
      }
    });
  }

  private async createVersionBranch(
    existing: ProjectConfiguration,
    updates: Partial<ProjectConfiguration>,
    userId: string
  ): Promise<Partial<ProjectConfiguration>> {
    // Create a new branch version
    const branchId = `${existing.id}_branch_${Date.now()}`;
    const branchedConfig: ProjectConfiguration = {
      ...existing,
      ...updates,
      id: branchId,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await this.storeProjectConfiguration(branchedConfig);
    
    return updates;
  }

  private async setupConfigurationFileWatching(config: ProjectConfiguration): Promise<void> {
    const configPaths = this.extractConfigurationPaths(config.config);
    
    for (const configPath of configPaths) {
      this.fileWatcher.watchTenantFiles(
        config.tenantId || config.ownerId,
        [configPath]
      );
    }
  }

  private async updateConfigurationFileWatching(config: ProjectConfiguration): Promise<void> {
    // Remove old watchers and add new ones
    await this.setupConfigurationFileWatching(config);
  }

  private extractConfigurationPaths(config: Record<string, any>): string[] {
    const paths: string[] = [];
    
    const extractPaths = (obj: any, prefix = ''): void => {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string' && this.isFilePath(value)) {
          paths.push(value);
        } else if (typeof value === 'object' && value !== null) {
          extractPaths(value, `${prefix}${key}.`);
        }
      }
    };
    
    extractPaths(config);
    return paths;
  }

  private isFilePath(value: string): boolean {
    return value.includes('/') || value.includes('\\') || value.includes('.');
  }

  private isConfigurationFile(filePath: string): boolean {
    const configExtensions = ['.json', '.yaml', '.yml', '.toml', '.ini', '.env'];
    const ext = path.extname(filePath).toLowerCase();
    return configExtensions.includes(ext);
  }

  private async handleConfigurationFileChange(event: any): Promise<void> {
    // Find project configurations that reference this file
    const affectedConfigs = await this.findConfigurationsUsingFile(event.filePath);
    
    for (const config of affectedConfigs) {
      await this.syncSingleConfigurationFile(config, event.filePath, config.ownerId);
    }
  }

  private async findConfigurationsUsingFile(filePath: string): Promise<ProjectConfiguration[]> {
    // This would need to be implemented based on how file paths are stored in configurations
    // For now, return empty array
    return [];
  }

  private async syncSingleConfigurationFile(
    config: ProjectConfiguration,
    filePath: string,
    userId: string
  ): Promise<void> {
    // Sync file content across environments
    await this.syncOrchestrator.syncTenantData(
      config.tenantId || userId,
      'configuration_file',
      {
        projectId: config.id,
        filePath,
        timestamp: new Date()
      }
    );
  }

  private async notifyCollaborators(
    config: ProjectConfiguration,
    updatedBy: string,
    eventType: string
  ): Promise<void> {
    for (const collaborator of config.collaborators) {
      if (collaborator.userId !== updatedBy) {
        await this.redis.publish(
          `user_notifications:${collaborator.userId}`,
          JSON.stringify({
            type: eventType,
            projectId: config.id,
            projectName: config.name,
            updatedBy,
            timestamp: new Date()
          })
        );
      }
    }
  }

  private async trackConfigurationAccess(userId: string, projectId: string): Promise<void> {
    await this.drizzle.authEvent.create({
      data: {
        userId,
        type: 'PROJECT_CONFIG_ACCESS',
        details: {
          projectId,
          accessedAt: new Date(),
          action: 'read'
        }
      }
    });
  }

  private async emitCMSEvent(event: CMSEvent): Promise<void> {
    await this.redis.publish('cms_events', JSON.stringify(event));
    
    await this.drizzle.authEvent.create({
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