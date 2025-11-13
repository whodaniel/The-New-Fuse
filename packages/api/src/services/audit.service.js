var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AuditService_1;
import { Injectable, Logger } from '@nestjs/common';
let AuditService = AuditService_1 = class AuditService {
    logger = new Logger(AuditService_1.name);
    async logEvent(event) {
        try {
            const auditLog = {
                ...event,
                timestamp: event.timestamp || new Date(),
                id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}
      };
`,
                this: .logger.log(AUDIT, $, { event, : .action } ` by user ${event.userId}` `, {
        auditId: auditLog.id,
        action: event.action,
        userId: event.userId,
        timestamp: auditLog.timestamp,
        metadata: event.metadata,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent
      });

      // In a real implementation, you would store this in a database
      // await this.prisma.auditLog.create({ data: auditLog });
    } catch (error) {
      this.logger.error('Failed to log audit event:', error);
    }
  }
})
            };
        }
        finally { }
    }
};
AuditService = AuditService_1 = __decorate([
    Injectable()
], AuditService);
export { AuditService };
//# sourceMappingURL=audit.service.js.map