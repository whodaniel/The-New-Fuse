import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SecurityController } from '../../controllers/security.controller.js';
import { InputSanitizationService } from '../../security/input-sanitization.service.js';
import { ResponseSanitizationService } from '../../security/response-sanitization.service.js';
import { SecurityLoggingService } from '../../security/security-logging.service.js';
import { SecurityTestingService } from '../../security/security-testing.service.js';

/**
 * Security Module
 *
 * Provides comprehensive security testing, monitoring, and configuration
 * management capabilities. This module handles security validation,
 * vulnerability testing, input sanitization verification, and security
 * system health monitoring.
 *
 * The module includes:
 * - Comprehensive security test suites
 * - XSS (Cross-Site Scripting) protection testing
 * - SQL injection prevention validation
 * - Input sanitization verification
 * - Response data sanitization testing
 * - Security system health monitoring
 * - Security configuration management
 */
@Module({
  imports: [JwtModule],
  controllers: [SecurityController],
  providers: [
    SecurityTestingService,
    InputSanitizationService,
    ResponseSanitizationService,
    SecurityLoggingService,
  ],
  exports: [SecurityTestingService, InputSanitizationService, ResponseSanitizationService],
})
export class SecurityModule {}
