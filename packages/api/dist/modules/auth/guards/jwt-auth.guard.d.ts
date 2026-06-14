/**
 * JWT Auth Guard for NestJS authentication
 */
import { ExecutionContext } from '@nestjs/common';
declare const JwtAuthGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class JwtAuthGuard extends JwtAuthGuard_base {
    private readonly logger;
    constructor();
    /**
     * Handle JWT authentication
     * @param context The execution context
     * @returns Promise<boolean> Whether the user is authenticated
     */
    canActivate(context: ExecutionContext): Promise<boolean>;
}
export {};
//# sourceMappingURL=jwt-auth.guard.d.ts.map