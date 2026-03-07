import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SecurityLoggingService } from './security-logging.service';
import { ConfigService } from '@nestjs/config';

export interface ApiEndpointMetrics {
  endpoint: string;
  method: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastRequest: string;
  errorRate: number;
  status: 'healthy' | 'degraded' | 'unhealthy';
}

export interface SecurityMetrics {
  totalRequests: number;
  authenticationFailures: number;
  authorizationFailures: number;
  rateLimitViolations: number;
  inputValidationFailures: number;
  securityViolations: number;
  blockedIPs: number;
  suspiciousActivity: number;
}

@Injectable()
export class ApiEndpointMonitoringService implements OnModuleInit {
  private readonly logger = new Logger(ApiEndpointMonitoringService.name);
  private endpointMetrics = new Map<string, ApiEndpointMetrics>();
  private securityMetrics: SecurityMetrics = {
    totalRequests: 0,
    authenticationFailures: 0,
    authorizationFailures: 0,
    rateLimitViolations: 0,
    inputValidationFailures: 0,
    securityViolations: 0,
    blockedIPs: 0,
    suspiciousActivity: 0,
  };

  constructor(
    private securityLogging: SecurityLoggingService,
    private configService: ConfigService
  ) {}

  onModuleInit() {
    // Initialize monitoring
    this.logger.log('API Endpoint Monitoring Service initialized');
    
    // Start periodic cleanup
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 60000); // Clean up every minute
  }

  /**
   * Record API request metrics
   */
  recordRequest(
    method: string,
    endpoint: string,
    statusCode: number,
    responseTime: number,
    userId?: string,
    ip?: string
  ): void {
    const key = `${method}:${endpoint}`;
    const now = new Date().toISOString();

    // Update endpoint metrics
    let metrics = this.endpointMetrics.get(key);
    if (!metrics) {
      metrics = {
        endpoint,
        method,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        lastRequest: now,
        errorRate: 0,
        status: 'healthy',
      };
      this.endpointMetrics.set(key, metrics);
    }

    // Update counters
    metrics.totalRequests++;
    metrics.lastRequest = now;

    if (statusCode >= 200 && statusCode < 300) {
      metrics.successfulRequests++;
    } else {
      metrics.failedRequests++;
    }

    // Update average response time (running average)
    metrics.averageResponseTime = 
      (metrics.averageResponseTime * (metrics.totalRequests - 1) + responseTime) / metrics.totalRequests;

    // Update error rate
    metrics.errorRate = (metrics.failedRequests / metrics.totalRequests) * 100;

    // Update status based on metrics
    if (metrics.errorRate > 20 || metrics.averageResponseTime > 5000) {
      metrics.status = 'unhealthy';
    } else if (metrics.errorRate > 10 || metrics.averageResponseTime > 2000) {
      metrics.status = 'degraded';
    } else {
      metrics.status = 'healthy';
    }

    // Update global security metrics
    this.securityMetrics.totalRequests++;

    // Log if suspicious activity detected
    if (this.detectSuspiciousActivity(statusCode, method, endpoint)) {
      this.securityMetrics.suspiciousActivity++;
      this.securityLogging.logSecurityViolation('suspicious_pattern', {
        ip,
        endpoint,
        method,
        severity: 'medium',
      });
    }
  }

  /**
   * Record authentication failure
   */
  recordAuthFailure(ip?: string, reason?: string): void {
    this.securityMetrics.authenticationFailures++;
    
    if (this.securityMetrics.authenticationFailures > 100) {
      this.securityLogging.logRateLimit('quota_exceeded', {
        ip,
        reason: 'High authentication failure rate',
      });
    }
  }

  /**
   * Record authorization failure
   */
  recordAuthZFailure(userId?: string, ip?: string, reason?: string): void {
    this.securityMetrics.authorizationFailures++;
  }

  /**
   * Record rate limit violation
   */
  recordRateLimitViolation(ip?: string, endpoint?: string): void {
    this.securityMetrics.rateLimitViolations++;
  }

  /**
   * Record input validation failure
   */
  recordInputValidationFailure(endpoint?: string, reason?: string): void {
    this.securityMetrics.inputValidationFailures++;
  }

  /**
   * Record security violation
   */
  recordSecurityViolation(type: string, details?: any): void {
    this.securityMetrics.securityViolations++;
  }

  /**
   * Record IP blocking
   */
  recordIPBlock(ip: string, reason?: string): void {
    this.securityMetrics.blockedIPs++;
  }

  /**
   * Get all endpoint metrics
   */
  getEndpointMetrics(): ApiEndpointMetrics[] {
    return Array.from(this.endpointMetrics.values())
      .sort((a, b) => b.totalRequests - a.totalRequests);
  }

  /**
   * Get specific endpoint metrics
   */
  getEndpointMetricsByEndpoint(method: string, endpoint: string): ApiEndpointMetrics | null {
    return this.endpointMetrics.get(`${method}:${endpoint}`) || null;
  }

  /**
   * Get security metrics summary
   */
  getSecurityMetrics(): SecurityMetrics & { 
    securityScore: number;
    threatLevel: 'low' | 'medium' | 'high' | 'critical';
  } {
    const totalRequests = this.securityMetrics.totalRequests || 1;
    
    // Calculate security score (0-100)
    const authFailureRate = (this.securityMetrics.authenticationFailures / totalRequests) * 100;
    const authZFailureRate = (this.securityMetrics.authorizationFailures / totalRequests) * 100;
    const rateLimitRate = (this.securityMetrics.rateLimitViolations / totalRequests) * 100;
    const validationFailureRate = (this.securityMetrics.inputValidationFailures / totalRequests) * 100;
    const violationRate = (this.securityMetrics.securityViolations / totalRequests) * 100;

    const securityScore = Math.max(0, 100 - 
      (authFailureRate * 2) - 
      (authZFailureRate * 3) - 
      (rateLimitRate * 1) - 
      (validationFailureRate * 2) - 
      (violationRate * 5)
    );

    // Determine threat level
    let threatLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (securityScore < 30) {
      threatLevel = 'critical';
    } else if (securityScore < 50) {
      threatLevel = 'high';
    } else if (securityScore < 75) {
      threatLevel = 'medium';
    }

    return {
      ...this.securityMetrics,
      securityScore,
      threatLevel,
    };
  }

  /**
   * Get unhealthy endpoints
   */
  getUnhealthyEndpoints(): ApiEndpointMetrics[] {
    return this.getEndpointMetrics().filter(m => m.status === 'unhealthy');
  }

  /**
   * Get degraded endpoints
   */
  getDegradedEndpoints(): ApiEndpointMetrics[] {
    return this.getEndpointMetrics().filter(m => m.status === 'degraded');
  }

  /**
   * Generate health report
   */
  generateHealthReport(): {
    timestamp: string;
    overallHealth: 'healthy' | 'degraded' | 'unhealthy';
    endpointCount: number;
    totalRequests: number;
    healthyEndpoints: number;
    degradedEndpoints: number;
    unhealthyEndpoints: number;
    securityMetrics: any;
    topEndpoints: ApiEndpointMetrics[];
    recommendations: string[];
  } {
    const endpoints = this.getEndpointMetrics();
    const securityMetrics = this.getSecurityMetrics();
    
    const healthyCount = endpoints.filter(e => e.status === 'healthy').length;
    const degradedCount = endpoints.filter(e => e.status === 'degraded').length;
    const unhealthyCount = endpoints.filter(e => e.status === 'unhealthy').length;

    // Determine overall health
    let overallHealth: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (unhealthyCount > 0) {
      overallHealth = 'unhealthy';
    } else if (degradedCount > 0) {
      overallHealth = 'degraded';
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(endpoints, securityMetrics);

    return {
      timestamp: new Date().toISOString(),
      overallHealth,
      endpointCount: endpoints.length,
      totalRequests: securityMetrics.totalRequests,
      healthyEndpoints: healthyCount,
      degradedEndpoints: degradedCount,
      unhealthyEndpoints: unhealthyCount,
      securityMetrics,
      topEndpoints: endpoints.slice(0, 10),
      recommendations,
    };
  }

  /**
   * Clean up old metrics (older than 24 hours)
   */
  private cleanupOldMetrics(): void {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000);
    let cleaned = 0;

    for (const [key, metrics] of this.endpointMetrics.entries()) {
      const lastRequestTime = new Date(metrics.lastRequest).getTime();
      if (lastRequestTime < cutoff && metrics.totalRequests < 10) {
        this.endpointMetrics.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.log(`Cleaned up ${cleaned} old endpoint metrics`);
    }
  }

  /**
   * Detect suspicious activity patterns
   */
  private detectSuspiciousActivity(statusCode: number, method: string, endpoint: string): boolean {
    // High error rate from same endpoint
    if (statusCode >= 400 && statusCode < 500) {
      // Check for common attack patterns
      const suspiciousPatterns = [
        /admin/i,
        /api\/.*\.\./i,
        /\/\.\./i,
        /system/i,
        /config/i,
      ];

      return suspiciousPatterns.some(pattern => pattern.test(endpoint));
    }

    // Unusual HTTP methods
    if (['CONNECT', 'TRACE', 'TRACK'].includes(method)) {
      return true;
    }

    return false;
  }

  /**
   * Generate recommendations based on metrics
   */
  private generateRecommendations(endpoints: ApiEndpointMetrics[], securityMetrics: any): string[] {
    const recommendations: string[] = [];

    // Security recommendations
    if (securityMetrics.authenticationFailures > 50) {
      recommendations.push('High authentication failure rate detected. Consider implementing account lockout.');
    }

    if (securityMetrics.rateLimitViolations > 100) {
      recommendations.push('High rate limit violations. Consider adjusting rate limits or investigating potential abuse.');
    }

    if (securityMetrics.securityViolations > 10) {
      recommendations.push('Security violations detected. Review input validation and implement additional security measures.');
    }

    // Performance recommendations
    const slowEndpoints = endpoints.filter(e => e.averageResponseTime > 2000);
    if (slowEndpoints.length > 0) {
      recommendations.push(`${slowEndpoints.length} endpoints have slow response times. Consider performance optimization.`);
    }

    // Error rate recommendations
    const errorProneEndpoints = endpoints.filter(e => e.errorRate > 10);
    if (errorProneEndpoints.length > 0) {
      recommendations.push(`${errorProneEndpoints.length} endpoints have high error rates. Review error handling.`);
    }

    return recommendations;
  }
}