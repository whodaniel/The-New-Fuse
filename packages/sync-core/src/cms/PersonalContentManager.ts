/**
 * Personal Content Manager
 * 
 * Manages personal content using existing User and tenant models.
 * Provides content creation, synchronization, and management with
 * proper tenant isolation and privacy boundaries.
 */

import { PrismaClient, User, UserRole } from '@prisma/client';
import { RedisService } from '../config/SyncRedisConfig';
import { SyncOrchestrator } from '../services/SyncOrchestrator';
import { 
  ContentItem, 
  ContentType, 
  PrivacyLevel, 
  CMSEvent, 
  CMSEventType,
  ContentMetadata,
  SharingSettings
} from './types';
import { createHash } from 'crypto';

export class PersonalContentManager {
  private prisma: PrismaClient;
  private redis: RedisService;
  private syncOrchestrator: SyncOrchestrator;

  constructor(
    prisma: PrismaClient,
    redis: RedisService,
    syncOrchestrator: SyncOrchestrator
  ) {
    this.prisma = prisma;
    this.redis = redis;
    this.syncOrchestrator = syncOrchestrator;
  }

  /**
   * Create personal content with tenant isolation
   * Requirement 13.1: Personal content management using existing User and tenant models
   */
  async createPersonalContent(
    userId: string,
    content: Omit<ContentItem, 'id' | 'ownerId' | 'createdAt' | 'updatedAt' | 'version' | 'checksum'>
  ): Promise<ContentItem> {
    // Verify user exists and get tenant context
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, roles: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Generate content ID and checksum
    const contentId = this.generateContentId();
    const checksum = this.calculateChecksum(content.content);

    // Create content item with tenant isolation
    const contentItem: ContentItem = {
      ...content,
      id: contentId,
      ownerId: userId,
      tenantId: this.deriveTenantId(userId, content.privacy),
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      checksum
    };

    // Store in database using existing User model patterns
    await this.storeContentInDatabase(contentItem);

    // Sync across user's active sessions using existing sync infrastructure
    await this.syncOrchestrator.syncTenantData(
      contentItem.tenantId || userId,
      'personal_content',
      contentItem
    );

    // Emit event for audit logging
    await this.emitCMSEvent({
      type: CMSEventType.CONTENT_CREATED,
      contentId: contentItem.id,
      userId,
      tenantId: contentItem.tenantId,
      metadata: { contentType: content.type, privacy: content.privacy },
      timestamp: new Date()
    });

    return contentItem;
  }

  /**
   * Update personal content with version control
   * Requirement 13.1: Synchronized across user's active sessions
   */
  async updatePersonalContent(
    userId: string,
    contentId: string,
    updates: Partial<Pick<ContentItem, 'title' | 'content' | 'metadata' | 'sharingSettings'>>
  ): Promise<ContentItem> {
    // Verify ownership and tenant access
    const existingContent = await this.getPersonalContent(userId, contentId);
    if (!existingContent) {
      throw new Error('Content not found or access denied');
    }

    // Calculate new checksum if content changed
    const newChecksum = updates.content 
      ? this.calculateChecksum(updates.content)
      : existingContent.checksum;

    // Update content with version increment
    const updatedContent: ContentItem = {
      ...existingContent,
      ...updates,
      updatedAt: new Date(),
      version: existingContent.version + 1,
      checksum: newChecksum
    };

    // Store updated content
    await this.storeContentInDatabase(updatedContent);

    // Sync changes across all user sessions
    await this.syncOrchestrator.syncTenantData(
      updatedContent.tenantId || userId,
      'personal_content',
      updatedContent
    );

    // Emit update event
    await this.emitCMSEvent({
      type: CMSEventType.CONTENT_UPDATED,
      contentId,
      userId,
      tenantId: updatedContent.tenantId,
      metadata: { version: updatedContent.version, changes: Object.keys(updates) },
      timestamp: new Date()
    });

    return updatedContent;
  }

  /**
   * Get personal content with privacy boundaries
   * Requirement 13.4: Private data isolation using existing tenant patterns
   */
  async getPersonalContent(userId: string, contentId: string): Promise<ContentItem | null> {
    // Check Redis cache first
    const cacheKey = `personal_content:${userId}:${contentId}`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    // Retrieve from database with tenant isolation
    const content = await this.retrieveContentFromDatabase(contentId, userId);
    
    if (content) {
      // Cache for future access
      await this.redis.setex(cacheKey, 300, JSON.stringify(content)); // 5 minute cache
      
      // Track access for analytics
      await this.trackContentAccess(userId, contentId);
    }

    return content;
  }

  /**
   * List user's personal content with filtering
   * Requirement 13.1: Content management using existing User models
   */
  async listPersonalContent(
    userId: string,
    filters?: {
      type?: ContentType;
      privacy?: PrivacyLevel;
      tags?: string[];
      limit?: number;
      offset?: number;
    }
  ): Promise<ContentItem[]> {
    const cacheKey = `personal_content_list:${userId}:${JSON.stringify(filters)}`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    // Build query with tenant isolation
    const content = await this.queryUserContent(userId, filters);
    
    // Cache results
    await this.redis.setex(cacheKey, 60, JSON.stringify(content)); // 1 minute cache
    
    return content;
  }

  /**
   * Delete personal content with audit trail
   * Requirement 13.4: Maintain audit trails via existing AuthEvent logging
   */
  async deletePersonalContent(userId: string, contentId: string): Promise<void> {
    // Verify ownership
    const content = await this.getPersonalContent(userId, contentId);
    if (!content) {
      throw new Error('Content not found or access denied');
    }

    // Soft delete in database
    await this.softDeleteContent(contentId);

    // Remove from cache
    const cacheKey = `personal_content:${userId}:${contentId}`;
    await this.redis.del(cacheKey);

    // Sync deletion across sessions
    await this.syncOrchestrator.syncTenantData(
      content.tenantId || userId,
      'personal_content_deleted',
      { contentId, deletedAt: new Date() }
    );

    // Emit deletion event for audit
    await this.emitCMSEvent({
      type: CMSEventType.CONTENT_DELETED,
      contentId,
      userId,
      tenantId: content.tenantId,
      metadata: { contentType: content.type, title: content.title },
      timestamp: new Date()
    });
  }

  /**
   * Sync personal content across user sessions
   * Requirement 13.1: Synchronized across user's active environments
   */
  async syncPersonalContentAcrossSessions(userId: string): Promise<void> {
    // Get all user's content
    const allContent = await this.listPersonalContent(userId);
    
    // Sync each content item
    for (const content of allContent) {
      await this.syncOrchestrator.syncTenantData(
        content.tenantId || userId,
        'personal_content',
        content
      );
    }

    // Emit sync completion event
    await this.emitCMSEvent({
      type: CMSEventType.SYNC_COMPLETED,
      contentId: 'all',
      userId,
      metadata: { itemCount: allContent.length },
      timestamp: new Date()
    });
  }

  // Private helper methods

  private generateContentId(): string {
    return `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateChecksum(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  private deriveTenantId(userId: string, privacy: PrivacyLevel): string | undefined {
    // Use existing tenant patterns - private content uses userId as tenant
    switch (privacy) {
      case PrivacyLevel.PRIVATE:
        return userId;
      case PrivacyLevel.TENANT:
        return `tenant_${userId}`;
      case PrivacyLevel.SHARED:
      case PrivacyLevel.PUBLIC:
        return undefined; // Global scope
      default:
        return userId;
    }
  }

  private async storeContentInDatabase(content: ContentItem): Promise<void> {
    // Store using existing database patterns with proper tenant isolation
    await this.prisma.$executeRaw`
      INSERT INTO personal_content (
        id, type, title, content, metadata, owner_id, tenant_id, 
        privacy, sharing_settings, created_at, updated_at, version, checksum
      ) VALUES (
        ${content.id}, ${content.type}, ${content.title}, ${content.content},
        ${JSON.stringify(content.metadata)}, ${content.ownerId}, ${content.tenantId},
        ${content.privacy}, ${JSON.stringify(content.sharingSettings)},
        ${content.createdAt}, ${content.updatedAt}, ${content.version}, ${content.checksum}
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        content = EXCLUDED.content,
        metadata = EXCLUDED.metadata,
        sharing_settings = EXCLUDED.sharing_settings,
        updated_at = EXCLUDED.updated_at,
        version = EXCLUDED.version,
        checksum = EXCLUDED.checksum
    `;
  }

  private async retrieveContentFromDatabase(contentId: string, userId: string): Promise<ContentItem | null> {
    // Query with tenant isolation using existing patterns
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM personal_content 
      WHERE id = ${contentId} 
      AND (owner_id = ${userId} OR tenant_id = ${userId} OR privacy IN ('shared', 'public'))
      AND deleted_at IS NULL
    `;

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return {
      id: row.id,
      type: row.type,
      title: row.title,
      content: row.content,
      metadata: JSON.parse(row.metadata),
      ownerId: row.owner_id,
      tenantId: row.tenant_id,
      privacy: row.privacy,
      sharingSettings: JSON.parse(row.sharing_settings),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      version: row.version,
      checksum: row.checksum
    };
  }

  private async queryUserContent(
    userId: string,
    filters?: {
      type?: ContentType;
      privacy?: PrivacyLevel;
      tags?: string[];
      limit?: number;
      offset?: number;
    }
  ): Promise<ContentItem[]> {
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;
    
    let whereClause = `(owner_id = '${userId}' OR tenant_id = '${userId}' OR privacy IN ('shared', 'public')) AND deleted_at IS NULL`;
    
    if (filters?.type) {
      whereClause += ` AND type = '${filters.type}'`;
    }
    
    if (filters?.privacy) {
      whereClause += ` AND privacy = '${filters.privacy}'`;
    }

    const result = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM personal_content 
      WHERE ${whereClause}
      ORDER BY updated_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    return result.map(row => ({
      id: row.id,
      type: row.type,
      title: row.title,
      content: row.content,
      metadata: JSON.parse(row.metadata),
      ownerId: row.owner_id,
      tenantId: row.tenant_id,
      privacy: row.privacy,
      sharingSettings: JSON.parse(row.sharing_settings),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      version: row.version,
      checksum: row.checksum
    }));
  }

  private async softDeleteContent(contentId: string): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE personal_content 
      SET deleted_at = NOW() 
      WHERE id = ${contentId}
    `;
  }

  private async trackContentAccess(userId: string, contentId: string): Promise<void> {
    // Use existing AuthEvent logging for audit trails
    await this.prisma.authEvent.create({
      data: {
        userId,
        type: 'CONTENT_ACCESS',
        details: {
          contentId,
          accessedAt: new Date(),
          action: 'read'
        }
      }
    });
  }

  private async emitCMSEvent(event: CMSEvent): Promise<void> {
    // Publish event to Redis for real-time updates
    await this.redis.publish('cms_events', JSON.stringify(event));
    
    // Store in database for audit trail using existing AuthEvent pattern
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