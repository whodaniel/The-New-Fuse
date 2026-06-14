import { ApiEndpointMonitoringService } from '../security/api-endpoint-monitoring.service';
import { EnhancedRateLimitService } from '../security/enhanced-rate-limit.service';
import { SecurityLoggingService } from '../security/security-logging.service';
export declare class SecurityIntegrationService {
    private rateLimitService;
    private securityLogging;
    private monitoringService;
    private readonly logger;
    constructor(rateLimitService: EnhancedRateLimitService, securityLogging: SecurityLoggingService, monitoringService: ApiEndpointMonitoringService);
    /**
     * Comprehensive security check for all incoming requests
     */
    performSecurityCheck(request: any): Promise<{
        allowed: boolean;
        reason?: string;
        rateLimitRemaining?: number;
        securityFlags?: any;
    }>;
    /**
     * Validate JWT token and extract user information
     */
    validateJWT(request: any): Promise<any>;
    /**
     * Check authorization level for user
     */
    checkAuthorizationLevel(user: any, requiredLevel: string): boolean;
    /**
     * Get client IP address
     */
    private getClientIP;
    /**
     * Perform security analysis on request
     */
    private performSecurityAnalysis;
    /**
     * Detect if request is from a bot
     */
    private detectBot;
    /**
     * Clean up expired data
     */
    cleanup(): void;
}
//# sourceMappingURL=security-integration.service.d.ts.map