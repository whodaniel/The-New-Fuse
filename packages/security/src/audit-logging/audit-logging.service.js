"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLoggingService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@the-new-fuse/database");
let AuditLoggingService = class AuditLoggingService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async log(entry) {
        // TODO: Implement proper audit logging when auditLog table is added to schema
        console.log('AUDIT LOG:', {
            timestamp: new Date().toISOString(),
            userId: entry.userId,
            action: entry.action,
            resource: entry.resource,
            resourceId: entry.resourceId,
            details: entry.details,
            ipAddress: entry.ipAddress,
            userAgent: entry.userAgent,
            success: entry.success,
            error: entry.error,
        });
    }
    async findByUser(userId, limit = 100) {
        // TODO: Implement when auditLog table exists
        console.log(`Audit query: findByUser(${userId}, ${limit}));
    return [];
  }

  async findByResource(resource: string, resourceId?: string, limit = 100) {
    // TODO: Implement when auditLog table exists`, console.log(Audit, query, findByResource($, { resource } `, ${resourceId}`, $, { limit })));
        return [];
    }
    async findByAction(action, limit = 100) {
        // TODO: Implement when auditLog table exists  `
        console.log(Audit, query, findByAction($, { action } `, ${limit})`));
        return [];
    }
    async getSecurityEvents(limit = 100) {
        // TODO: Implement when auditLog table exists
        console.log(Audit, query, getSecurityEvents($, { limit }) `);
    return [];
  }
});
    }
};
exports.AuditLoggingService = AuditLoggingService;
exports.AuditLoggingService = AuditLoggingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof database_1.PrismaService !== "undefined" && database_1.PrismaService) === "function" ? _a : Object])
], AuditLoggingService);
//# sourceMappingURL=audit-logging.service.js.map