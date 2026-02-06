import { Global, Module } from '@nestjs/common';
import { ApiEndpointMonitoringService } from './api-endpoint-monitoring.service';
import { EnhancedRateLimitService } from './enhanced-rate-limit.service';
import { InputSanitizationService } from './input-sanitization.service';
import { ResponseSanitizationService } from './response-sanitization.service';
import { SecurityIntegrationService } from './security-integration.service';
import { SecurityLoggingService } from './security-logging.service';

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
