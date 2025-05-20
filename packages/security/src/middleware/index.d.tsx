import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest, User } from '../auth/types.js';

export interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
    message?: string;
}

export interface SecurityMiddlewareConfig {
    csrf?: boolean;
    helmet?: boolean;
    rateLimit?: RateLimitConfig;
    cors?: {
        origin: string | string[];
        methods?: string[];
    };
}

export type AuthMiddleware = (req: Request, res: Response, next: NextFunction) => Promise<void>;
export type RoleCheckMiddleware = (roles: string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export type PermissionCheckMiddleware = (permissions: string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;

export interface SecurityHeaders {
    'X-Frame-Options': string;
    'X-XSS-Protection': string;
    'X-Content-Type-Options': string;
    'Strict-Transport-Security': string;
    'Content-Security-Policy': string;
    'Referrer-Policy': string;
}

export type { AuthenticatedRequest, User };
