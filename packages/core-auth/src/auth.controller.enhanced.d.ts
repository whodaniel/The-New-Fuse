/**
 * Enhanced Auth Controller with OAuth Support
 *
 * Add these endpoints to your existing auth.controller.ts
 */
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    /**
     * Initiate Google OAuth flow
     */
    googleLogin(): Promise<void>;
    /**
     * Google OAuth callback
     */
    googleCallback(req: Request, res: Response): Promise<void>;
    /**
     * Request password reset email
     */
    forgotPassword(email: string): Promise<{
        message: string;
    }>;
    /**
     * Reset password with token
     */
    resetPassword(token: string, password: string): Promise<{
        message: string;
    }>;
    /**
     * Resend verification email
     */
    resendVerification(req: Request): Promise<{
        message: string;
    }>;
    /**
     * Verify email with token
     */
    verifyEmail(token: string): Promise<{
        message: string;
    }>;
    /**
     * Get current user
     */
    getCurrentUser(req: Request): Promise<{
        id: any;
        email: any;
        name: any;
        avatarUrl: any;
        emailVerified: any;
        twoFactorEnabled: any;
        role: any;
    }>;
    /**
     * Logout (invalidate session)
     */
    logout(req: Request): Promise<{
        message: string;
    }>;
}
//# sourceMappingURL=auth.controller.enhanced.d.ts.map