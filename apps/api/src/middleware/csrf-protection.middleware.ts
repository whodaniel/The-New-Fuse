import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'node:crypto';

@Injectable()
export class CsrfProtectionMiddleware implements NestMiddleware {
  private csrfToken: string;
  private tokenStore: Map<string, { token: string; expires: number }> = new Map();

  constructor(private configService: ConfigService) {
    this.csrfToken = this.configService.get<string>('CSRF_SECRET') || crypto.randomBytes(32).toString('hex');
  }

  use(req: Request, res: Response, next: NextFunction): void {
    // Skip CSRF check for safe methods and external APIs
    if (this.shouldSkipCsrfCheck(req)) {
      return next();
    }

    // Generate or retrieve CSRF token for session
    const sessionId = this.getSessionId(req);
    if (!sessionId) {
      throw new UnauthorizedException('No session found');
    }

    // Check if token exists and is valid
    const tokenEntry = this.tokenStore.get(sessionId);
    if (!tokenEntry || tokenEntry.expires < Date.now()) {
      // Generate new token
      const newToken = this.generateCsrfToken();
      this.tokenStore.set(sessionId, {
        token: newToken,
        expires: Date.now() + (30 * 60 * 1000) // 30 minutes
      });

      // Set token in response cookie
      this.setCsrfCookie(res, newToken);
      
      if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
        throw new UnauthorizedException('CSRF token required');
      }
    }

    // For state-changing requests, validate CSRF token
    if (this.isStateChangingRequest(req)) {
      const csrfToken = this.extractCsrfToken(req);
      if (!csrfToken || !this.validateCsrfToken(sessionId, csrfToken)) {
        throw new UnauthorizedException('Invalid CSRF token');
      }
    }

    // Add CSRF token to response headers for forms
    this.addCsrfTokenToResponse(res, sessionId);

    next();
  }

  private shouldSkipCsrfCheck(req: Request): boolean {
    const skipPaths = [
      '/api/webhooks',
      '/api/health',
      '/api/docs',
      '/api/auth/refresh',
      '/api/auth/login'
    ];

    // Skip for safe methods
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (safeMethods.includes(req.method)) {
      return true;
    }

    // Skip for specified paths
    return skipPaths.some(path => req.path.startsWith(path));
  }

  private isStateChangingRequest(req: Request): boolean {
    const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    return stateChangingMethods.includes(req.method);
  }

  private getSessionId(req: Request): string | null {
    // Try to get session ID from various sources
    return (
      req.sessionID ||
      req.cookies?.sessionId ||
      req.headers['x-session-id'] as string ||
      this.extractSessionFromAuthHeader(req.headers.authorization)
    );
  }

  private extractSessionFromAuthHeader(authHeader: string | undefined): string | null {
    if (!authHeader) return null;

    // Extract session from JWT or other auth tokens
    try {
      const token = authHeader.replace('Bearer ', '');
      // Simple session extraction - in real implementation, decode JWT
      return crypto.createHash('sha256').update(token).digest('hex').substring(0, 16);
    } catch {
      return null;
    }
  }

  private generateCsrfToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private validateCsrfToken(sessionId: string, token: string): boolean {
    const tokenEntry = this.tokenStore.get(sessionId);
    if (!tokenEntry) {
      return false;
    }

    // Check if token matches and hasn't expired
    const isValid = tokenEntry.token === token && tokenEntry.expires > Date.now();

    // Rotate token on successful validation - token has been validated, store new one for next request
    if (isValid) {
      const newToken = this.generateCsrfToken();
      this.tokenStore.set(sessionId, {
        token: newToken,
        expires: Date.now() + (30 * 60 * 1000) // 30 minutes
      });
      // Note: Can't update cookie here as we don't have access to Response object
      // The new token will be set in addCsrfTokenToResponse
    }

    return isValid;
  }

  private extractCsrfToken(req: Request): string | null {
    // Try to get token from header
    const headerToken = req.headers['x-csrf-token'] as string;
    if (headerToken) {
      return headerToken;
    }

    // Try to get token from body
    if (req.body && req.body._csrf) {
      return req.body._csrf;
    }

    // Try to get token from query
    if (req.query && (req.query.csrfToken || req.query._csrf)) {
      return req.query.csrfToken as string || req.query._csrf as string;
    }

    return null;
  }

  private setCsrfCookie(res: Response, token: string): void {
    res.cookie('XSRF-TOKEN', token, {
      httpOnly: false, // Must be accessible to JavaScript
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 60 * 1000, // 30 minutes
      path: '/'
    });
  }

  private addCsrfTokenToResponse(res: Response, sessionId: string): void {
    const tokenEntry = this.tokenStore.get(sessionId);
    if (tokenEntry) {
      res.setHeader('X-CSRF-Token', tokenEntry.token);
    }
  }

  /**
   * Clean up expired tokens (should be called periodically)
   */
  cleanupExpiredTokens(): void {
    const now = Date.now();
    for (const [sessionId, tokenEntry] of this.tokenStore.entries()) {
      if (tokenEntry.expires < now) {
        this.tokenStore.delete(sessionId);
      }
    }
  }

  /**
   * Invalidate all tokens for a session
   */
  invalidateSessionTokens(sessionId: string): void {
    this.tokenStore.delete(sessionId);
  }
}

// Decorator to skip CSRF validation for specific routes
// Uses Reflect metadata to mark methods that should skip CSRF validation
const SKIP_CSRF_KEY = 'skipCsrfValidation';

export function SkipCsrfValidation() {
  return function (target: any, propertyKey: string, _descriptor: PropertyDescriptor) {
    // Store the skip flag in metadata
    Reflect.defineMetadata(SKIP_CSRF_KEY, true, target, propertyKey);
  };
}

// Helper to check if a method should skip CSRF validation
export function shouldSkipCsrf(target: any, propertyKey: string): boolean {
  return Reflect.getMetadata(SKIP_CSRF_KEY, target, propertyKey) === true;
}

// Global utility to generate CSRF token for testing
export function generateTestCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}