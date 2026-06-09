import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { InputSanitizationService } from '../security/input-sanitization.service';
import { ResponseSanitizationService } from '../security/response-sanitization.service';

interface RateLimitOptions {
  requests: number;
  window: number;
}

interface SecurityOptions {
  requireAuth: boolean;
  roles: string[];
  permissions: string[];
  rateLimit: RateLimitOptions;
  sanitizeInput: boolean;
  validateCSRF: boolean;
  strictMode: boolean;
}

@Injectable()
export class SecurityGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private sanitizationService: InputSanitizationService,
    private responseSanitization: ResponseSanitizationService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Get security requirements from decorators
    const securityOptions = this.getSecurityOptions(context);
    
    // Rate limiting check
    await this.checkRateLimit(request, response, securityOptions.rateLimit);

    // Input validation and sanitization
    this.validateAndSanitizeInput(request, securityOptions);

    // Add security headers
    this.addSecurityHeaders(response);

    // Add request tracking
    this.addRequestTracking(request, response);

    // Pre-response processing
    this.prepareForResponse(request, response);

    return true;
  }

  private getSecurityOptions(context: ExecutionContext): SecurityOptions {
    return {
      requireAuth: this.reflector.get<boolean>('requireAuth', context.getHandler()) || false,
      roles: this.reflector.get<string[]>('roles', context.getHandler()) || [],
      permissions: this.reflector.get<string[]>('permissions', context.getHandler()) || [],
      rateLimit: this.reflector.get<RateLimitOptions>('rateLimit', context.getHandler()) || { requests: 100, window: 60000 },
      sanitizeInput: this.reflector.get<boolean>('sanitizeInput', context.getHandler()) || true,
      validateCSRF: this.reflector.get<boolean>('validateCSRF', context.getHandler()) || false,
      strictMode: this.reflector.get<boolean>('strictMode', context.getHandler()) || false,
    };
  }

  private async checkRateLimit(request: Request, response: Response, options: RateLimitOptions): Promise<void> {
    const clientIP = this.getClientIP(request);
    const userAgent = request.headers['user-agent'] || 'unknown';
    const key = `${clientIP}:${userAgent}`;
    const now = Date.now();
    const maxRequests = this.resolvePositiveInteger(process.env.API_RATE_LIMIT_REQUESTS, options.requests, 1, 1_000_000);
    const windowMs = this.resolvePositiveInteger(process.env.API_RATE_LIMIT_WINDOW_MS, options.window, 1_000, 86_400_000);
    const maxEntries = this.resolvePositiveInteger(process.env.API_RATE_LIMIT_MAX_KEYS, 10_000, 100, 1_000_000);

    if (!request.app.locals.rateLimit) {
      request.app.locals.rateLimit = new Map();
    }
    
    const rateLimitData: Map<string, { count: number; resetTime: number }> = request.app.locals.rateLimit;
    this.pruneRateLimitData(rateLimitData, now, maxEntries);

    const userData = rateLimitData.get(key) || { count: 0, resetTime: now + windowMs };
    
    if (now > userData.resetTime) {
      userData.count = 0;
      userData.resetTime = now + windowMs;
    }
    
    userData.count++;
    rateLimitData.set(key, userData);

    const remaining = Math.max(0, maxRequests - userData.count);
    const retryAfterSeconds = Math.max(1, Math.ceil((userData.resetTime - now) / 1000));
    response.setHeader('X-RateLimit-Limit', String(maxRequests));
    response.setHeader('X-RateLimit-Remaining', String(remaining));
    response.setHeader('X-RateLimit-Reset', String(Math.ceil(userData.resetTime / 1000)));
    
    if (userData.count > maxRequests) {
      response.setHeader('Retry-After', String(retryAfterSeconds));
      throw new HttpException('Rate limit exceeded. Please try again later.', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  private resolvePositiveInteger(value: string | undefined, fallback: number, min: number, max: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
    return Math.min(Math.max(Math.floor(parsed), min), max);
  }

  private pruneRateLimitData(rateLimitData: Map<string, { count: number; resetTime: number }>, now: number, maxEntries: number): void {
    if (rateLimitData.size <= maxEntries) {
      return;
    }

    for (const [key, entry] of rateLimitData.entries()) {
      if (entry.resetTime <= now || rateLimitData.size > maxEntries) {
        rateLimitData.delete(key);
      }
    }
  }

  private validateAndSanitizeInput(request: Request, options: any): void {
    // Sanitize all input data
    if (options.sanitizeInput) {
      // Sanitize query parameters
      if (request.query && typeof request.query === 'object') {
        Object.keys(request.query).forEach(key => {
          if (typeof request.query[key] === 'string') {
            (request.query as any)[key] = this.sanitizationService.sanitizeText(request.query[key] as string);
          }
        });
      }

      // Sanitize body
      if (request.body && typeof request.body === 'object') {
        request.body = this.sanitizationService.sanitizeObject(request.body);
      }

      // Sanitize params
      if (request.params && typeof request.params === 'object') {
        Object.keys(request.params).forEach(key => {
          if (typeof request.params[key] === 'string') {
            request.params[key] = this.sanitizationService.sanitizeText(request.params[key]);
          }
        });
      }
    }

    // Validate required authentication
    if (options.requireAuth && !this.isAuthenticated(request)) {
      throw new UnauthorizedException('Authentication required');
    }

    // Validate roles and permissions
    if (options.requireAuth && (options.roles.length > 0 || options.permissions.length > 0)) {
      this.validateAuthorization(request, options);
    }

    // CSRF validation for state-changing requests
    if (options.validateCSRF && this.isStateChangingRequest(request)) {
      this.validateCSRFToken(request);
    }
  }

  private addSecurityHeaders(response: Response): void {
    // Security headers are already added by the middleware
    // This is a backup to ensure they're set
    if (!response.getHeader('Content-Security-Policy')) {
      response.setHeader('Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: https:; " +
        "frame-ancestors 'none';"
      );
    }

    // Additional security headers
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('X-XSS-Protection', '1; mode=block');
    response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  }

  private addRequestTracking(request: Request, response: Response): void {
    // Add unique request ID
    const requestId = this.generateRequestId();
    request['requestId'] = requestId;
    response.setHeader('X-Request-ID', requestId);

    // Add timestamp
    const timestamp = new Date().toISOString();
    request['timestamp'] = timestamp;
    response.setHeader('X-Timestamp', timestamp);

    // Add client information (sanitized)
    response.setHeader('X-Client-IP', this.getClientIP(request));
  }

  private prepareForResponse(request: Request, response: Response): void {
    // Store the original response methods to intercept and sanitize
    const originalJson = response.json.bind(response);
    const originalSend = response.send.bind(response);

    response.json = (body: any) => {
      const sanitized = this.responseSanitization.sanitizeResponse(body);
      return originalJson(sanitized);
    };

    response.send = (body: any) => {
      if (typeof body === 'object') {
        const sanitized = this.responseSanitization.sanitizeResponse(body);
        return originalJson(sanitized);
      }
      return originalSend(body);
    };
  }

  private isAuthenticated(request: Request): boolean {
    // Check for valid JWT token
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }

    const token = authHeader.substring(7);
    return this.validateJWT(token);
  }

  private validateJWT(token: string): boolean {
    // Basic JWT validation - in production, use proper JWT validation
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return false;
      }

      // Decode and validate the payload
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      const now = Math.floor(Date.now() / 1000);
      
      return payload.exp > now; // Check if token is not expired
    } catch {
      return false;
    }
  }

  private validateAuthorization(request: Request, options: any): void {
    const user = (request as any).user;
    if (!user) {
      throw new UnauthorizedException('User information not found');
    }

    // Validate roles
    if (options.roles.length > 0) {
      const hasRole = options.roles.some((role: string) => user.roles?.includes(role));
      if (!hasRole) {
        throw new ForbiddenException('Insufficient role permissions');
      }
    }

    // Validate permissions
    if (options.permissions.length > 0) {
      const hasPermission = options.permissions.some((permission: string) => 
        user.permissions?.includes(permission)
      );
      if (!hasPermission) {
        throw new ForbiddenException('Insufficient permissions');
      }
    }
  }

  private validateCSRFToken(request: Request): void {
    const csrfToken = request.headers['x-csrf-token'] || request.body._csrf;
    if (!csrfToken) {
      throw new UnauthorizedException('CSRF token required');
    }

    // Validate CSRF token (implement your CSRF validation logic)
    // This is a simplified check
    if (typeof csrfToken !== 'string' || csrfToken.length < 32) {
      throw new UnauthorizedException('Invalid CSRF token');
    }
  }

  private isStateChangingRequest(request: Request): boolean {
    return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method);
  }

  private getClientIP(request: Request): string {
    return (request.headers['x-forwarded-for'] as string)?.split(',')[0] ||
           request.headers['x-real-ip'] as string ||
           request.connection.remoteAddress ||
           'unknown';
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

// Security decorators
export function RequireAuth() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata('requireAuth', true, descriptor.value);
  };
}

export function RequireRole(...roles: string[]) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata('roles', roles, descriptor.value);
  };
}

export function RequirePermission(...permissions: string[]) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata('permissions', permissions, descriptor.value);
  };
}

export function RateLimit(requests: number, window: number) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata('rateLimit', { requests, window }, descriptor.value);
  };
}

export function SanitizeInput() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata('sanitizeInput', true, descriptor.value);
  };
}

export function ValidateCSRF() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata('validateCSRF', true, descriptor.value);
  };
}

export function StrictMode() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata('strictMode', true, descriptor.value);
  };
}
