import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppConfigService } from './app-config.service';

/**
 * Global Application Configuration Module
 *
 * This module provides centralized, type-safe access to application configuration
 * across the entire application. It is marked as @Global() so it doesn't need to be
 * imported in every module that needs access to configuration.
 *
 * Features:
 * - Global availability (no need to import in consuming modules)
 * - Fail-fast validation on startup
 * - Type-safe configuration getters
 * - No hardcoded secrets or fallback defaults
 *
 * Usage:
 * 1. Import AppConfigModule in AppModule
 * 2. Inject AppConfigService in any service/controller
 * 3. Use type-safe getters: configService.jwtSecret, configService.databaseUrl, etc.
 *
 * Example:
 * ```typescript
 * constructor(private readonly appConfig: AppConfigService) {}
 *
 * someMethod() {
 *   const secret = this.appConfig.jwtSecret;  // Type-safe, validated
 *   const dbUrl = this.appConfig.databaseUrl;  // Type-safe, validated
 * }
 * ```
 */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env.local', '.env'],
      cache: true,
      expandVariables: true,
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
