import { ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SecurityLoggingService } from '../../security/security-logging.service';
export declare class GqlAuthGuard {
    private jwtService;
    private securityLogging;
    constructor(jwtService: JwtService, securityLogging: SecurityLoggingService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private getClientIP;
}
//# sourceMappingURL=gql-auth.guard.d.ts.map