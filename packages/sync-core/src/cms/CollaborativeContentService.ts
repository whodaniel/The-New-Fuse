/**
 * Collaborative Content Service
 * 
 * Implements collaborative content sharing using existing UserRole access control.
 * Manages content sharing, permissions, and real-time collaboration while maintaining
 * security and audit trails through existing authentication systems.
 */

import { PrismaClient, User, UserRole } from '@prisma/client';
import { RedisService } from '../config/SyncRedisConfig';
import { SyncOrchestrator } from '../services/SyncOrchestrator';
import { 
  ContentItem,
  ProjectConfiguration,
  SharingPermission,
  CollaborationSettings,
  Permission,
  AccessLevel,
  CMSEvent,
  CMSEventType,
  Collaborator
} from './types';

export class CollaborativeContentService {
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
   * Share content with users using existing UserRole access control
   * Requirement 13.3: Collaborative content sharing using existing UserRole access control
   */
  async shareContent(
    ownerId: string,
    contentId: string,
    targetUserId: string,
    permissions: Permission[],
    expiresAt?: Date
  ): Promise<SharingPermission> {
    // Verify owner has permission to share
    await this.verifyOwnership(ownerId, contentId);

    // Verify target user exists and get their role
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, role: true, roles: true }
    });

    if (!targetUser) {
      throw new Error('Target user not found');
    }

    // Validate permissions based on user roles
    const validatedPermissions = await this.validatePermissionsForUserRole(
      targetUser.role,
      targetUser.roles,
      permissions
    );

    // Create sharing permission
    const sharingPermission: SharingPermission = {
      userId: targetUserId,
      role: targetUser.role,
      permissions: validatedPermissions,
      grantedBy: ownerId,
      grantedAt: new Date(),
      expiresAt
    };

    // Store sharing permission
    await this.storeSharingPermission(contentId, sharingPermission);

    // Update content sharing settings
    await this.updateContentSharingSettings(contentId, sharingPermission);

    // Sync sharing update across environments
    await this.syncOrchestrator.syncTenantData(
      targetUserId,
      'content_shared',
      {
        contentId,
        sharingPermission,
        sharedBy: ownerId
      }
    );

    // Notify target user of shared content
    await this.notifyUserOfSharedContent(targetUserId, contentId, ownerId, permissions);

    // Emit sharing event for audit
    await this.emitCMSEvent({
      type: CMSEventType.CONTENT_SHARED,
      contentId,
      userId: ownerId,
      metadata: {
        targetUserId,
        permissions: validatedPermissions,
        expiresAt
      },
      timestamp: new Date()
    });

    return sharingPermission;
  }

  /**
   * Add collaborator to project using existing UserRole patterns
   * Requirement 13.3: Use existing role-based access control (UserRole enum)
   */
  async addProjectCollaborator(
    ownerId: string,
    projectId: string,
    collaboratorUserId: string,
    role: UserRole,
    permissions: Permission[]
  ): Promise<Collaborator> {
    // Verify project ownership
    await this.verifyProjectOwnership(ownerId, projectId);

    // Verify collaborator user exists
    const collaboratorUser = await this.prisma.user.findUnique({
      where: { id: collaboratorUserId },
      select: { id: true, role: true, roles: true }
    });

    if (!collaboratorUser) {
      throw new Error('Collaborator user not found');
    }

    // Validate role assignment based on existing UserRole hierarchy
    await this.validateRoleAssignment(ownerId, role, collaboratorUser.role);

    // Validate permissions for the assigned role
    const validatedPermissions = await this.validatePermissionsForUserRole(
      role,
      [role],
      permissions
    );

    // Create collaborator
    const collaborator: Collaborator = {
      userId: collaboratorUserId,
      role,
      permissions: validatedPermissions,
      addedAt: new Date(),
      addedBy: ownerId
    };

    // Add collaborator to project
    await this.addCollaboratorToProject(projectId, collaborator);

    // Sync collaboration update
    await this.syncOrchestrator.syncTenantData(
      collaboratorUserId,
      'project_collaboration',
      {
        projectId,
        collaborator,
        addedBy: ownerId
      }
    );

    // Notify collaborator
    await this.notifyUserOfCollaboration(collaboratorUserId, projectId, ownerId, role);

    // Emit collaboration event
    await this.emitCMSEvent({
      type: CMSEventType.PERMISSION_GRANTED,
      contentId: projectId,
      userId: ownerId,
      metadata: {
        collaboratorUserId,
        role,
        permissions: validatedPermissions
      },
      timestamp: new Date()
    });

    return collaborator;
  }

  /**
   * Get shared content accessible to user
   * Requirement 13.3: Sync shared content appropriately based on access control
   */
  async getSharedContent(userId: string, filters?: {
    contentType?: string;
    sharedBy?: string;
    permissions?: Permission[];
    limit?: number;
    offset?: number;
  }): Promise<ContentItem[]> {
    const cacheKey = `shared_content:${userId}:${JSON.stringify(filters)}`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    // Get user's role for permission validation
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, roles: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Query shared content based on user's permissions
    const sharedContent = await this.querySharedContentForUser(userId, user.role, user.roles, filters);

    // Filter content based on current permissions (handle expired shares)
    const accessibleContent = await this.filterAccessibleContent(userId, sharedContent);

    // Cache results
    await this.redis.setex(cacheKey, 60, JSON.stringify(accessibleContent));

    return accessibleContent;
  }

  /**
   * Get collaborative projects for user
   * Requirement 13.3: Based on existing role-based access control
   */
  async getCollaborativeProjects(userId: string): Promise<ProjectConfiguration[]> {
    const cacheKey = `collaborative_projects:${userId}`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    // Query projects where user is a collaborator
    const projects = await this.queryCollaborativeProjects(userId);

    // Filter based on current access permissions
    const accessibleProjects = await this.filterAccessibleProjects(userId, projects);

    // Cache results
    await this.redis.setex(cacheKey, 300, JSON.stringify(accessibleProjects));

    return accessibleProjects;
  }

  /**
   * Revoke content sharing permission
   * Requirement 13.3: Manage access control using existing UserRole patterns
   */
  async revokeContentSharing(
    ownerId: string,
    contentId: string,
    targetUserId: string
  ): Promise<void> {
    // Verify ownership
    await this.verifyOwnership(ownerId, contentId);

    // Remove sharing permission
    await this.removeSharingPermission(contentId, targetUserId);

    // Update content sharing settings
    await this.removeFromContentSharingSettings(contentId, targetUserId);

    // Sync revocation across environments
    await this.syncOrchestrator.syncTenantData(
      targetUserId,
      'content_sharing_revoked',
      {
        contentId,
        revokedBy: ownerId,
        revokedAt: new Date()
      }
    );

    // Notify user of revoked access
    await this.notifyUserOfRevokedAccess(targetUserId, contentId, ownerId);

    // Emit revocation event
    await this.emitCMSEvent({
      type: CMSEventType.PERMISSION_REVOKED,
      contentId,
      userId: ownerId,
      metadata: {
        targetUserId,
        revokedAt: new Date()
      },
      timestamp: new Date()
    });
  }

  /**
   * Remove project collaborator
   * Requirement 13.3: Use existing UserRole access control patterns
   */
  async removeProjectCollaborator(
    ownerId: string,
    projectId: string,
    collaboratorUserId: string
  ): Promise<void> {
    // Verify project ownership
    await this.verifyProjectOwnership(ownerId, projectId);

    // Remove collaborator from project
    await this.removeCollaboratorFromProject(projectId, collaboratorUserId);

    // Sync removal across environments
    await this.syncOrchestrator.syncTenantData(
      collaboratorUserId,
      'project_collaboration_removed',
      {
        projectId,
        removedBy: ownerId,
        removedAt: new Date()
      }
    );

    // Notify collaborator of removal
    await this.notifyUserOfCollaborationRemoval(collaboratorUserId, projectId, ownerId);

    // Emit removal event
    await this.emitCMSEvent({
      type: CMSEventType.PERMISSION_REVOKED,
      contentId: projectId,
      userId: ownerId,
      metadata: {
        collaboratorUserId,
        removedAt: new Date()
      },
      timestamp: new Date()
    });
  }

  /**
   * Update collaboration permissions
   * Requirement 13.3: Manage permissions using existing UserRole hierarchy
   */
  async updateCollaborationPermissions(
    ownerId: string,
    projectId: string,
    collaboratorUserId: string,
    newPermissions: Permission[]
  ): Promise<void> {
    // Verify project ownership
    await this.verifyProjectOwnership(ownerId, projectId);

    // Get current collaborator info
    const project = await this.getProjectForOwner(ownerId, projectId);
    const collaborator = project.collaborators.find(c => c.userId === collaboratorUserId);

    if (!collaborator) {
      throw new Error('Collaborator not found');
    }

    // Validate new permissions for collaborator's role
    const validatedPermissions = await this.validatePermissionsForUserRole(
      collaborator.role,
      [collaborator.role],
      newPermissions
    );

    // Update collaborator permissions
    await this.updateCollaboratorPermissions(projectId, collaboratorUserId, validatedPermissions);

    // Sync permission update
    await this.syncOrchestrator.syncTenantData(
      collaboratorUserId,
      'collaboration_permissions_updated',
      {
        projectId,
        newPermissions: validatedPermissions,
        updatedBy: ownerId
      }
    );

    // Notify collaborator of permission changes
    await this.notifyUserOfPermissionUpdate(collaboratorUserId, projectId, ownerId, validatedPermissions);

    // Emit permission update event
    await this.emitCMSEvent({
      type: CMSEventType.PERMISSION_GRANTED,
      contentId: projectId,
      userId: ownerId,
      metadata: {
        collaboratorUserId,
        newPermissions: validatedPermissions,
        updatedAt: new Date()
      },
      timestamp: new Date()
    });
  }

  // Private helper methods

  private async verifyOwnership(userId: string, contentId: string): Promise<void> {
    const content = await this.prisma.$queryRaw<any[]>`
      SELECT owner_id FROM personal_content WHERE id = ${contentId}
    `;

    if (content.length === 0 || content[0].owner_id !== userId) {
      throw new Error('Content not found or access denied');
    }
  }

  private async verifyProjectOwnership(userId: string, projectId: string): Promise<void> {
    const project = await this.prisma.$queryRaw<any[]>`
      SELECT owner_id FROM project_configurations WHERE id = ${projectId}
    `;

    if (project.length === 0 || project[0].owner_id !== userId) {
      throw new Error('Project not found or access denied');
    }
  }

  private async validatePermissionsForUserRole(
    userRole: UserRole,
    userRoles: UserRole[],
    requestedPermissions: Permission[]
  ): Promise<Permission[]> {
    // Define role-based permission hierarchy
    const rolePermissions: Record<UserRole, Permission[]> = {
      [UserRole.USER]: [Permission.READ],
      [UserRole.AGENT_OPERATOR]: [Permission.READ, Permission.WRITE],
      [UserRole.AGENCY_MANAGER]: [Permission.READ, Permission.WRITE, Permission.SHARE],
      [UserRole.AGENCY_ADMIN]: [Permission.READ, Permission.WRITE, Permission.SHARE, Permission.DELETE],
      [UserRole.AGENCY_OWNER]: [Permission.READ, Permission.WRITE, Permission.SHARE, Permission.DELETE, Permission.ADMIN],
      [UserRole.ADMIN]: [Permission.READ, Permission.WRITE, Permission.SHARE, Permission.DELETE, Permission.ADMIN],
      [UserRole.SUPER_ADMIN]: [Permission.READ, Permission.WRITE, Permission.SHARE, Permission.DELETE, Permission.ADMIN]
    };

    // Get all allowed permissions for user's roles
    const allowedPermissions = new Set<Permission>();
    userRoles.forEach(role => {
      rolePermissions[role]?.forEach(permission => allowedPermissions.add(permission));
    });

    // Also include permissions for primary role
    rolePermissions[userRole]?.forEach(permission => allowedPermissions.add(permission));

    // Filter requested permissions to only include allowed ones
    return requestedPermissions.filter(permission => allowedPermissions.has(permission));
  }

  private async validateRoleAssignment(
    ownerId: string,
    assignedRole: UserRole,
    collaboratorCurrentRole: UserRole
  ): Promise<void> {
    // Get owner's role
    const owner = await this.prisma.user.findUnique({
      where: { id: ownerId },
      select: { role: true, roles: true }
    });

    if (!owner) {
      throw new Error('Owner not found');
    }

    // Define role hierarchy levels
    const roleHierarchy: Record<UserRole, number> = {
      [UserRole.USER]: 1,
      [UserRole.AGENT_OPERATOR]: 2,
      [UserRole.AGENCY_MANAGER]: 3,
      [UserRole.AGENCY_ADMIN]: 4,
      [UserRole.AGENCY_OWNER]: 5,
      [UserRole.ADMIN]: 6,
      [UserRole.SUPER_ADMIN]: 7
    };

    const ownerLevel = Math.max(
      roleHierarchy[owner.role],
      ...owner.roles.map(role => roleHierarchy[role])
    );
    const assignedLevel = roleHierarchy[assignedRole];

    // Owner cannot assign a role higher than their own
    if (assignedLevel > ownerLevel) {
      throw new Error('Cannot assign a role higher than your own');
    }

    // Cannot downgrade a user with higher role than owner
    const collaboratorLevel = roleHierarchy[collaboratorCurrentRole];
    if (collaboratorLevel > ownerLevel) {
      throw new Error('Cannot modify permissions for user with higher role');
    }
  }

  private async storeSharingPermission(contentId: string, permission: SharingPermission): Promise<void> {
    await this.prisma.$executeRaw`
      INSERT INTO content_sharing_permissions (
        content_id, user_id, role, permissions, granted_by, granted_at, expires_at
      ) VALUES (
        ${contentId}, ${permission.userId}, ${permission.role}, 
        ${JSON.stringify(permission.permissions)}, ${permission.grantedBy}, 
        ${permission.grantedAt}, ${permission.expiresAt}
      )
      ON CONFLICT (content_id, user_id) DO UPDATE SET
        permissions = EXCLUDED.permissions,
        granted_at = EXCLUDED.granted_at,
        expires_at = EXCLUDED.expires_at
    `;
  }

  private async updateContentSharingSettings(contentId: string, permission: SharingPermission): Promise<void> {
    // Update the content's sharing settings to include the new permission
    await this.prisma.$executeRaw`
      UPDATE personal_content 
      SET sharing_settings = JSON_SET(
        COALESCE(sharing_settings, '{"isPublic": false, "allowedUsers": [], "allowedRoles": [], "permissions": []}'),
        '$.permissions',
        JSON_ARRAY_APPEND(
          COALESCE(JSON_EXTRACT(sharing_settings, '$.permissions'), '[]'),
          '$',
          ${JSON.stringify(permission)}
        )
      )
      WHERE id = ${contentId}
    `;
  }

  private async addCollaboratorToProject(projectId: string, collaborator: Collaborator): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE project_configurations 
      SET collaborators = JSON_ARRAY_APPEND(
        COALESCE(collaborators, '[]'),
        '$',
        ${JSON.stringify(collaborator)}
      )
      WHERE id = ${projectId}
    `;
  }

  private async querySharedContentForUser(
    userId: string,
    userRole: UserRole,
    userRoles: UserRole[],
    filters?: any
  ): Promise<ContentItem[]> {
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    let whereClause = `
      EXISTS (
        SELECT 1 FROM content_sharing_permissions csp 
        WHERE csp.content_id = pc.id 
        AND csp.user_id = '${userId}'
        AND (csp.expires_at IS NULL OR csp.expires_at > NOW())
      )
    `;

    if (filters?.contentType) {
      whereClause += ` AND type = '${filters.contentType}'`;
    }

    if (filters?.sharedBy) {
      whereClause += ` AND owner_id = '${filters.sharedBy}'`;
    }

    const result = await this.prisma.$queryRaw<any[]>`
      SELECT pc.*, csp.permissions as shared_permissions
      FROM personal_content pc
      JOIN content_sharing_permissions csp ON pc.id = csp.content_id
      WHERE ${whereClause}
      AND pc.deleted_at IS NULL
      ORDER BY pc.updated_at DESC
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

  private async queryCollaborativeProjects(userId: string): Promise<ProjectConfiguration[]> {
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM project_configurations 
      WHERE JSON_EXTRACT(collaborators, '$[*].userId') LIKE '%${userId}%'
      AND deleted_at IS NULL
      ORDER BY updated_at DESC
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

  private async filterAccessibleContent(userId: string, content: ContentItem[]): Promise<ContentItem[]> {
    // Filter content based on current permissions and expiration
    const now = new Date();
    const accessible: ContentItem[] = [];

    for (const item of content) {
      const userPermission = item.sharingSettings.permissions.find(p => p.userId === userId);
      if (userPermission && (!userPermission.expiresAt || userPermission.expiresAt > now)) {
        accessible.push(item);
      }
    }

    return accessible;
  }

  private async filterAccessibleProjects(userId: string, projects: ProjectConfiguration[]): Promise<ProjectConfiguration[]> {
    // Filter projects based on current collaboration status
    return projects.filter(project => {
      const collaborator = project.collaborators.find(c => c.userId === userId);
      return collaborator !== undefined;
    });
  }

  private async getProjectForOwner(ownerId: string, projectId: string): Promise<ProjectConfiguration> {
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM project_configurations 
      WHERE id = ${projectId} AND owner_id = ${ownerId}
    `;

    if (result.length === 0) {
      throw new Error('Project not found');
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

  private async removeSharingPermission(contentId: string, userId: string): Promise<void> {
    await this.prisma.$executeRaw`
      DELETE FROM content_sharing_permissions 
      WHERE content_id = ${contentId} AND user_id = ${userId}
    `;
  }

  private async removeFromContentSharingSettings(contentId: string, userId: string): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE personal_content 
      SET sharing_settings = JSON_REMOVE(
        sharing_settings,
        JSON_UNQUOTE(JSON_SEARCH(sharing_settings, 'one', ${userId}, NULL, '$.permissions[*].userId'))
      )
      WHERE id = ${contentId}
    `;
  }

  private async removeCollaboratorFromProject(projectId: string, userId: string): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE project_configurations 
      SET collaborators = JSON_REMOVE(
        collaborators,
        JSON_UNQUOTE(JSON_SEARCH(collaborators, 'one', ${userId}, NULL, '$[*].userId'))
      )
      WHERE id = ${projectId}
    `;
  }

  private async updateCollaboratorPermissions(
    projectId: string,
    userId: string,
    permissions: Permission[]
  ): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE project_configurations 
      SET collaborators = JSON_SET(
        collaborators,
        CONCAT('$[', JSON_SEARCH(collaborators, 'one', ${userId}, NULL, '$[*].userId'), '].permissions'),
        ${JSON.stringify(permissions)}
      )
      WHERE id = ${projectId}
    `;
  }

  private async notifyUserOfSharedContent(
    userId: string,
    contentId: string,
    sharedBy: string,
    permissions: Permission[]
  ): Promise<void> {
    await this.redis.publish(
      `user_notifications:${userId}`,
      JSON.stringify({
        type: 'content_shared',
        contentId,
        sharedBy,
        permissions,
        timestamp: new Date()
      })
    );
  }

  private async notifyUserOfCollaboration(
    userId: string,
    projectId: string,
    addedBy: string,
    role: UserRole
  ): Promise<void> {
    await this.redis.publish(
      `user_notifications:${userId}`,
      JSON.stringify({
        type: 'project_collaboration_added',
        projectId,
        addedBy,
        role,
        timestamp: new Date()
      })
    );
  }

  private async notifyUserOfRevokedAccess(
    userId: string,
    contentId: string,
    revokedBy: string
  ): Promise<void> {
    await this.redis.publish(
      `user_notifications:${userId}`,
      JSON.stringify({
        type: 'content_access_revoked',
        contentId,
        revokedBy,
        timestamp: new Date()
      })
    );
  }

  private async notifyUserOfCollaborationRemoval(
    userId: string,
    projectId: string,
    removedBy: string
  ): Promise<void> {
    await this.redis.publish(
      `user_notifications:${userId}`,
      JSON.stringify({
        type: 'project_collaboration_removed',
        projectId,
        removedBy,
        timestamp: new Date()
      })
    );
  }

  private async notifyUserOfPermissionUpdate(
    userId: string,
    projectId: string,
    updatedBy: string,
    newPermissions: Permission[]
  ): Promise<void> {
    await this.redis.publish(
      `user_notifications:${userId}`,
      JSON.stringify({
        type: 'collaboration_permissions_updated',
        projectId,
        updatedBy,
        newPermissions,
        timestamp: new Date()
      })
    );
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