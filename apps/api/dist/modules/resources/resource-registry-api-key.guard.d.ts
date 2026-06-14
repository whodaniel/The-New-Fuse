import { CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class ResourceRegistryApiKeyGuard implements CanActivate {
    private readonly configService;
    constructor(configService: ConfigService);
    canActivate(context: ExecutionContext): boolean;
    private readConfigValues;
    private normalizeHeader;
}
//# sourceMappingURL=resource-registry-api-key.guard.d.ts.map