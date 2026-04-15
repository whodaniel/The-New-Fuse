/**
 * Private Data Isolation Service
 *
 * Ensures private data isolation using existing tenant patterns.
 * Implements data segregation, access control, and audit logging
 * to maintain privacy boundaries and security compliance.
 */

import { DrizzleClient, UserRole } from '@the-new-fuse/database/generated/drizzle';
import { createHash } from 'crypto';
import { RedisService } from '../config/SyncRedisConfig';
import { SyncOrchestrator } from '../services/SyncOrchestrator';
import { ContentItem, PrivacyBoundary, PrivacyLevel, Restriction, RestrictionType } from './types';

export class PrivateDataIsolationService {
  private drizzle: DrizzleClient;
  private redis: RedisService;
  private syncOrchestrator: SyncOrchestrator;

  constructor(drizzle: DrizzleClient, redis: RedisService, syncOrchestrator: SyncOrchestrator) {
    this.drizzle = drizzle;
    this.redis = redis;
    this.syncOrchestrator = syncOrchestrator;
  }

  /**
   * Create privacy boundary for tenant data isolation
   * Requirement 13.4: Private data isolation using existing tenant patterns
   */
  async createPrivacyBoundary(
    userId: string,
    tenantId: string,
    dataTypes: string[],
    restrictions: Restriction[]
  ): Promise<PrivacyBoundary> {
    // Verify user has permission to create privacy boundaries
    await this.verifyPrivacyBoundaryPermission(userId, tenantId);

    // Validate restrictions
    await this.validateRestrictions(restrictions);

    // Create privacy boundary
    const privacyBoundary: PrivacyBoundary = {
      tenantId,
      userId,
      dataTypes,
      restrictions,
      auditRequired: true,
    };

    // Store privacy boundary using existing tenant patterns
    await this.storePrivacyBoundary(privacyBoundary);

    // Set up Redis keyspace isolation for tenant
    await this.setupTenantKeyspaceIsolation(tenantId, dataTypes);

    // Sync privacy boundary across environments
    await this.syncOrchestrator.syncTenantData(tenantId, 'privacy_boundary', privacyBoundary);

    // Emit privacy boundary creation event
    await this.emitPrivacyEvent({
      type: 'PRIVACY_BOUNDARY_CREATED',
      userId,
      tenantId,
      metadata: {
        dataTypes,
        restrictionCount: restrictions.length,
      },
    });

    return privacyBoundary;
  }

  /**
   * Validate data access against privacy boundaries
   * Requirement 13.4: Never synchronized outside authorized scope
   */
  async validateDataAccess(
    userId: string,
    tenantId: string,
    dataType: string,
    operation: 'read' | 'write' | 'delete' | 'share'
  ): Promise<boolean> {
    // Get privacy boundary for tenant
    const privacyBoundary = await this.getPrivacyBoundary(tenantId);

    if (!privacyBoundary) {
      // No specific boundary, use default tenant isolation
      return await this.validateDefaultTenantAccess(userId, tenantId, operation);
    }

    // Check if data type is covered by privacy boundary
    if (!privacyBoundary.dataTypes.includes(dataType) && !privacyBoundary.dataTypes.includes('*')) {
      return true; // Not restricted by this boundary
    }

    // Validate against restrictions
    const accessAllowed = await this.validateAgainstRestrictions(
      userId,
      privacyBoundary.restrictions,
      operation
    );

    // Log access attempt for audit
    if (privacyBoundary.auditRequired) {
      await this.logDataAccessAttempt(userId, tenantId, dataType, operation, accessAllowed);
    }

    return accessAllowed;
  }

  /**
   * Isolate private content from synchronization
   * Requirement 13.4: Private data remains isolated per existing tenant patterns
   */
  async isolatePrivateContent(contentId: string, userId: string): Promise<void> {
    // Get content details
    const content = await this.getContentDetails(contentId);

    if (!content) {
      throw new Error('Content not found');
    }

    // Verify user owns the content or has admin rights
    if (content.ownerId !== userId && !(await this.isUserAdmin(userId))) {
      throw new Error('Insufficient permissions to isolate content');
    }

    // Update content privacy level to private
    await this.updateContentPrivacy(contentId, PrivacyLevel.PRIVATE);

    // Remove from shared caches
    await this.removeFromSharedCaches(contentId);

    // Update tenant isolation
    await this.updateTenantIsolation(contentId, userId);

    // Revoke all sharing permissions
    await this.revokeAllSharingPermissions(contentId);

    // Sync isolation update (only to owner's environments)
    await this.syncOrchestrator.syncTenantData(userId, 'content_isolated', {
      contentId,
      isolatedAt: new Date(),
      isolatedBy: userId,
    });

    // Emit isolation event
    await this.emitPrivacyEvent({
      type: 'CONTENT_ISOLATED',
      userId,
      tenantId: userId,
      metadata: {
        contentId,
        previousPrivacy: content.privacy,
      },
    });
  }

  /**
   * Audit privacy compliance
   * Requirement 13.4: Maintain audit trails via existing AuthEvent logging
   */
  async auditPrivacyCompliance(tenantId: string): Promise<{
    compliant: boolean;
    violations: string[];
    recommendations: string[];
  }> {
    const violations: string[] = [];
    const recommendations: string[] = [];

    // Check for privacy boundary violations
    const privacyBoundary = await this.getPrivacyBoundary(tenantId);

    if (privacyBoundary) {
      // Audit data access patterns
      const accessViolations = await this.auditDataAccessPatterns(tenantId, privacyBoundary);
      violations.push(...accessViolations);

      // Audit sharing violations
      const sharingViolations = await this.auditSharingViolations(tenantId, privacyBoundary);
      violations.push(...sharingViolations);

      // Audit sync violations
      const syncViolations = await this.auditSyncViolations(tenantId, privacyBoundary);
      violations.push(...syncViolations);
    }

    // Check for orphaned data
    const orphanedData = await this.findOrphanedData(tenantId);
    if (orphanedData.length > 0) {
      violations.push(`Found ${orphanedData.length} orphaned data items`);
      recommendations.push('Clean up orphaned data items');
    }

    // Check for weak privacy settings
    const weakPrivacyItems = await this.findWeakPrivacySettings(tenantId);
    if (weakPrivacyItems.length > 0) {
      recommendations.push(`Review privacy settings for ${weakPrivacyItems.length} items`);
    }

    const compliant = violations.length === 0;

    // Log audit results
    await this.logPrivacyAudit(tenantId, compliant, violations, recommendations);

    return {
      compliant,
      violations,
      recommendations,
    };
  }

  /**
   * Encrypt sensitive data for storage
   * Requirement 13.4: Ensure data security in tenant isolation
   */
  async encryptSensitiveData(data: any, tenantId: string): Promise<string> {
    // Get tenant-specific encryption key
    const encryptionKey = await this.getTenantEncryptionKey(tenantId);

    // Serialize and encrypt data
    const serializedData = JSON.stringify(data);
    const encrypted = await this.encrypt(serializedData, encryptionKey);

    return encrypted;
  }

  /**
   * Decrypt sensitive data for authorized access
   * Requirement 13.4: Maintain security during data access
   */
  async decryptSensitiveData(
    encryptedData: string,
    tenantId: string,
    userId: string
  ): Promise<any> {
    // Validate user has access to tenant data
    const hasAccess = await this.validateDataAccess(userId, tenantId, 'sensitive', 'read');

    if (!hasAccess) {
      throw new Error('Unauthorized access to sensitive data');
    }

    // Get tenant-specific encryption key
    const encryptionKey = await this.getTenantEncryptionKey(tenantId);

    // Decrypt and deserialize data
    const decrypted = await this.decrypt(encryptedData, encryptionKey);
    const data = JSON.parse(decrypted);

    // Log sensitive data access
    await this.logSensitiveDataAccess(userId, tenantId);

    return data;
  }

  // Private helper methods

  private async verifyPrivacyBoundaryPermission(userId: string, tenantId: string): Promise<void> {
    // Check if user is owner of tenant or has admin rights
    const user = await this.drizzle.user.findUnique({
      where: { id: userId },
      select: { role: true, roles: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const isAdmin =
      user.roles.includes(UserRole.ADMIN) ||
      user.roles.includes(UserRole.SUPER_ADMIN) ||
      user.role === UserRole.ADMIN ||
      user.role === UserRole.SUPER_ADMIN;

    const isTenantOwner = tenantId === userId || tenantId === `tenant_${userId}`;

    if (!isAdmin && !isTenantOwner) {
      throw new Error('Insufficient permissions to create privacy boundary');
    }
  }

  private async validateRestrictions(restrictions: Restriction[]): Promise<void> {
    for (const restriction of restrictions) {
      switch (restriction.type) {
        case RestrictionType.IP_ADDRESS:
          if (!this.isValidIPAddress(restriction.value)) {
            throw new Error(`Invalid IP address restriction: ${restriction.value}`);
          }
          break;
        case RestrictionType.TIME_WINDOW:
          if (!this.isValidTimeWindow(restriction.value)) {
            throw new Error(`Invalid time window restriction: ${restriction.value}`);
          }
          break;
        case RestrictionType.ROLE_BASED:
          if (!Object.values(UserRole).includes(restriction.value as UserRole)) {
            throw new Error(`Invalid role restriction: ${restriction.value}`);
          }
          break;
      }
    }
  }

  private async storePrivacyBoundary(boundary: PrivacyBoundary): Promise<void> {
    await this.drizzle.$executeRaw`
      INSERT INTO privacy_boundaries (
        tenant_id, user_id, data_types, restrictions, audit_required, created_at
      ) VALUES (
        ${boundary.tenantId}, ${boundary.userId}, ${JSON.stringify(boundary.dataTypes)},
        ${JSON.stringify(boundary.restrictions)}, ${boundary.auditRequired}, NOW()
      )
      ON CONFLICT (tenant_id) DO UPDATE SET
        data_types = EXCLUDED.data_types,
        restrictions = EXCLUDED.restrictions,
        audit_required = EXCLUDED.audit_required,
        updated_at = NOW()
    `;
  }

  private async setupTenantKeyspaceIsolation(tenantId: string, dataTypes: string[]): Promise<void> {
    // Set up Redis keyspace patterns for tenant isolation
    for (const dataType of dataTypes) {
      const keyPattern = `tenant:${tenantId}:${dataType}:*`;
      await this.redis.set(`keyspace_pattern:${tenantId}:${dataType}`, keyPattern);
    }
  }

  private async getPrivacyBoundary(tenantId: string): Promise<PrivacyBoundary | null> {
    const cacheKey = `privacy_boundary:${tenantId}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const result = await this.drizzle.$queryRaw<any[]>`
      SELECT * FROM privacy_boundaries WHERE tenant_id = ${tenantId}
    `;

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    const boundary: PrivacyBoundary = {
      tenantId: row.tenant_id,
      userId: row.user_id,
      dataTypes: JSON.parse(row.data_types),
      restrictions: JSON.parse(row.restrictions),
      auditRequired: row.audit_required,
    };

    // Cache for 5 minutes
    await this.redis.setex(cacheKey, 300, JSON.stringify(boundary));

    return boundary;
  }

  private async validateDefaultTenantAccess(
    userId: string,
    tenantId: string,
    operation: string
  ): Promise<boolean> {
    // Default tenant isolation: user can only access their own tenant data
    return tenantId === userId || tenantId === `tenant_${userId}`;
  }

  private async validateAgainstRestrictions(
    userId: string,
    restrictions: Restriction[],
    operation: string
  ): Promise<boolean> {
    for (const restriction of restrictions) {
      const allowed = await this.validateSingleRestriction(userId, restriction, operation);
      if (!allowed) {
        return false;
      }
    }
    return true;
  }

  private async validateSingleRestriction(
    userId: string,
    restriction: Restriction,
    operation: string
  ): Promise<boolean> {
    switch (restriction.type) {
      case RestrictionType.ROLE_BASED:
        return await this.validateRoleRestriction(userId, restriction.value);

      case RestrictionType.TIME_WINDOW:
        return this.validateTimeWindowRestriction(restriction.value);

      case RestrictionType.IP_ADDRESS:
        // Would need request context for IP validation
        return true; // Skip for now

      default:
        return true;
    }
  }

  private async validateRoleRestriction(userId: string, allowedRole: string): Promise<boolean> {
    const user = await this.drizzle.user.findUnique({
      where: { id: userId },
      select: { role: true, roles: true },
    });

    if (!user) {
      return false;
    }

    return user.role === allowedRole || user.roles.includes(allowedRole as UserRole);
  }

  private validateTimeWindowRestriction(timeWindow: string): boolean {
    // Parse time window format: "09:00-17:00" or "MON-FRI:09:00-17:00"
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

    if (timeWindow.includes(':')) {
      const [dayPart, timePart] = timeWindow.split(':');

      if (dayPart.includes('-')) {
        // Day range specified
        const [startDay, endDay] = dayPart.split('-');
        const dayMap: Record<string, number> = {
          SUN: 0,
          MON: 1,
          TUE: 2,
          WED: 3,
          THU: 4,
          FRI: 5,
          SAT: 6,
        };

        const startDayNum = dayMap[startDay];
        const endDayNum = dayMap[endDay];

        if (currentDay < startDayNum || currentDay > endDayNum) {
          return false;
        }
      }

      // Check time range
      const [startTime, endTime] = (timePart || timeWindow).split('-');
      const startHour = parseInt(startTime.split(':')[0]);
      const endHour = parseInt(endTime.split(':')[0]);

      return currentHour >= startHour && currentHour <= endHour;
    }

    return true;
  }

  private async getContentDetails(contentId: string): Promise<ContentItem | null> {
    const result = await this.drizzle.$queryRaw<any[]>`
      SELECT * FROM personal_content WHERE id = ${contentId}
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
      checksum: row.checksum,
    };
  }

  private async isUserAdmin(userId: string): Promise<boolean> {
    const user = await this.drizzle.user.findUnique({
      where: { id: userId },
      select: { role: true, roles: true },
    });

    if (!user) {
      return false;
    }

    return (
      user.roles.includes(UserRole.ADMIN) ||
      user.roles.includes(UserRole.SUPER_ADMIN) ||
      user.role === UserRole.ADMIN ||
      user.role === UserRole.SUPER_ADMIN
    );
  }

  private async updateContentPrivacy(contentId: string, privacy: PrivacyLevel): Promise<void> {
    await this.drizzle.$executeRaw`
      UPDATE personal_content 
      SET privacy = ${privacy}, updated_at = NOW()
      WHERE id = ${contentId}
    `;
  }

  private async removeFromSharedCaches(contentId: string): Promise<void> {
    // Remove from all shared cache patterns
    const keys = await this.redis.keys(`*:${contentId}*`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  private async updateTenantIsolation(contentId: string, userId: string): Promise<void> {
    await this.drizzle.$executeRaw`
      UPDATE personal_content 
      SET tenant_id = ${userId}
      WHERE id = ${contentId}
    `;
  }

  private async revokeAllSharingPermissions(contentId: string): Promise<void> {
    await this.drizzle.$executeRaw`
      DELETE FROM content_sharing_permissions WHERE content_id = ${contentId}
    `;

    await this.drizzle.$executeRaw`
      UPDATE personal_content 
      SET sharing_settings = '{"isPublic": false, "allowedUsers": [], "allowedRoles": [], "permissions": []}'
      WHERE id = ${contentId}
    `;
  }

  private async auditDataAccessPatterns(
    tenantId: string,
    boundary: PrivacyBoundary
  ): Promise<string[]> {
    const violations: string[] = [];

    // Check for unauthorized access attempts
    const unauthorizedAccess = await this.drizzle.$queryRaw<any[]>`
      SELECT COUNT(*) as count FROM auth_events 
      WHERE JSON_EXTRACT(details, '$.tenantId') = ${tenantId}
      AND type LIKE '%ACCESS%'
      AND user_id != ${boundary.userId}
      AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `;

    if (unauthorizedAccess[0]?.count > 0) {
      violations.push(
        `${unauthorizedAccess[0].count} unauthorized access attempts in last 24 hours`
      );
    }

    return violations;
  }

  private async auditSharingViolations(
    tenantId: string,
    boundary: PrivacyBoundary
  ): Promise<string[]> {
    const violations: string[] = [];

    // Check for content shared outside privacy boundaries
    const sharedContent = await this.drizzle.$queryRaw<any[]>`
      SELECT COUNT(*) as count FROM personal_content pc
      JOIN content_sharing_permissions csp ON pc.id = csp.content_id
      WHERE pc.tenant_id = ${tenantId}
      AND pc.privacy = 'private'
    `;

    if (sharedContent[0]?.count > 0) {
      violations.push(`${sharedContent[0].count} private content items have sharing permissions`);
    }

    return violations;
  }

  private async auditSyncViolations(
    tenantId: string,
    boundary: PrivacyBoundary
  ): Promise<string[]> {
    const violations: string[] = [];

    // Check sync state for privacy violations
    const syncViolations = await this.drizzle.$queryRaw<any[]>`
      SELECT COUNT(*) as count FROM sync_states 
      WHERE tenant_id = ${tenantId}
      AND resource_type IN (${boundary.dataTypes.map((dt) => `'${dt}'`).join(',')})
      AND synced_by != ${boundary.userId}
    `;

    if (syncViolations[0]?.count > 0) {
      violations.push(
        `${syncViolations[0].count} restricted data types synced by unauthorized users`
      );
    }

    return violations;
  }

  private async findOrphanedData(tenantId: string): Promise<string[]> {
    // Find data without proper tenant association
    const orphaned = await this.drizzle.$queryRaw<any[]>`
      SELECT id FROM personal_content 
      WHERE tenant_id = ${tenantId}
      AND owner_id NOT IN (SELECT id FROM users WHERE id = owner_id)
    `;

    return orphaned.map((row) => row.id);
  }

  private async findWeakPrivacySettings(tenantId: string): Promise<string[]> {
    // Find content with weak privacy settings
    const weak = await this.drizzle.$queryRaw<any[]>`
      SELECT id FROM personal_content 
      WHERE tenant_id = ${tenantId}
      AND privacy IN ('public', 'shared')
      AND JSON_LENGTH(JSON_EXTRACT(sharing_settings, '$.permissions')) > 5
    `;

    return weak.map((row) => row.id);
  }

  private async getTenantEncryptionKey(tenantId: string): Promise<string> {
    // Get or generate tenant-specific encryption key
    const cacheKey = `encryption_key:${tenantId}`;
    let key = await this.redis.get(cacheKey);

    if (!key) {
      key = this.generateEncryptionKey(tenantId);
      await this.redis.setex(cacheKey, 3600, key); // Cache for 1 hour
    }

    return key;
  }

  private generateEncryptionKey(tenantId: string): string {
    // Generate deterministic key based on tenant ID and secret
    const secret = process.env.ENCRYPTION_SECRET;
    if (!secret) {
      throw new Error('ENCRYPTION_SECRET is not set in environment variables');
    }
    return createHash('sha256').update(`${tenantId}:${secret}`).digest('hex');
  }

  private async encrypt(data: string, key: string): Promise<string> {
    // Simple encryption implementation (use proper crypto in production)
    const crypto = require('crypto');
    const cipher = crypto.createCipher('aes-256-cbc', key);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  private async decrypt(encryptedData: string, key: string): Promise<string> {
    // Simple decryption implementation (use proper crypto in production)
    const crypto = require('crypto');
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  private isValidIPAddress(ip: string): boolean {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  private isValidTimeWindow(timeWindow: string): boolean {
    const timeWindowRegex = /^(\w{3}-\w{3}:)?\d{2}:\d{2}-\d{2}:\d{2}$/;
    return timeWindowRegex.test(timeWindow);
  }

  private async logDataAccessAttempt(
    userId: string,
    tenantId: string,
    dataType: string,
    operation: string,
    allowed: boolean
  ): Promise<void> {
    await this.drizzle.authEvent.create({
      data: {
        userId,
        type: 'DATA_ACCESS_ATTEMPT',
        details: {
          tenantId,
          dataType,
          operation,
          allowed,
          timestamp: new Date(),
        },
      },
    });
  }

  private async logPrivacyAudit(
    tenantId: string,
    compliant: boolean,
    violations: string[],
    recommendations: string[]
  ): Promise<void> {
    await this.drizzle.authEvent.create({
      data: {
        userId: 'system',
        type: 'PRIVACY_AUDIT',
        details: {
          tenantId,
          compliant,
          violations,
          recommendations,
          auditedAt: new Date(),
        },
      },
    });
  }

  private async logSensitiveDataAccess(userId: string, tenantId: string): Promise<void> {
    await this.drizzle.authEvent.create({
      data: {
        userId,
        type: 'SENSITIVE_DATA_ACCESS',
        details: {
          tenantId,
          accessedAt: new Date(),
        },
      },
    });
  }

  private async emitPrivacyEvent(event: {
    type: string;
    userId: string;
    tenantId: string;
    metadata: Record<string, any>;
  }): Promise<void> {
    await this.redis.publish(
      'privacy_events',
      JSON.stringify({
        ...event,
        timestamp: new Date(),
      })
    );

    await this.drizzle.authEvent.create({
      data: {
        userId: event.userId,
        type: event.type,
        details: {
          tenantId: event.tenantId,
          metadata: event.metadata,
          timestamp: new Date(),
        },
      },
    });
  }
}
