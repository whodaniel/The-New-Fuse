"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ApiEndpointMonitoringService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiEndpointMonitoringService = void 0;
const common_1 = require("@nestjs/common");
const security_logging_service_1 = require("./security-logging.service");
const config_1 = require("@nestjs/config");
let ApiEndpointMonitoringService = ApiEndpointMonitoringService_1 = class ApiEndpointMonitoringService {
    constructor(securityLogging, configService) {
        this.securityLogging = securityLogging;
        this.configService = configService;
        this.logger = new common_1.Logger(ApiEndpointMonitoringService_1.name);
        this.endpointMetrics = new Map();
        this.securityMetrics = {
            totalRequests: 0,
            authenticationFailures: 0,
            authorizationFailures: 0,
            rateLimitViolations: 0,
            inputValidationFailures: 0,
            securityViolations: 0,
            blockedIPs: 0,
            suspiciousActivity: 0,
        };
    }
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
    recordRequest(method, endpoint, statusCode, responseTime, userId, ip) {
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
        }
        else {
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
        }
        else if (metrics.errorRate > 10 || metrics.averageResponseTime > 2000) {
            metrics.status = 'degraded';
        }
        else {
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
    recordAuthFailure(ip, reason) {
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
    recordAuthZFailure(userId, ip, reason) {
        this.securityMetrics.authorizationFailures++;
    }
    /**
     * Record rate limit violation
     */
    recordRateLimitViolation(ip, endpoint) {
        this.securityMetrics.rateLimitViolations++;
    }
    /**
     * Record input validation failure
     */
    recordInputValidationFailure(endpoint, reason) {
        this.securityMetrics.inputValidationFailures++;
    }
    /**
     * Record security violation
     */
    recordSecurityViolation(type, details) {
        this.securityMetrics.securityViolations++;
    }
    /**
     * Record IP blocking
     */
    recordIPBlock(ip, reason) {
        this.securityMetrics.blockedIPs++;
    }
    /**
     * Get all endpoint metrics
     */
    getEndpointMetrics() {
        return Array.from(this.endpointMetrics.values())
            .sort((a, b) => b.totalRequests - a.totalRequests);
    }
    /**
     * Get specific endpoint metrics
     */
    getEndpointMetricsByEndpoint(method, endpoint) {
        return this.endpointMetrics.get(`${method}:${endpoint}`) || null;
    }
    /**
     * Get security metrics summary
     */
    getSecurityMetrics() {
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
            (violationRate * 5));
        // Determine threat level
        let threatLevel = 'low';
        if (securityScore < 30) {
            threatLevel = 'critical';
        }
        else if (securityScore < 50) {
            threatLevel = 'high';
        }
        else if (securityScore < 75) {
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
    getUnhealthyEndpoints() {
        return this.getEndpointMetrics().filter(m => m.status === 'unhealthy');
    }
    /**
     * Get degraded endpoints
     */
    getDegradedEndpoints() {
        return this.getEndpointMetrics().filter(m => m.status === 'degraded');
    }
    /**
     * Generate health report
     */
    generateHealthReport() {
        const endpoints = this.getEndpointMetrics();
        const securityMetrics = this.getSecurityMetrics();
        const healthyCount = endpoints.filter(e => e.status === 'healthy').length;
        const degradedCount = endpoints.filter(e => e.status === 'degraded').length;
        const unhealthyCount = endpoints.filter(e => e.status === 'unhealthy').length;
        // Determine overall health
        let overallHealth = 'healthy';
        if (unhealthyCount > 0) {
            overallHealth = 'unhealthy';
        }
        else if (degradedCount > 0) {
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
    cleanupOldMetrics() {
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
    detectSuspiciousActivity(statusCode, method, endpoint) {
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
    generateRecommendations(endpoints, securityMetrics) {
        const recommendations = [];
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
};
exports.ApiEndpointMonitoringService = ApiEndpointMonitoringService;
exports.ApiEndpointMonitoringService = ApiEndpointMonitoringService = ApiEndpointMonitoringService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [security_logging_service_1.SecurityLoggingService,
        config_1.ConfigService])
], ApiEndpointMonitoringService);
//# sourceMappingURL=api-endpoint-monitoring.service.js.map