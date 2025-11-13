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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLoggingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const audit_logging_service_1 = require("./audit-logging.service");
let AuditLoggingInterceptor = class AuditLoggingInterceptor {
    auditService;
    constructor(auditService) {
        this.auditService = auditService;
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const user = request.user;
        const method = request.method;
        const url = request.url;
        const ipAddress = request.ip || request.connection.remoteAddress;
        const userAgent = request.headers['user-agent'];
        const startTime = Date.now();
        return next.handle().pipe((0, operators_1.tap)(async (data) => {
            const duration = Date.now() - startTime;
            await this.auditService.log({
                userId: user?.id,
                action: `${method}:${url},
          resource: this.extractResource(url),
          resourceId: this.extractResourceId(url),
          details: {
            method,
            url,
            statusCode: response.statusCode,
            duration,
            response: data,
          },
          ipAddress,
          userAgent,
          success: true,
        });
      }),
      catchError(async (error) => {
        const duration = Date.now() - startTime;
        
        await this.auditService.log({
          userId: user?.id,`,
                action: $
            }, { method } `:${url}` `,
          resource: this.extractResource(url),
          resourceId: this.extractResourceId(url),
          details: {
            method,
            url,
            statusCode: error.status || 500,
            duration,
            error: error.message,
          },
          ipAddress,
          userAgent,
          success: false,
          error: error.message,
        });
        
        throw error;
      }),
    );
  }

  private extractResource(url: string): string {
    const parts = url.split('/').filter(Boolean);
    return parts[0] || 'unknown';
  }

  private extractResourceId(url: string): string | undefined {
    const parts = url.split('/').filter(Boolean);
    return parts.length > 1 && !isNaN(Number(parts[parts.length - 1]))
      ? parts[parts.length - 1]
      : undefined;
  }
});
        }));
    }
};
exports.AuditLoggingInterceptor = AuditLoggingInterceptor;
exports.AuditLoggingInterceptor = AuditLoggingInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [audit_logging_service_1.AuditLoggingService])
], AuditLoggingInterceptor);
//# sourceMappingURL=audit-logging.interceptor.js.map