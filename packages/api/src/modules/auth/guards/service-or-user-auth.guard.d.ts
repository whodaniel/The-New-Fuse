import { CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ApiKeyAuthGuard } from './api-key-auth.guard';
export declare class ServiceOrUserAuthGuard implements CanActivate {
    private readonly jwtGuard;
    private readonly apiKeyGuard;
    private readonly logger;
    constructor(jwtGuard: JwtAuthGuard, apiKeyGuard: ApiKeyAuthGuard);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
//# sourceMappingURL=service-or-user-auth.guard.d.ts.map