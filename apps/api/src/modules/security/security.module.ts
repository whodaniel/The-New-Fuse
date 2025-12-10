import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SecurityController } from '../../controllers/security.controller';
import { InputSanitizationService } from '../../security/input-sanitization.service';
import { ResponseSanitizationService } from '../../security/response-sanitization.service';
import { SecurityTestingService } from '../../security/security-testing.service';

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
  providers: [SecurityTestingService, InputSanitizationService, ResponseSanitizationService],
  exports: [SecurityTestingService, InputSanitizationService, ResponseSanitizationService],
})
export class SecurityModule {}
