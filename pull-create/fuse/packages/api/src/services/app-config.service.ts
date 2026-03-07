/**
 * Application Configuration Service
 * Centralizes access to all application configuration
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  private readonly logger = new Logger(AppConfigService.name);

  constructor(private configService: ConfigService) {
    this.logger.log('Initializing application configuration service');
  }

  /**
   * Get a configuration value with type safety
   * @param key Configuration key
   * @param defaultValue Default value if not found
   * @returns Configuration value
   */
  get<T>(key: string, defaultValue?: T): T {
    // Handle the case where defaultValue is undefined
    if (defaultValue === undefined) {
      const value = this.configService.get<T>(key);

      if (value === undefined) {
        this.logger.warn(`Configuration key "${key}" not found and no default value provided`);
      }

      return value as T;
    }

    // Handle the case where defaultValue is provided
    // Use type assertion to fix the type compatibility issue
    const value = this.configService.get(key, { infer: true });
    return (value === undefined ? defaultValue : value) as T;
  }

  /**
   * Get the application environment (development, production, etc.)
   * @returns Application environment
   */
  get environment(): string {
    return this.get<string>('NODE_ENV', 'development');
  }

  /**
   * Check if the application is running in production
   * @returns True if in production
   */
  get isProduction(): boolean {
    return this.environment === 'production';
  }

  /**
   * Check if the application is running in development
   * @returns True if in development
   */
  get isDevelopment(): boolean {
    return this.environment === 'development';
  }

  /**
   * Get the server port
   * @returns Server port
   */
  get port(): number {
    return this.get<number>('PORT', 3000);
  }

  /**
   * Get the JWT configuration
   * @returns JWT configuration
   */
  get jwt() {
    return {
      secret: this.get<string>('JWT_SECRET', 'dev-secret-key'),
      expiresIn: this.get<string>('JWT_EXPIRES_IN', '7d'),
    };
  }

  /**
   * Get the database configuration
   * @returns Database configuration
   */
  get database() {
    return {
      url: this.get<string>('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/fuse'),
    };
  }

  /**
   * Get the logging configuration
   * @returns Logging configuration
   */
  get logging() {
    return {
      level: this.get<string>('LOG_LEVEL', 'info'),
    };
  }
}