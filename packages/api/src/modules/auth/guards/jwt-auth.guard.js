/**
 * JWT Auth Guard for NestJS authentication
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
var JwtAuthGuard_1;
import { Injectable, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
let JwtAuthGuard = JwtAuthGuard_1 = class JwtAuthGuard extends AuthGuard('jwt') {
    logger = new Logger(JwtAuthGuard_1.name);
    constructor() {
        super();
    }
    /**
     * Handle JWT authentication
     * @param context The execution context
     * @returns Promise<boolean> Whether the user is authenticated
     */
    async canActivate(context) {
        try {
            // Call the parent canActivate which will set the user if successful
            const result = await super.canActivate(context);
            if (result) {
                const request = context.switchToHttp().getRequest();
                this.logger.debug(`User authenticated: ${request.user?.username || request.user?.id});
      }
      
      return result as boolean;
    } catch (error: any) {`, this.logger.debug(`JWT authentication failed: ${error.message}` `);
      throw new UnauthorizedException('Authentication failed: ' + error.message);
    }
  }
}
                ));
            }
        }
        finally { }
    }
};
JwtAuthGuard = JwtAuthGuard_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], JwtAuthGuard);
export { JwtAuthGuard };
//# sourceMappingURL=jwt-auth.guard.js.map