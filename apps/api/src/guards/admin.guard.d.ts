import { CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthService } from '../auth/auth.service.js';
export declare class AdminGuard implements CanActivate {
    private readonly authService;
    constructor(authService: AuthService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
