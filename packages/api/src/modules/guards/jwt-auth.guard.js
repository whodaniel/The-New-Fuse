/**
 * JWT Authentication Guard
 * Protects API routes requiring authentication
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { toError } from '../../utils/error'; // Import the helper
let JwtAuthGuard = class JwtAuthGuard extends AuthGuard('jwt') {
    jwtService;
    constructor(jwtService) {
        super();
        this.jwtService = jwtService;
    }
    /**
     * Check if the request is authorized
     * @param context Execution context
     * @returns Boolean indicating if request is allowed
     */
    async canActivate(context) {
        // Add custom authorization logic here
        try {
            // Perform default JWT authentication
            const result = await super.canActivate(context);
            if (!result) {
                throw new UnauthorizedException('Invalid or expired token');
            }
            return true;
        }
        catch (error) {
            throw new UnauthorizedException('Authentication failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    }
    /**
     * Handle request rejection
     * @param error Error that occurred during authentication
     */
    handleRequest(err, user, info, _context, _status) {
        // You can throw an exception based on either "info" or "err" arguments
        if (err || !user) {
            let errorMessage = 'Authentication failed';
            if (info instanceof Error) {
                errorMessage += `: ${info.message};
      } else if (err) {
        try {
          const errorObj = toError(err); // Use helper`;
                errorMessage += `: ${errorObj.message}`;
            }
            try { }
            catch (parseError) { // Add inner catch with unknown
                const parseErr = toError(parseError); // Use helper
                errorMessage += ;
                Invalid;
                error;
                object($, { parseErr, : .message });
            }
        }
        else if (info) {
            `
         errorMessage += : ${String(info)}` `;
      }
      
      // Use toError for the original error if it exists
      const originalError = err ? toError(err) : new Error(String(info || 'No user'));
      throw err || new UnauthorizedException(errorMessage, originalError.stack);
    }
    return user;
  }
}
            ;
        }
    }
};
JwtAuthGuard = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [JwtService])
], JwtAuthGuard);
export { JwtAuthGuard };
//# sourceMappingURL=jwt-auth.guard.js.map