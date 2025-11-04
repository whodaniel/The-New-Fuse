import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InputSanitizationService } from '../security/input-sanitization.service';

export interface SecurityValidationOptions {
  sanitize?: boolean;
  maxLength?: number;
  allowedFields?: string[];
  forbiddenFields?: string[];
  validateEmail?: boolean;
  validatePhone?: boolean;
  validateUrl?: boolean;
  validateIP?: boolean;
  strictMode?: boolean;
}

@Injectable()
export class SecurityValidationMiddleware implements NestMiddleware {
  constructor(
    private readonly sanitizationService: InputSanitizationService
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    
    // Add security headers
    this.addSecurityHeaders(res);

    // Sanitize and validate request data
    this.sanitizeRequestData(req);

    // Add request ID for tracking
    this.addRequestId(req);

    // Add processing time tracking
    req['startTime'] = startTime;

    next();
  }

  private addSecurityHeaders(res: Response): void {
    // Content Security Policy
    res.setHeader('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "font-src 'self'; " +
      "connect-src 'self' wss: https:; " +
      "frame-src 'none'; " +
      "object-src 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self';"
    );

    // X-Frame-Options
    res.setHeader('X-Frame-Options', 'DENY');

    // X-Content-Type-Options
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // X-XSS-Protection
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Referrer-Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions-Policy
    res.setHeader('Permissions-Policy', 
      'geolocation=(), microphone=(), camera=(), payment=()'
    );

    // Cache-Control
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  private sanitizeRequestData(req: Request): void {
    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = this.sanitizeObject(req.query, {
        sanitize: true,
        maxLength: 1000,
        strictMode: true
      }) as any;
    }

    // Sanitize body
    if (req.body && typeof req.body === 'object') {
      req.body = this.sanitizeObject(req.body, {
        sanitize: true,
        maxLength: 10000,
        strictMode: true
      });
    }

    // Sanitize URL parameters
    if (req.params && typeof req.params === 'object') {
      req.params = this.sanitizeObject(req.params, {
        sanitize: true,
        maxLength: 500,
        strictMode: true
      }) as any;
    }

    // Sanitize headers (except safe ones)
    if (req.headers && typeof req.headers === 'object') {
      const safeHeaders = this.getSafeHeaders(req.headers);
      req.headers = safeHeaders as any;
    }
  }

  private sanitizeObject(obj: any, options: SecurityValidationOptions = {}): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      return this.sanitizeString(obj, options);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item, options));
    }

    if (typeof obj === 'object') {
      const sanitized: any = {};
      
      for (const [key, value] of Object.entries(obj)) {
        // Check if field is allowed/forbidden
        if (options.allowedFields && !options.allowedFields.includes(key)) {
          continue;
        }

        if (options.forbiddenFields && options.forbiddenFields.includes(key)) {
          continue;
        }

        // Sanitize the key
        const sanitizedKey = this.sanitizeString(key, { maxLength: 100 });
        if (sanitizedKey) {
          sanitized[sanitizedKey] = this.sanitizeObject(value, options);
        }
      }
      
      return sanitized;
    }

    return obj;
  }

  private sanitizeString(str: string, options: SecurityValidationOptions = {}): any {
    if (typeof str !== 'string') {
      return str;
    }

    let sanitized = str;

    // Apply length limit
    if (options.maxLength && str.length > options.maxLength) {
      sanitized = str.substring(0, options.maxLength);
    }

    // Remove control characters
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    if (options.sanitize) {
      // Sanitize based on type hints from key name or content
      const key = Object.keys({ str })[0] || '';
      
      if (key.toLowerCase().includes('email') || this.isEmail(str)) {
        sanitized = this.sanitizationService.sanitizeEmail(sanitized);
      } else if (key.toLowerCase().includes('phone') || this.isPhoneNumber(str)) {
        sanitized = this.sanitizationService.sanitizePhoneNumber(sanitized);
      } else if (key.toLowerCase().includes('url') || this.isUrl(str)) {
        sanitized = this.sanitizationService.sanitizeUrl(sanitized);
      } else if (key.toLowerCase().includes('html') || this.isHTML(str)) {
        sanitized = this.sanitizationService.sanitizeHTML(sanitized);
      } else if (key.toLowerCase().includes('ip') || this.isIPAddress(str)) {
        sanitized = this.sanitizationService.sanitizeIPAddress(sanitized);
      } else {
        // General text sanitization
        sanitized = this.sanitizationService.sanitizeText(sanitized);
      }
    }

    return sanitized;
  }

  private addRequestId(req: Request): void {
    req['requestId'] = this.generateRequestId();
    req['timestamp'] = new Date().toISOString();
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private getSafeHeaders(headers: any): any {
    const safeHeaders: any = {};
    const allowedHeaders = [
      'accept', 'accept-language', 'accept-encoding', 'authorization',
      'cache-control', 'content-type', 'content-length', 'user-agent',
      'x-requested-with', 'x-api-key', 'x-client-version'
    ];

    for (const [key, value] of Object.entries(headers)) {
      if (allowedHeaders.includes(key.toLowerCase())) {
        safeHeaders[key] = typeof value === 'string' 
          ? this.sanitizationService.sanitizeText(value)
          : value;
      }
    }

    return safeHeaders;
  }

  private isEmail(str: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(str);
  }

  private isPhoneNumber(str: string): boolean {
    const phoneRegex = /^[\d+\-().\s]+$/;
    return phoneRegex.test(str) && str.replace(/[\d]/g, '').length <= 10;
  }

  private isUrl(str: string): boolean {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  }

  private isHTML(str: string): boolean {
    return /<[^>]*>/.test(str);
  }

  private isIPAddress(str: string): boolean {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;
    return ipv4Regex.test(str) || ipv6Regex.test(str);
  }
}