import { InputSanitizationService } from '../security/input-sanitization.service';
import { ResponseSanitizationService } from '../security/response-sanitization.service';
import { SecurityTestingService } from '../security/security-testing.service';
/**
 * Security Test Request Data Transfer Object
 *
 * Defines the structure for security testing requests that can include
 * both text input and complex data objects for comprehensive testing.
 */
declare class SecurityTestRequestDto {
    /** Optional text input for security testing */
    testInput?: string;
    /** Optional complex data object for security testing */
    testData?: Record<string, unknown>;
}
/**
 * XSS Protection Test Data Transfer Object
 *
 * Defines the structure for Cross-Site Scripting (XSS) protection testing.
 */
declare class TestXSSDto {
    /** Input string to test for XSS vulnerabilities */
    input: string;
}
/**
 * SQL Injection Protection Test Data Transfer Object
 *
 * Defines the structure for SQL injection protection testing.
 */
declare class TestSQLInjectionDto {
    /** Input string to test for SQL injection vulnerabilities */
    input: string;
}
/**
 * Response Sanitization Test Data Transfer Object
 *
 * Defines the structure for response data sanitization testing.
 */
declare class TestResponseSanitizationDto {
    /** Data object to test response sanitization */
    data: Record<string, unknown>;
}
/**
 * Security Controller
 *
 * Provides comprehensive security testing, monitoring, and configuration
 * management capabilities. This controller handles security validation,
 * vulnerability testing, input sanitization verification, and security
 * system health monitoring.
 *
 * The controller includes:
 * - Comprehensive security test suites
 * - XSS (Cross-Site Scripting) protection testing
 * - SQL injection prevention validation
 * - Input sanitization verification
 * - Response data sanitization testing
 * - Security system health monitoring
 * - Security configuration management
 *
 * All endpoints require:
 * - Administrator-level authentication
 * - Rate limiting to prevent abuse
 * - Critical security clearance
 * - Comprehensive audit logging
 *
 * @security This controller contains sensitive security testing functionality.
 * Access is restricted to administrators only and all operations are audited.
 *
 * @example
 * // Run comprehensive security tests
 * GET /security/test
 *
 * @example
 * // Test XSS protection
 * POST /security/test/xss
 * {
 *   "input": "<script>alert('xss')</script>"
 * }
 *
 * @example
 * // Test SQL injection protection
 * POST /security/test/sql-injection
 * {
 *   "input": "'; DROP TABLE users; --"
 * }
 */
export declare class SecurityController {
    private readonly securityTestingService;
    private readonly sanitizationService;
    private readonly responseSanitization;
    /**
     * Constructor for SecurityController
     *
     * @param securityTestingService - Service for running comprehensive security tests
     * @param sanitizationService - Service for input sanitization
     * @param responseSanitization - Service for response data sanitization
     *
     * @example
     * const controller = new SecurityController(
     *   securityTestingService,
     *   sanitizationService,
     *   responseSanitization
     * );
     */
    constructor(securityTestingService: SecurityTestingService, sanitizationService: InputSanitizationService, responseSanitization: ResponseSanitizationService);
    /**
     * Run comprehensive security test suite
     *
     * Executes a complete suite of security tests to validate all security
     * measures including input sanitization, XSS protection, SQL injection
     * prevention, CSRF protection, and response sanitization. This endpoint
     * provides an overall security score and detailed test results.
     *
     * @returns Promise containing comprehensive security test results
     * @returns.totalScore - Overall security score (0-100)
     * @returns.criticalIssues - Number of critical security issues found
     * @returns.recommendations - Array of security improvement recommendations
     * @returns.suites - Array of test suite results
     *
     * @throws ForbiddenException - When user doesn't have admin privileges
     * @throws InternalServerErrorException - When security tests fail to run
     *
     * @api
     * GET /security/test
     * @requiresAuth - Admin-level bearer token
     * @requiresPermission - admin:security
     * @rateLimit - 5 requests per hour
     *
     * @example
     * const results = await securityController.runSecurityTests();
     *
     * @example
     * // Security test results
     * {
     *   "totalScore": 92,
     *   "criticalIssues": 0,
     *   "recommendations": [
     *     "Consider implementing additional CSRF tokens",
     *     "Update rate limiting thresholds"
     *   ],
     *   "suites": [
     *     {
     *       "name": "Input Validation",
     *       "overallScore": 95,
     *       "passed": 18,
     *       "failed": 1,
     *       "critical": 0,
     *       "tests": [
     *         {
     *           "test": "XSS Prevention",
     *           "passed": true,
     *           "message": "All XSS vectors blocked",
     *           "severity": "high"
     *         }
     *       ]
     *     }
     *   ]
     * }
     */
    runSecurityTests(): Promise<{
        totalScore: number;
        suites: import("../security/security-testing.service").SecurityTestSuite[];
        criticalIssues: number;
        recommendations: string[];
    }>;
    /**
     * Test XSS (Cross-Site Scripting) protection
     *
     * Tests the XSS protection mechanisms by attempting to inject various
     * XSS payloads including script tags, event handlers, and other malicious
     * code patterns. Validates that input sanitization properly blocks these
     * attempts.
     *
     * @param testXSSDto - XSS test input data
     * @param testXSSDto.input - Malicious input string to test
     * @returns Promise containing XSS protection test results
     * @returns.originalInput - Original input string
     * @returns.sanitizedOutput - Sanitized output string
     * @returns.isProtected - Boolean indicating if protection is working
     * @returns.testResult - Human-readable test result
     * @returns.timestamp - Test execution timestamp
     *
     * @api
     * POST /security/test/xss
     * @requiresAuth - Admin-level bearer token
     * @rateLimit - 20 requests per hour
     *
     * @example
     * const result = await securityController.testXSSProtection({
     *   input: '<script>alert("XSS")</script><img src="x" onerror="alert(1)">'
     * });
     *
     * @example
     * // Successful protection test
     * {
     *   "originalInput": "<script>alert('XSS')</script>",
     *   "sanitizedOutput": "&lt;script&gt;alert('XSS')&lt;/script&gt;",
     *   "isProtected": true,
     *   "testResult": "XSS protection working correctly",
     *   "timestamp": "2025-11-05T02:17:55.000Z"
     * }
     */
    testXSSProtection(testXSSDto: TestXSSDto): Promise<{
        originalInput: string;
        sanitizedOutput: string;
        isProtected: boolean;
        testResult: string;
        timestamp: string;
    }>;
    /**
     * Test SQL injection prevention
     *
     * Tests SQL injection prevention by attempting various SQL injection
     * patterns including UNION attacks, DROP statements, and other malicious
     * database manipulation attempts. Validates proper input sanitization
     * for database queries.
     *
     * @param testSQLInjectionDto - SQL injection test input data
     * @param testSQLInjectionDto.input - Malicious SQL input string to test
     * @returns Promise containing SQL injection protection test results
     * @returns.originalInput - Original input string
     * @returns.sanitizedOutput - Sanitized output string
     * @returns.isProtected - Boolean indicating if protection is working
     * @returns.testResult - Human-readable test result
     * @returns.timestamp - Test execution timestamp
     *
     * @api
     * POST /security/test/sql-injection
     * @requiresAuth - Admin-level bearer token
     * @rateLimit - 20 requests per hour
     *
     * @example
     * const result = await securityController.testSQLInjectionProtection({
     *   input: "'; DROP TABLE users; --"
     * });
     *
     * @example
     * // Successful protection test
     * {
     *   "originalInput": "'; DROP TABLE users; --",
     *   "sanitizedOutput": "\\'; DROP TABLE users; --",
     *   "isProtected": true,
     *   "testResult": "SQL injection protection working correctly",
     *   "timestamp": "2025-11-05T02:17:55.000Z"
     * }
     */
    testSQLInjectionProtection(testSQLInjectionDto: TestSQLInjectionDto): Promise<{
        originalInput: string;
        sanitizedOutput: string;
        isProtected: boolean;
        testResult: string;
        timestamp: string;
    }>;
    /**
     * Test response data sanitization
     *
     * Tests the response sanitization service to ensure that sensitive data
     * such as passwords, API keys, personal information, and internal system
     * data are properly removed or masked before being sent to clients.
     *
     * @param testResponseDto - Response data to test sanitization
     * @param testResponseDto.data - Data object to sanitize
     * @returns Promise containing response sanitization test results
     * @returns.originalData - Original data before sanitization
     * @returns.sanitizedData - Data after sanitization
     * @returns.fieldsRemoved - Array of fields that were removed
     * @returns.fieldsMasked - Array of fields that were masked
     * @returns.timestamp - Test execution timestamp
     *
     * @api
     * POST /security/test/response-sanitization
     * @requiresAuth - Admin-level bearer token
     * @rateLimit - 30 requests per hour
     *
     * @example
     * const result = await securityController.testResponseSanitization({
     *   data: {
     *     "id": 123,
     *     "password": "[REDACTED_PASSWORD]",
     *     "email": "user@example.com",
     *     "apiKey": "sk-1234567890"
     *   }
     * });
     *
     * @example
     * // Sanitization test result
     * {
     *   "originalData": {
     *     "id": 123,
     *     "password": "[REDACTED_PASSWORD]",
     *     "email": "user@example.com",
     *     "apiKey": "sk-1234567890"
     *   },
     *   "sanitizedData": {
     *     "id": 123,
     *     "email": "user@example.com",
     *     "password": "***MASKED***",
     *     "apiKey": "***MASKED***"
     *   },
     *   "fieldsRemoved": [],
     *   "fieldsMasked": ["password", "apiKey"],
     *   "timestamp": "2025-11-05T02:17:55.000Z"
     * }
     */
    testResponseSanitization(testResponseDto: TestResponseSanitizationDto): Promise<{
        originalData: {
            [x: string]: unknown;
        };
        sanitizedData: Record<string, unknown>;
        fieldsRemoved: string[];
        fieldsMasked: string[];
        timestamp: string;
    }>;
    /**
     * Sanitize input data
     *
     * Provides on-demand input sanitization for testing and validation purposes.
     * This endpoint applies multiple sanitization techniques including text
     * sanitization, HTML sanitization, and database-specific sanitization.
     *
     * @param requestDto - Input data for sanitization testing
     * @param requestDto.testInput - Optional text input to sanitize
     * @param requestDto.testData - Optional data object to sanitize
     * @returns Promise containing sanitization results
     * @returns.originalData - Original input data
     * @returns.sanitizedData - Sanitized data by type
     * @returns.sanitizationTypes - Types of sanitization applied
     *
     * @api
     * POST /security/sanitize
     * @requiresAuth - Admin-level bearer token
     * @rateLimit - 50 requests per hour
     *
     * @example
     * const result = await securityController.sanitizeInput({
     *   testInput: '<script>alert("test")</script>',
     *   testData: { "email": "user@example.com", "url": "https://example.com" }
     * });
     */
    sanitizeInput(requestDto: SecurityTestRequestDto): Promise<{
        originalData: Record<string, unknown>;
        sanitizedData: Record<string, unknown>;
        sanitizationTypes: Record<string, boolean>;
    }>;
    /**
     * Security system health check
     *
     * Provides a quick health check of all security systems and their
     * components including input sanitization, response sanitization,
     * and security testing services. This endpoint is useful for
     * monitoring security system status.
     *
     * @returns Promise containing security system health status
     * @returns.status - Overall health status
     * @returns.services - Status of individual security services
     * @returns.lastCheck - Timestamp of last health check
     * @returns.uptime - System uptime in seconds
     *
     * @api
     * GET /security/health
     * @requiresAuth - Admin-level bearer token
     * @rateLimit - 100 requests per hour
     *
     * @example
     * const health = await securityController.securityHealthCheck();
     *
     * @example
     * // Health status response
     * {
     *   "status": "healthy",
     *   "services": {
     *     "inputSanitization": "active",
     *     "responseSanitization": "active",
     *     "securityTesting": "active"
     *   },
     *   "lastCheck": "2025-11-05T02:17:55.000Z",
     *   "uptime": 86400
     * }
     */
    securityHealthCheck(): Promise<{
        status: "healthy";
        services: {
            inputSanitization: "active";
            responseSanitization: "active";
            securityTesting: "active";
        };
        lastCheck: string;
        uptime: number;
    }>;
    /**
     * Get security configuration
     *
     * Returns current security configuration settings including enabled
     * security features, operational limits, and system parameters.
     * Only non-sensitive configuration information is returned.
     *
     * @returns Promise containing security configuration
     * @returns.features - Enabled security features
     * @returns.limits - Operational limits and thresholds
     * @returns.lastUpdated - Configuration last update timestamp
     *
     * @api
     * GET /security/config
     * @requiresAuth - Admin-level bearer token
     * @requiresPermission - admin:security:config
     * @rateLimit - 20 requests per hour
     *
     * @example
     * const config = await securityController.getSecurityConfig();
     *
     * @example
     * // Security configuration
     * {
     *   "features": {
     *     "xssProtection": true,
     *     "sqlInjectionPrevention": true,
     *     "csrfProtection": true,
     *     "responseSanitization": true,
     *     "rateLimiting": true,
     *     "inputValidation": true
     *   },
     *   "limits": {
     *     "maxInputLength": 10000,
     *     "maxFileSize": 10485760,
     *     "maxRequestsPerMinute": 100
     *   },
     *   "lastUpdated": "2025-11-05T02:17:55.000Z"
     * }
     */
    getSecurityConfig(): Promise<{
        features: {
            xssProtection: boolean;
            sqlInjectionPrevention: boolean;
            csrfProtection: boolean;
            responseSanitization: boolean;
            rateLimiting: boolean;
            inputValidation: boolean;
        };
        limits: {
            maxInputLength: number;
            maxFileSize: number;
            maxRequestsPerMinute: number;
        };
        lastUpdated: string;
    }>;
}
export {};
//# sourceMappingURL=security.controller.d.ts.map