import { OnModuleInit } from '@nestjs/common';
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
export declare class ApiEndpointMonitoringService implements OnModuleInit {
    private securityLogging;
    private configService;
    private readonly logger;
    private endpointMetrics;
    private securityMetrics;
    constructor(securityLogging: SecurityLoggingService, configService: ConfigService);
    onModuleInit(): void;
    /**
     * Record API request metrics
     */
    recordRequest(method: string, endpoint: string, statusCode: number, responseTime: number, userId?: string, ip?: string): void;
    /**
     * Record authentication failure
     */
    recordAuthFailure(ip?: string, reason?: string): void;
    /**
     * Record authorization failure
     */
    recordAuthZFailure(userId?: string, ip?: string, reason?: string): void;
    /**
     * Record rate limit violation
     */
    recordRateLimitViolation(ip?: string, endpoint?: string): void;
    /**
     * Record input validation failure
     */
    recordInputValidationFailure(endpoint?: string, reason?: string): void;
    /**
     * Record security violation
     */
    recordSecurityViolation(type: string, details?: any): void;
    /**
     * Record IP blocking
     */
    recordIPBlock(ip: string, reason?: string): void;
    /**
     * Get all endpoint metrics
     */
    getEndpointMetrics(): ApiEndpointMetrics[];
    /**
     * Get specific endpoint metrics
     */
    getEndpointMetricsByEndpoint(method: string, endpoint: string): ApiEndpointMetrics | null;
    /**
     * Get security metrics summary
     */
    getSecurityMetrics(): SecurityMetrics & {
        securityScore: number;
        threatLevel: 'low' | 'medium' | 'high' | 'critical';
    };
    /**
     * Get unhealthy endpoints
     */
    getUnhealthyEndpoints(): ApiEndpointMetrics[];
    /**
     * Get degraded endpoints
     */
    getDegradedEndpoints(): ApiEndpointMetrics[];
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
    };
    /**
     * Clean up old metrics (older than 24 hours)
     */
    private cleanupOldMetrics;
    /**
     * Detect suspicious activity patterns
     */
    private detectSuspiciousActivity;
    /**
     * Generate recommendations based on metrics
     */
    private generateRecommendations;
}
//# sourceMappingURL=api-endpoint-monitoring.service.d.ts.map