import { Injectable } from '@nestjs/common';
import {
  AuditLogEntry,
  AuditLogQuery,
  drizzleAuditLogsRepository,
} from '@the-new-fuse/database/drizzle/repositories';

@Injectable()
export class AuditService {
  constructor(private readonly auditLogsRepository = drizzleAuditLogsRepository) {}

  /**
   * Create an audit log entry
   */
  async log(
    action: string,
    data: {
      userId?: string;
      resourceType?: string;
      resourceId?: string;
      details?: any;
      ipAddress?: string;
      userAgent?: string;
      status?: string;
      errorMessage?: string;
      metadata?: any;
    }
  ): Promise<AuditLogEntry> {
    return this.auditLogsRepository.create({
      action,
      ...data,
    });
  }

  /**
   * Get all audit logs with optional filtering and pagination
   */
  async getLogs(query?: AuditLogQuery): Promise<AuditLogEntry[]> {
    return this.auditLogsRepository.findAll(query);
  }

  /**
   * Get audit logs with pagination
   */
  async findAll(limit?: number, offset?: number): Promise<AuditLogEntry[]> {
    return this.auditLogsRepository.findAll({ limit, offset });
  }

  /**
   * Find audit log by ID
   */
  async findById(id: string): Promise<AuditLogEntry | null> {
    return this.auditLogsRepository.findById(id);
  }

  /**
   * Get audit logs for a specific user
   */
  async findByUserId(userId: string, limit?: number): Promise<AuditLogEntry[]> {
    return this.auditLogsRepository.findByUserId(userId, limit);
  }

  /**
   * Get audit logs for a specific resource
   */
  async findByResource(
    resourceType: string,
    resourceId: string,
    limit?: number
  ): Promise<AuditLogEntry[]> {
    return this.auditLogsRepository.findByResource(resourceType, resourceId, limit);
  }

  /**
   * Get audit log statistics
   */
  async getStatistics(startDate?: Date, endDate?: Date) {
    return this.auditLogsRepository.getStatistics(startDate, endDate);
  }

  /**
   * Count audit logs with filters
   */
  async count(query?: AuditLogQuery): Promise<number> {
    return this.auditLogsRepository.count(query);
  }
}
