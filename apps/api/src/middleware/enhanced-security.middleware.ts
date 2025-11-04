import { Injectable, NestMiddleware, Logger, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { SecurityLoggingService } from '../security/security-logging.service';
import { EnhancedRateLimitService } from '../security/enhanced-rate-limit.service';
import { InputSanitizationService } from '../security/input-sanitization.service';
import * as crypto from 'crypto';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      timestamp?: string;
      clientIP?: string;
      userAgent?: string;
      securityFlags?: {
        isBot?: boolean;
        isSuspicious?: boolean;
        threatLevel?: 'low' | 'medium' | 'high' | 'critical';
      };
    }
  }
}

@Injectable()
export class EnhancedSecurityMiddleware implements NestMiddleware {
  private readonly logger = new Logger(EnhancedSecurityMiddleware.name);

  constructor(
    private securityLogging: SecurityLoggingService,
    private rateLimitService: EnhancedRateLimitService,
    private inputSanitization: InputSanitizationService
  ) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const startTime = Date.now();

    // Generate unique request ID
    req.requestId = this.generateRequestId();
    req.timestamp = new Date().toISOString();
    req.clientIP = this.getClientIP(req);
    req.userAgent = req.headers['user-agent'] || 'unknown';

    // Add request tracking headers
    res.setHeader('X-Request-ID', req.requestId);
    res.setHeader('X-Timestamp', req.timestamp);
    res.setHeader('X-Client-IP', req.clientIP);
    res.setHeader('X-Response-Time', '');

    // Security analysis
    const securityAnalysis = await this.performSecurityAnalysis(req);
    req.securityFlags = securityAnalysis;

    // Enhanced rate limiting with tier detection
    await this.enforceRateLimiting(req, res);

    // Input sanitization and validation
    this.sanitizeAndValidateInput(req);

    // Security headers injection
    this.injectSecurityHeaders(res);

    // Log API access
    const originalSend = res.send.bind(res);
    const originalJson = res.json.bind(res);

    // Intercept response to log and sanitize
    res.send = (body?: any) => {
      this.logApiResponse(req, res, startTime, body);
      return originalSend(body);
    };

    res.json = (body?: any) => {
      this.logApiResponse(req, res, startTime, body);
      return originalJson(body);
    };

    // Handle response end
    const originalEnd = res.end.bind(res);
    res.end = (chunk?: any, encoding?: any) => {
      const responseTime = Date.now() - startTime;
      res.setHeader('X-Response-Time', `${responseTime}ms`);
      
      // Log slow requests
      if (responseTime > 5000) {
        this.logger.warn(`Slow request detected: ${req.method} ${req.path} took ${responseTime}ms`);
      }
      
      return originalEnd(chunk, encoding);
    };

    // Continue to next middleware
    next();
  }

  /**
   * Perform comprehensive security analysis
   */
  private async performSecurityAnalysis(req: Request): Promise<any> {
    const flags = {
      isBot: this.detectBot(req),
      isSuspicious: false,
      threatLevel: 'low' as const,
    };

    // Check for common attack patterns
    if (this.detectSQLInjection(req) || this.detectXSS(req) || this.detectPathTraversal(req)) {
      flags.isSuspicious = true;
      flags.threatLevel = 'high';
    }

    // Check request characteristics
    if (this.detectUnusualPattern(req)) {
      flags.threatLevel = 'medium';
    }

    // Log security violations
    if (flags.threatLevel === 'high') {
      this.securityLogging.logSecurityViolation('suspicious_pattern', {
        ip: req.clientIP,
        endpoint: req.path,
        method: req.method,
        payload: {
          body: req.body,
          query: req.query,
          headers: this.sanitizeHeaders(req.headers),
        },
        severity: flags.threatLevel,
        action: 'blocked',
      });
    }

    return flags;
  }

  /**
   * Enforce rate limiting with enhanced rules
   */
  private async enforceRateLimiting(req: Request, res: Response): Promise<void> {
    try {
      // Check if IP is blocked
      if (this.rateLimitService.isIPBlocked(req.clientIP)) {
        throw new UnauthorizedException('IP address temporarily blocked');
      }

      // Check rate limit
      const rateLimitResult = await this.rateLimitService.checkRateLimitAuto(req);
      
      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', rateLimitResult.allowed ? rateLimitResult.remaining + 1 : 0);
      res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining);
      res.setHeader('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString());

      if (!rateLimitResult.allowed) {
        throw new UnauthorizedException('Rate limit exceeded');
      }
    } catch (error) {
      this.securityLogging.logRateLimit('limit_exceeded', {
        ip: req.clientIP,
        userAgent: req.userAgent,
        endpoint: req.path,
        method: req.method,
        reason: error.message,
      });
      throw error;
    }
  }

  /**
   * Sanitize and validate input
   */
  private sanitizeAndValidateInput(req: Request): void {
    try {
      // Sanitize query parameters
      if (req.query && typeof req.query === 'object') {
        Object.keys(req.query).forEach(key => {
          if (typeof req.query[key] === 'string') {
            const sanitized = this.inputSanitization.sanitizeText(req.query[key]);
            req.query[key] = sanitized;
            
            // Log if sanitization changed the value
            if (sanitized !== req.query[key]) {
              this.securityLogging.logInputValidation(req.path, req.method, {
                ip: req.clientIP,
                field: `query.${key}`,
                value: req.query[key],
                reason: 'Potentially malicious content detected',
                severity: 'medium',
              });
            }
          }
        });
      }

      // Sanitize body
      if (req.body && typeof req.body === 'object') {
        req.body = this.inputSanitization.sanitizeObject(req.body);
      }

      // Sanitize route parameters
      if (req.params && typeof req.params === 'object') {
        Object.keys(req.params).forEach(key => {
          if (typeof req.params[key] === 'string') {
            req.params[key] = this.inputSanitization.sanitizeText(req.params[key]);
          }
        });
      }
    } catch (error) {
      this.securityLogging.logInputValidation(req.path, req.method, {
        ip: req.clientIP,
        reason: error.message,
        severity: 'high',
      });
      throw new BadRequestException('Invalid input data');
    }
  }

  /**
   * Inject comprehensive security headers
   */
  private injectSecurityHeaders(res: Response): void {
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
      "form-action 'self'; " +
      "upgrade-insecure-requests;"
    );

    // Additional security headers
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 
      'geolocation=(), microphone=(), camera=(), payment=(), fullscreen=(*), sync-xhr=(*)'
    );
    
    // Remove server information
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');
    
    // HSTS (HTTPS Strict Transport Security)
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
  }

  /**
   * Log API response for monitoring
   */
  private logApiResponse(req: Request, res: Response, startTime: number, body: any): void {
    const responseTime = Date.now() - startTime;
    
    this.securityLogging.logApiAccess(req.method, req.path, {
      requestId: req.requestId,
      userId: req.user?.id,
      ip: req.clientIP,
      userAgent: req.userAgent,
      statusCode: res.statusCode,
      responseTime,
      bytesSent: body ? JSON.stringify(body).length : 0,
    });
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
  }

  /**
   * Get client IP address
   */
  private getClientIP(req: Request): string {
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
           req.headers['x-real-ip'] as string ||
           req.connection.remoteAddress ||
           req.ip ||
           'unknown';
  }

  /**
   * Detect bot traffic
   */
  private detectBot(req: Request): boolean {
    const userAgent = req.userAgent?.toLowerCase() || '';
    const botPatterns = [
      'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 'python', 'java',
      'go-http-client', 'okhttp', 'libwww', 'httpclient', 'feedburner', 'googlebot'
    ];
    
    return botPatterns.some(pattern => userAgent.includes(pattern));
  }

  /**
   * Detect SQL injection patterns
   */
  private detectSQLInjection(req: Request): boolean {
    const suspiciousPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|EXECUTE)\b)/i,
      /('|(\\x27)|(\\x22)|(%27)|(%22))/,
      /(UNION\s+SELECT)/i,
      /(\bor\b\s+1=1)/i,
      /(\bunion\b.*\bselect\b)/i,
    ];

    const content = JSON.stringify({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    return suspiciousPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Detect XSS patterns
   */
  private detectXSS(req: Request): boolean {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>/gi,
      /<object[^>]*>/gi,
      /<embed[^>]*>/gi,
    ];

    const content = JSON.stringify({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    return xssPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Detect path traversal attempts
   */
  private detectPathTraversal(req: Request): boolean {
    const traversalPatterns = [
      /\.\.\//,
      /%2e%2e%2f/gi,
      /%252e%252e%252f/gi,
      /\\.*\\/,  // Windows path traversal
    ];

    const content = req.path + JSON.stringify({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    return traversalPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Detect unusual request patterns
   */
  private detectUnusualPattern(req: Request): boolean {
    // Check for unusual headers
    const unusualHeaders = [
      'x-forwarded-host',
      'x-original-url',
      'x-rewrite-url',
      'x-originating-ip',
    ];

    const hasUnusualHeaders = unusualHeaders.some(header => 
      req.headers[header] && !header.startsWith('x-forwarded')
    );

    // Check for very long parameters
    const content = JSON.stringify({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    const hasLongParams = content.length > 10000;

    return hasUnusualHeaders || hasLongParams;
  }

  /**
   * Sanitize headers for logging
   */
  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }
}