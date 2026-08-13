/**
 * Agent Tracking Middleware
 * 
 * Extracts and records agent identification information from requests:
 * - IP address (with proxy support)
 * - TLS fingerprint (JA3/JA4)
 * - User-Agent
 * - Request logging with agent identifier
 */

import { Injectable, NestMiddleware, Logger, Inject, Optional } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'node:crypto';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      agentTracking?: {
        requestId: string;
        ipAddress: string;
        tlsFingerprint?: string;
        userAgent?: string;
        sessionId?: string;
        agentId?: string;
        timestamp: Date;
      };
    }
  }
}

export interface AgentTrackingConfig {
  /** Header to extract agent ID from (default: x-agent-id) */
  agentIdHeader?: string;
  /** Header to extract session ID from (default: x-session-id) */
  sessionIdHeader?: string;
  /** Header to extract auth token from (default: x-agent-token) */
  authTokenHeader?: string;
  /** Headers to check for client IP (in order of precedence) */
  ipHeaders?: string[];
  /** Whether to log all requests (default: true) */
  logRequests?: boolean;
  /** Paths to exclude from tracking */
  excludePaths?: string[];
  /** Whether to generate TLS fingerprint placeholder */
  generateTlsFingerprint?: boolean;
}

const DEFAULT_CONFIG: AgentTrackingConfig = {
  agentIdHeader: 'x-agent-id',
  sessionIdHeader: 'x-session-id',
  authTokenHeader: 'x-agent-token',
  ipHeaders: ['x-forwarded-for', 'x-real-ip', 'cf-connecting-ip'],
  logRequests: true,
  excludePaths: ['/health', '/api/health', '/api/system/health'],
  generateTlsFingerprint: true,
};

@Injectable()
export class AgentTrackingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AgentTrackingMiddleware.name);
  private readonly config: AgentTrackingConfig;

  constructor(@Optional() config?: AgentTrackingConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const startTime = Date.now();

    // Skip excluded paths
    if (this.shouldExcludePath(req.path)) {
      next();
      return;
    }

    // Extract tracking information
    const tracking = this.extractTrackingInfo(req);
    req.agentTracking = tracking;

    // Add tracking headers to response
    res.setHeader('X-Request-ID', tracking.requestId);
    res.setHeader('X-Agent-IP', tracking.ipAddress);

    // Log request
    if (this.config.logRequests) {
      this.logRequest(req, tracking);
    }

    // Track response
    this.trackResponse(req, res, tracking, startTime);

    next();
  }

  /**
   * Extract all tracking information from the request
   */
  private extractTrackingInfo(req: Request): Express.Request['agentTracking'] {
    return {
      requestId: this.generateRequestId(),
      ipAddress: this.extractIpAddress(req),
      tlsFingerprint: this.extractTlsFingerprint(req),
      userAgent: this.extractUserAgent(req),
      sessionId: this.extractSessionId(req),
      agentId: this.extractAgentId(req),
      timestamp: new Date(),
    };
  }

  /**
   * Generate a unique request ID
   */
  private generateRequestId(): string {
    const timestamp = Date.now().toString(36);
    const random = randomBytes(8).toString('hex');
    return `req_${timestamp}_${random}`;
  }

  /**
   * Extract client IP address from request
   * Handles proxies and load balancers
   */
  private extractIpAddress(req: Request): string {
    const ipHeaders = this.config.ipHeaders || [];

    for (const header of ipHeaders) {
      const headerValue = req.headers[header.toLowerCase()];
      if (headerValue) {
        // x-forwarded-for can be a comma-separated list
        const ips = Array.isArray(headerValue)
          ? headerValue[0]
          : headerValue;
        
        // Take the first IP in the chain (original client)
        const ip = ips.split(',')[0]?.trim();
        if (ip && this.isValidIp(ip)) {
          return ip;
        }
      }
    }

    // Fall back to connection info
    return (
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.ip ||
      'unknown'
    );
  }

  /**
   * Validate IP address format
   */
  private isValidIp(ip: string): boolean {
    // IPv4
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    // IPv6 (simplified)
    const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
    
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  /**
   * Extract TLS fingerprint from request
   * 
   * Note: TLS fingerprint (JA3/JA4) is typically available at the
   * load balancer or reverse proxy level. Check for common headers
   * that proxies use to pass this information.
   */
  private extractTlsFingerprint(req: Request): string | undefined {
    // Check for JA3 fingerprint (common format)
    const ja3 = req.headers['x-ja3-fingerprint'] as string;
    if (ja3) {
      return ja3;
    }

    // Check for JA4 fingerprint (newer format)
    const ja4 = req.headers['x-ja4-fingerprint'] as string;
    if (ja4) {
      return ja4;
    }

    // Check for generic TLS fingerprint header
    const tlsFingerprint = req.headers['x-tls-fingerprint'] as string;
    if (tlsFingerprint) {
      return tlsFingerprint;
    }

    // Check Cloudflare specific headers
    const cfTlsVersion = req.headers['cf-tls-version'] as string;
    const cfTlsCipher = req.headers['cf-tls-cipher'] as string;
    if (cfTlsVersion && cfTlsCipher) {
      // Create a pseudo-fingerprint from available TLS info
      return this.hashString(`${cfTlsVersion}:${cfTlsCipher}`);
    }

    // Generate placeholder if configured
    if (this.config.generateTlsFingerprint) {
      // Use available connection info to create a pseudo-fingerprint
      const userAgent = req.headers['user-agent'] || '';
      const acceptEncoding = req.headers['accept-encoding'] || '';
      return this.hashString(`pseudo:${userAgent}:${acceptEncoding}`);
    }

    return undefined;
  }

  /**
   * Simple hash function for creating fingerprints
   */
  private hashString(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  /**
   * Extract User-Agent from request
   */
  private extractUserAgent(req: Request): string | undefined {
    return req.headers['user-agent'];
  }

  /**
   * Extract session ID from request headers
   */
  private extractSessionId(req: Request): string | undefined {
    const headerName = this.config.sessionIdHeader || 'x-session-id';
    return req.headers[headerName.toLowerCase()] as string | undefined;
  }

  /**
   * Extract agent ID from request headers
   */
  private extractAgentId(req: Request): string | undefined {
    const headerName = this.config.agentIdHeader || 'x-agent-id';
    return req.headers[headerName.toLowerCase()] as string | undefined;
  }

  /**
   * Check if path should be excluded from tracking
   */
  private shouldExcludePath(path: string): boolean {
    const excludePaths = this.config.excludePaths || [];
    return excludePaths.some(excluded => 
      path === excluded || path.startsWith(excluded + '/')
    );
  }

  /**
   * Log request details
   */
  private logRequest(
    req: Request,
    tracking: Express.Request['agentTracking']
  ): void {
    const logData = {
      requestId: tracking.requestId,
      method: req.method,
      path: req.path,
      agentId: tracking.agentId,
      sessionId: tracking.sessionId,
      ip: tracking.ipAddress,
      userAgent: tracking.userAgent?.substring(0, 100), // Truncate long user agents
    };

    this.logger.log(
      `Request: ${logData.method} ${logData.path} ` +
      `[agent=${logData.agentId || 'anonymous'}] ` +
      `[ip=${logData.ip}] ` +
      `[req=${logData.requestId}]`
    );
  }

  /**
   * Track response and log completion
   */
  private trackResponse(
    req: Request,
    res: Response,
    tracking: Express.Request['agentTracking'],
    startTime: number
  ): void {
    const originalEnd = res.end.bind(res);

    res.end = (chunk?: any, encoding?: any) => {
      const responseTime = Date.now() - startTime;
      const statusCode = res.statusCode;

      // Log response
      if (this.config.logRequests) {
        this.logResponse(req, tracking, statusCode, responseTime);
      }

      return originalEnd(chunk, encoding);
    };
  }

  /**
   * Log response details
   */
  private logResponse(
    req: Request,
    tracking: Express.Request['agentTracking'],
    statusCode: number,
    responseTime: number
  ): void {
    const level = statusCode >= 400 ? 'warn' : 'log';
    
    this.logger[level](
      `Response: ${statusCode} ` +
      `[${responseTime}ms] ` +
      `[req=${tracking.requestId}] ` +
      `[agent=${tracking.agentId || 'anonymous'}]`
    );
  }
}

/**
 * Factory function to create configured middleware
 */
export function createAgentTrackingMiddleware(
  config?: AgentTrackingConfig
): AgentTrackingMiddleware {
  return new AgentTrackingMiddleware(config);
}
