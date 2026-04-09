import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

/**
 * Temporary permissive guard to allow compilation without external auth module.
 * Replace with real implementation when integrating with the auth package.
 */
@Injectable()
export class ServiceOrUserAuthGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean | Promise<boolean> {
    return true;
  }
}
