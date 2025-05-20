/**
 * JWT Authentication Guard
 * Protects API routes requiring authentication
 */

import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import { toError } from '../../utils/error.js'; // Import the helper

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly jwtService: JwtService) {
    super();
  }

  /**
   * Check if the request is authorized
   * @param context Execution context
   * @returns Boolean indicating if request is allowed
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Add custom authorization logic here
    try {
      // Perform default JWT authentication
      const result = await super.canActivate(context);

      if (!result) {
        throw new UnauthorizedException('Invalid or expired token');
      }
      
      return true;
    } catch (error) {
      throw new UnauthorizedException('Authentication failed: ' + error.message);
    }
  }

  /**
   * Handle request rejection
   * @param error Error that occurred during authentication
   */
  handleRequest(err: any, user: any, info: any, context: ExecutionContext, status?: any) {
    // You can throw an exception based on either "info" or "err" arguments
    if (err || !user) {
      let errorMessage = 'Authentication failed';
      if (info instanceof Error) {
        errorMessage += `: ${info.message}`;
      } else if (err) {
        try {
          const errorObj = toError(err); // Use helper
          errorMessage += `: ${errorObj.message}`;
        } catch (parseError: unknown) { // Add inner catch with unknown
          const parseErr = toError(parseError); // Use helper
          errorMessage += `: Invalid error object (${parseErr.message})`;
        }
      } else if (info) {
         errorMessage += `: ${String(info)}`;
      }
      
      // Use toError for the original error if it exists
      const originalError = err ? toError(err) : new Error(String(info || 'No user'));
      throw err || new UnauthorizedException(errorMessage, originalError.stack);
    }
    return user;
  }
}
