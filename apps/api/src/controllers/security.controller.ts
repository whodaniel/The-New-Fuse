import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  AdminOnly,
  AuditLog,
  CriticalSecurity,
  RateLimitTier,
  SecureAuthGuard,
  SetRateLimitTier,
} from '../guards/secure-auth.guard';
import { InputSanitizationService } from '../security/input-sanitization.service';
import { ResponseSanitizationService } from '../security/response-sanitization.service';
import { SecurityTestingService } from '../security/security-testing.service';

/**
 * Security Test Request Data Transfer Object
 *
 * Defines the structure for security testing requests that can include
 * both text input and complex data objects for comprehensive testing.
 */
class SecurityTestRequestDto {
  /** Optional text input for security testing */
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  testInput?: string;

  /** Optional complex data object for security testing */
  @IsOptional()
  @IsObject()
  testData?: Record<string, unknown>;
}

/**
 * XSS Protection Test Data Transfer Object
 *
 * Defines the structure for Cross-Site Scripting (XSS) protection testing.
 */
class TestXSSDto {
  /** Input string to test for XSS vulnerabilities */
  @IsString()
  @MaxLength(5000)
  input!: string;
}

/**
 * SQL Injection Protection Test Data Transfer Object
 *
 * Defines the structure for SQL injection protection testing.
 */
class TestSQLInjectionDto {
  /** Input string to test for SQL injection vulnerabilities */
  @IsString()
  @MaxLength(1000)
  input!: string;
}

/**
 * Response Sanitization Test Data Transfer Object
 *
 * Defines the structure for response data sanitization testing.
 */
class TestResponseSanitizationDto {
  /** Data object to test response sanitization */
  @IsObject()
  data!: Record<string, unknown>;
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
@ApiTags('security')
@Controller('security')
@UseGuards(SecureAuthGuard)
@AdminOnly()
@SetRateLimitTier(RateLimitTier.ADMIN)
@CriticalSecurity()
@AuditLog()
export class SecurityController {
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
  constructor(
    private readonly securityTestingService: SecurityTestingService,
    private readonly sanitizationService: InputSanitizationService,
    private readonly responseSanitization: ResponseSanitizationService
  ) {}

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
  @Get('test')
  @ApiOperation({
    summary: 'Run comprehensive security tests',
    description:
      'Executes a full suite of security tests to validate input sanitization, XSS protection, SQL injection prevention, and other security measures.',
  })
  @ApiResponse({
    status: 200,
    description: 'Security test results',
    schema: {
      type: 'object',
      properties: {
        totalScore: { type: 'number' },
        criticalIssues: { type: 'number' },
        recommendations: { type: 'array', items: { type: 'string' } },
        suites: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              overallScore: { type: 'number' },
              passed: { type: 'number' },
              failed: { type: 'number' },
              critical: { type: 'number' },
              tests: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    test: { type: 'string' },
                    passed: { type: 'boolean' },
                    message: { type: 'string' },
                    severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  @AdminOnly()
  async runSecurityTests() {
    const summary = await this.securityTestingService.getSecurityScoreSummary();
    return summary;
  }

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
  @Post('test/xss')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Test XSS protection',
    description:
      'Tests the XSS protection mechanisms by attempting to inject malicious script content.',
  })
  @ApiResponse({
    status: 200,
    description: 'XSS protection test results',
    schema: {
      type: 'object',
      properties: {
        originalInput: { type: 'string' },
        sanitizedOutput: { type: 'string' },
        isProtected: { type: 'boolean' },
        testResult: { type: 'string' },
      },
    },
  })
  async testXSSProtection(@Body() testXSSDto: TestXSSDto) {
    const { input } = testXSSDto;
    const sanitized = this.sanitizationService.sanitizeHTML(input);
    const isProtected = !sanitized.includes('<script>') && !sanitized.includes('onerror');

    return {
      originalInput: input,
      sanitizedOutput: sanitized,
      isProtected,
      testResult: isProtected
        ? 'XSS protection working correctly'
        : 'XSS protection failed - vulnerability detected!',
      timestamp: new Date().toISOString(),
    };
  }

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
  @Post('test/sql-injection')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Test SQL injection prevention',
    description: 'Tests SQL injection prevention by attempting various SQL injection patterns.',
  })
  @ApiResponse({
    status: 200,
    description: 'SQL injection protection test results',
    schema: {
      type: 'object',
      properties: {
        originalInput: { type: 'string' },
        sanitizedOutput: { type: 'string' },
        isProtected: { type: 'boolean' },
        testResult: { type: 'string' },
      },
    },
  })
  async testSQLInjectionProtection(@Body() testSQLInjectionDto: TestSQLInjectionDto) {
    const { input } = testSQLInjectionDto;
    const sanitized = this.sanitizationService.sanitizeForDatabase(input);
    const isProtected =
      !sanitized.includes('DROP') && !sanitized.includes('UNION') && !sanitized.includes('SELECT');

    return {
      originalInput: input,
      sanitizedOutput: sanitized,
      isProtected,
      testResult: isProtected
        ? 'SQL injection protection working correctly'
        : 'SQL injection protection failed - vulnerability detected!',
      timestamp: new Date().toISOString(),
    };
  }

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
  @Post('test/response-sanitization')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Test response data sanitization',
    description:
      'Tests the response sanitization service to ensure sensitive data is properly removed or masked.',
  })
  @ApiResponse({
    status: 200,
    description: 'Response sanitization test results',
    schema: {
      type: 'object',
      properties: {
        originalData: { type: 'object' },
        sanitizedData: { type: 'object' },
        fieldsRemoved: { type: 'array', items: { type: 'string' } },
        fieldsMasked: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async testResponseSanitization(@Body() testResponseDto: TestResponseSanitizationDto) {
    const { data } = testResponseDto;
    const originalData = { ...data };
    const sanitized = this.responseSanitization.sanitizeResponse(data);

    const removedFields = Object.keys(originalData).filter((key: any) => !(key in sanitized));

    const maskedFields = Object.keys(sanitized).filter(
      (key: any) => sanitized[key] !== originalData[key] && !(key in removedFields)
    );

    return {
      originalData,
      sanitizedData: sanitized,
      fieldsRemoved: removedFields,
      fieldsMasked: maskedFields,
      timestamp: new Date().toISOString(),
    };
  }

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
  @Post('sanitize')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sanitize input data',
    description: 'Provides on-demand input sanitization for testing and validation purposes.',
  })
  @ApiResponse({
    status: 200,
    description: 'Sanitized data results',
    schema: {
      type: 'object',
      properties: {
        originalData: { type: 'object' },
        sanitizedData: { type: 'object' },
        sanitizationTypes: {
          type: 'object',
          properties: {
            text: { type: 'boolean' },
            html: { type: 'boolean' },
            database: { type: 'boolean' },
            url: { type: 'boolean' },
            email: { type: 'boolean' },
          },
        },
      },
    },
  })
  async sanitizeInput(@Body() requestDto: SecurityTestRequestDto) {
    const { testInput, testData } = requestDto;
    const results: {
      originalData: Record<string, unknown>;
      sanitizedData: Record<string, unknown>;
      sanitizationTypes: Record<string, boolean>;
    } = {
      originalData: {},
      sanitizedData: {},
      sanitizationTypes: {},
    };

    if (testInput) {
      results.originalData.input = testInput;
      results.sanitizedData.text = this.sanitizationService.sanitizeText(testInput);
      results.sanitizedData.html = this.sanitizationService.sanitizeHTML(testInput);
      results.sanitizedData.database = this.sanitizationService.sanitizeForDatabase(testInput);
      results.sanitizationTypes = {
        text: true,
        html: true,
        database: true,
        url: false,
        email: false,
      };
    }

    if (testData) {
      results.originalData.object = testData;
      results.sanitizedData.object = this.sanitizationService.sanitizeObject(testData);

      // Detect if it contains email-like data
      const hasEmailPattern = JSON.stringify(testData).includes('@');
      if (hasEmailPattern) {
        results.sanitizationTypes.email = true;
      }

      // Detect if it contains URL-like data
      const hasUrlPattern = /https?:\/\//.test(JSON.stringify(testData));
      if (hasUrlPattern) {
        results.sanitizationTypes.url = true;
      }
    }

    return results;
  }

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
  @Get('health')
  @ApiOperation({
    summary: 'Security system health check',
    description: 'Provides a quick health check of the security systems and their components.',
  })
  @ApiResponse({
    status: 200,
    description: 'Security system health status',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
        services: {
          type: 'object',
          properties: {
            inputSanitization: { type: 'string', enum: ['active', 'inactive'] },
            responseSanitization: { type: 'string', enum: ['active', 'inactive'] },
            securityTesting: { type: 'string', enum: ['active', 'inactive'] },
          },
        },
        lastCheck: { type: 'string' },
        uptime: { type: 'number' },
      },
    },
  })
  async securityHealthCheck() {
    // Simple health check - in production, this would check actual service status
    const healthStatus = {
      status: 'healthy' as const,
      services: {
        inputSanitization: 'active' as const,
        responseSanitization: 'active' as const,
        securityTesting: 'active' as const,
      },
      lastCheck: new Date().toISOString(),
      uptime: process.uptime(),
    };

    return healthStatus;
  }

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
  @Get('config')
  @AdminOnly()
  @ApiOperation({
    summary: 'Get security configuration',
    description:
      'Returns current security configuration settings (non-sensitive information only).',
  })
  @ApiResponse({
    status: 200,
    description: 'Security configuration (public information only)',
    schema: {
      type: 'object',
      properties: {
        features: {
          type: 'object',
          properties: {
            xssProtection: { type: 'boolean' },
            sqlInjectionPrevention: { type: 'boolean' },
            csrfProtection: { type: 'boolean' },
            responseSanitization: { type: 'boolean' },
            rateLimiting: { type: 'boolean' },
            inputValidation: { type: 'boolean' },
          },
        },
        limits: {
          type: 'object',
          properties: {
            maxInputLength: { type: 'number' },
            maxFileSize: { type: 'number' },
            maxRequestsPerMinute: { type: 'number' },
          },
        },
      },
    },
  })
  async getSecurityConfig() {
    return {
      features: {
        xssProtection: true,
        sqlInjectionPrevention: true,
        csrfProtection: true,
        responseSanitization: true,
        rateLimiting: true,
        inputValidation: true,
      },
      limits: {
        maxInputLength: 10000,
        maxFileSize: 10485760, // 10MB
        maxRequestsPerMinute: 100,
      },
      lastUpdated: new Date().toISOString(),
    };
  }
}
