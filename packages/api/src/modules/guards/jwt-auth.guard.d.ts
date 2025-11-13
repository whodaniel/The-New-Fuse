/**
 * JWT Authentication Guard
 * Protects API routes requiring authentication
 */
import { ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
declare const JwtAuthGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class JwtAuthGuard extends JwtAuthGuard_base {
    private readonly jwtService;
    constructor(jwtService: JwtService);
    /**
     * Check if the request is authorized
     * @param context Execution context
     * @returns Boolean indicating if request is allowed
     */
    canActivate(context: ExecutionContext): Promise<boolean>;
    /**
     * Handle request rejection
     * @param error Error that occurred during authentication
     */
    handleRequest(err: any, user: any, info: any, _context: ExecutionContext, _status?: any): void;
}
export {};
//# sourceMappingURL=jwt-auth.guard.d.ts.map