import { Injectable, Logger } from '@nestjs/common';
import { AuditLogEntry, AuditLogQuery, drizzleAuditLogsRepository } from '@the-new-fuse/database';

@Injectable()
export class AuditLogsService {
  private readonly logger = new Logger(AuditLogsService.name);

  async create(data: AuditLogEntry): Promise<AuditLogEntry> {
    try {
      return await drizzleAuditLogsRepository.create(data);
    } catch (error) {
      this.logger.error(`Failed to create audit log: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(query: AuditLogQuery): Promise<{ data: AuditLogEntry[]; total: number }> {
    try {
      const [data, total] = await Promise.all([
        drizzleAuditLogsRepository.findAll(query),
        drizzleAuditLogsRepository.count(query),
      ]);

      return { data, total };
    } catch (error) {
      this.logger.error(`Failed to find audit logs: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findById(id: string): Promise<AuditLogEntry | null> {
    try {
      return await drizzleAuditLogsRepository.findById(id);
    } catch (error) {
      this.logger.error(`Failed to find audit log ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getStatistics(startDate?: Date, endDate?: Date) {
    try {
      return await drizzleAuditLogsRepository.getStatistics(startDate, endDate);
    } catch (error) {
      this.logger.error(`Failed to get audit log statistics: ${error.message}`, error.stack);
      throw error;
    }
  }
}
