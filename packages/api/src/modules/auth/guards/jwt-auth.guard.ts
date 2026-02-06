/**
 * JWT Auth Guard for NestJS authentication
 */

import { ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor() {
    super();
  }

  /**
   * Handle JWT authentication
   * @param context The execution context
   * @returns Promise<boolean> Whether the user is authenticated
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      // Call the parent canActivate which will set the user if successful
      const result = await super.canActivate(context);

      if (result) {
        const request = context.switchToHttp().getRequest();
        this.logger.debug(`User authenticated: ${request.user?.username || request.user?.id}`);
      }

      return result as boolean;
    } catch (error: any) {
      this.logger.debug(`JWT authentication failed: ${error.message}`);
      throw new UnauthorizedException('Authentication failed: ' + error.message);
    }
  }
}
