import { Injectable, Logger } from '@nestjs/common';
import { EnhancedRateLimitService } from '../security/enhanced-rate-limit.service';
import { SecurityLoggingService } from '../security/security-logging.service';
import { ApiEndpointMonitoringService } from '../security/api-endpoint-monitoring.service';
import { Request, Response } from 'express';

@Injectable()
export class SecurityIntegrationService {
  private readonly logger = new Logger(SecurityIntegrationService.name);

  constructor(
    private rateLimitService: EnhancedRateLimitService,
    private securityLogging: SecurityLoggingService,
    private monitoringService: ApiEndpointMonitoringService
  ) {}

  /**
   * Comprehensive security check for all incoming requests
   */
  async performSecurityCheck(request: any): Promise<{
    allowed: boolean;
    reason?: string;
    rateLimitRemaining?: number;
    securityFlags?: any;
  }> {
    const startTime = Date.now();
    const clientIP = this.getClientIP(request);
    const userAgent = request.headers['user-agent'] || 'unknown';

    try {
      // 1. Rate limiting check
      const rateLimitResult = await this.rateLimitService.checkRateLimitAuto(request);
      
      if (!rateLimitResult.allowed) {
        this.securityLogging.logRateLimit('limit_exceeded', {
          ip: clientIP,
          userAgent,
          endpoint: request.path,
          method: request.method,
          limit: rateLimitResult.remaining,
        });

        return {
          allowed: false,
          reason: 'Rate limit exceeded',
          rateLimitRemaining: 0,
        };
      }

      // 2. Security analysis
      const securityFlags = await this.performSecurityAnalysis(request);

      // 3. Log API access (statusCode is required, use 200 for successful requests)
      this.securityLogging.logApiAccess(request.method, request.path, {
        ip: clientIP,
        userAgent,
        userId: request.user?.id,
        requestId: request.requestId,
        statusCode: 200,
        responseTime: Date.now() - startTime,
      });

      // 4. Update monitoring (method, endpoint, statusCode, responseTime, userId?, ip?)
      this.monitoringService.recordRequest(request.method, request.path, 200, Date.now() - startTime, request.user?.id, clientIP);

      return {
        allowed: true,
        rateLimitRemaining: rateLimitResult.remaining,
        securityFlags,
      };

    } catch (error) {
      this.logger.error(`Security check failed: ${(error as Error).message}`, (error as Error).stack);
      
      // Log as suspicious_pattern since 'security_check_error' is not a valid violation type
      this.securityLogging.logSecurityViolation('suspicious_pattern', {
        ip: clientIP,
        endpoint: request.path,
        method: request.method,
        payload: { error: (error as Error).message },
        severity: 'medium',
      });

      return {
        allowed: false,
        reason: 'Security check failed',
      };
    }
  }

  /**
   * Validate JWT token and extract user information
   */
  async validateJWT(request: any): Promise<any> {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    
    try {
      // Import JWT service dynamically to avoid circular dependencies
      const { JwtService } = await import('@nestjs/jwt');
      const jwtService = new JwtService({
        secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
      });

      const payload = await jwtService.verifyAsync(token);
      return {
        id: payload.sub,
        email: payload.email,
        roles: payload.roles || [],
        permissions: payload.permissions || [],
        iat: payload.iat,
        exp: payload.exp,
      };
    } catch (error) {
      this.securityLogging.logAuthEvent('auth_failure', {
        ip: this.getClientIP(request),
        userAgent: request.headers['user-agent'],
        method: request.method,
        endpoint: request.path,
        success: false,
        reason: 'Invalid or expired token',
        metadata: { error: (error as Error).message },
      });
      return null;
    }
  }

  /**
   * Check authorization level for user
   */
  checkAuthorizationLevel(user: any, requiredLevel: string): boolean {
    if (!user) return false;

    switch (requiredLevel) {
      case 'system':
        return user.roles?.includes('system') || user.permissions?.includes('system:access');
      
      case 'admin':
        return user.roles?.includes('admin') || user.permissions?.includes('admin:access') || user.roles?.includes('system');
      
      case 'user':
        return true; // Any authenticated user
      
      case 'public':
        return true;
      
      default:
        return false;
    }
  }

  /**
   * Get client IP address
   */
  private getClientIP(request: any): string {
    return (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
           request.headers['x-real-ip'] as string ||
           request.connection.remoteAddress ||
           request.ip ||
           'unknown';
  }

  /**
   * Perform security analysis on request
   */
  private async performSecurityAnalysis(request: any): Promise<{
    isBot: boolean;
    isSuspicious: boolean;
    threatLevel: 'low' | 'medium' | 'high' | 'critical';
  }> {
    const flags: {
      isBot: boolean;
      isSuspicious: boolean;
      threatLevel: 'low' | 'medium' | 'high' | 'critical';
    } = {
      isBot: this.detectBot(request),
      isSuspicious: false,
      threatLevel: 'low',
    };

    // Check for suspicious patterns
    const userAgent = request.headers['user-agent'] || '';
    const path = request.path || '';
    
    // Suspicious patterns
    const suspiciousPatterns = [
      /(\<|%3C)script/i, // XSS attempts
      /union.*select/i, // SQL injection
      /\.\.\//i, // Path traversal
      /etc\/passwd/i, // File inclusion
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(userAgent) || pattern.test(path) || pattern.test(JSON.stringify(request.body))) {
        flags.isSuspicious = true;
        flags.threatLevel = 'medium';
        break;
      }
    }

    // High threat level indicators
    const highThreatPatterns = [
      /sqlmap/i,
      /nikto/i,
      /nessus/i,
      /burp/i,
    ];

    for (const pattern of highThreatPatterns) {
      if (pattern.test(userAgent) || pattern.test(path)) {
        flags.isSuspicious = true;
        flags.threatLevel = 'high';
        break;
      }
    }

    return flags;
  }

  /**
   * Detect if request is from a bot
   */
  private detectBot(request: any): boolean {
    const userAgent = (request.headers['user-agent'] || '').toLowerCase();
    const botPatterns = [
      'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget',
      'python', 'requests', 'http', 'scanner', 'scan'
    ];

    return botPatterns.some(pattern => userAgent.includes(pattern));
  }

  /**
   * Clean up expired data
   */
  cleanup(): void {
    this.rateLimitService.cleanup();
  }
}
