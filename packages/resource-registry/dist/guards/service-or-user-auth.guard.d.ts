import { CanActivate, ExecutionContext } from '@nestjs/common';
/**
 * Temporary permissive guard to allow compilation without external auth module.
 * Replace with real implementation when integrating with the auth package.
 */
export declare class ServiceOrUserAuthGuard implements CanActivate {
    canActivate(_context: ExecutionContext): boolean | Promise<boolean>;
}
//# sourceMappingURL=service-or-user-auth.guard.d.ts.map