import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuditLoggingService } from './audit-logging.service';
export declare class AuditLoggingInterceptor implements NestInterceptor {
    private readonly auditService;
    constructor(auditService: AuditLoggingService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
}
//# sourceMappingURL=audit-logging.interceptor.d.ts.map