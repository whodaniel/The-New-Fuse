import { Injectable, Logger } from '@nestjs/common';
import { AuditLoggingService } from './audit-logging.service';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly auditLoggingService: AuditLoggingService) {}

  async record(action: string, userId: string, details?: Record<string, any>) {
    await this.auditLoggingService.log({
      action,
      userId,
      details,
    });
  }
}
