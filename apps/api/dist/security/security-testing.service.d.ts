import { InputSanitizationService } from '../security/input-sanitization.service';
import { ResponseSanitizationService } from '../security/response-sanitization.service';
export interface SecurityTestResult {
    test: string;
    passed: boolean;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    details?: any;
}
export interface SecurityTestSuite {
    name: string;
    tests: SecurityTestResult[];
    overallScore: number;
    passed: number;
    failed: number;
    critical: number;
}
export declare class SecurityTestingService {
    private sanitizationService;
    private responseSanitization;
    constructor(sanitizationService: InputSanitizationService, responseSanitization: ResponseSanitizationService);
    /**
     * Run comprehensive security tests
     */
    runAllSecurityTests(): Promise<SecurityTestSuite[]>;
    /**
     * Test XSS protection measures
     */
    private testXSSProtection;
    /**
     * Test SQL injection prevention
     */
    private testSQLInjectionPrevention;
    /**
     * Test input sanitization
     */
    private testInputSanitization;
    /**
     * Test CSRF protection
     */
    private testCSRFProtection;
    /**
     * Test response sanitization
     */
    private testResponseSanitization;
    /**
     * Test rate limiting
     */
    private testRateLimiting;
    /**
     * Test authentication security
     */
    private testAuthenticationSecurity;
    /**
     * Test data validation
     */
    private testDataValidation;
    /**
     * Create test suite summary
     */
    private createTestSuite;
    /**
     * Generate test CSRF token
     */
    private generateTestCsrfToken;
    /**
     * Generate test session ID
     */
    private generateTestSessionId;
    /**
     * Validate password strength (simplified)
     */
    private validatePasswordStrength;
    /**
     * Get security score summary
     */
    getSecurityScoreSummary(): Promise<{
        totalScore: number;
        suites: SecurityTestSuite[];
        criticalIssues: number;
        recommendations: string[];
    }>;
    /**
     * Generate security recommendations
     */
    private generateRecommendations;
}
//# sourceMappingURL=security-testing.service.d.ts.map