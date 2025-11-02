import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditLog {
  action: string;
  userId?: string;
  details?: Record<string, any>;
  timestamp?: Date;
}

@Injectable()
export class AuditLoggingService {
  private readonly logger = new Logger(AuditLoggingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(log: AuditLog) {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: log.action,
          userId: log.userId,
          details: log.details as any,
        },
      });
      this.logger.log(`Audit log created: ${log.action}`);
    } catch (error) {
      this.logger.error('Failed to create audit log', error.stack);
    }
  }
}
