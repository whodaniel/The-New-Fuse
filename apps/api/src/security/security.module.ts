import { Module, Global } from '@nestjs/common';
import { SecurityLoggingService } from './security-logging.service.js';
import { InputSanitizationService } from './input-sanitization.service.js';
import { ResponseSanitizationService } from './response-sanitization.service.js';
import { EnhancedRateLimitService } from './enhanced-rate-limit.service.js';
import { ApiEndpointMonitoringService } from './api-endpoint-monitoring.service.js';
import { SecurityIntegrationService } from './security-integration.service.js';

/**
 * Global Security Module
 * 
 * Provides security services globally so they can be injected anywhere,
 * including in guards that are used as decorators on controllers.
 */
@Global()
@Module({
  providers: [
    SecurityLoggingService,
    InputSanitizationService,
    ResponseSanitizationService,
    EnhancedRateLimitService,
    ApiEndpointMonitoringService,
    SecurityIntegrationService,
  ],
  exports: [
    SecurityLoggingService,
    InputSanitizationService,
    ResponseSanitizationService,
    EnhancedRateLimitService,
    ApiEndpointMonitoringService,
    SecurityIntegrationService,
  ],
})
export class SecurityModule {}
