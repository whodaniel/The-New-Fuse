/**
 * Admin Audit Logs Service
 *
 * Service for retrieving and managing audit logs in the admin panel.
 */

import { Injectable } from '@nestjs/common';
import {
  AuditLogEntry,
  AuditLogQuery,
  AuditLogsRepository,
} from '../repositories/audit-logs.repository';

@Injectable()
export class AdminAuditLogsService {
  constructor(private readonly auditLogsRepository: AuditLogsRepository) {}

  /**
   * Get all audit logs with filters
   */
  async getAuditLogs(query: AuditLogQuery): Promise<{ data: AuditLogEntry[]; total: number }> {
    const [data, total] = await Promise.all([
      this.auditLogsRepository.findAll(query),
      this.auditLogsRepository.count(query),
    ]);

    return { data, total };
  }

  /**
   * Get audit log by ID
   */
  async getAuditLogById(id: string): Promise<AuditLogEntry | null> {
    return this.auditLogsRepository.findById(id);
  }

  /**
   * Get audit log statistics
   */
  async getStatistics(startDate?: Date, endDate?: Date) {
    return this.auditLogsRepository.getStatistics(startDate, endDate);
  }

  /**
   * Create an audit log manually (if needed by admin)
   */
  async createAuditLog(data: AuditLogEntry): Promise<AuditLogEntry> {
    return this.auditLogsRepository.create(data);
  }
}
