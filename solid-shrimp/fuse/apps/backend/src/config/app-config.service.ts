import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { validateCloudRootPolicy } from './cloud-root-policy';

/**
 * Centralized Application Configuration Service
 *
 * This service provides type-safe access to all application configuration
 * with startup validation to ensure critical secrets are properly configured.
 *
 * Security Features:
 * - Fail-fast validation on startup
 * - No fallback defaults for critical secrets
 * - Minimum length requirements for JWT secrets (32 chars)
 * - Structured logging for configuration errors
 */
@Injectable()
export class AppConfigService implements OnModuleInit {
  private readonly logger = new Logger(AppConfigService.name);
  private validated = false;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Validate all critical configuration on module initialization
   * This ensures the application fails fast if improperly configured
   */
  async onModuleInit(): Promise<void> {
    this.logger.log('Starting application configuration validation...');

    const errors: string[] = [];

    // Validate JWT secrets
    this.validateSecret('JWT_SECRET', errors, { minLength: 32 });
    this.validateSecret('JWT_REFRESH_SECRET', errors, { minLength: 32, required: false });

    // Validate database configuration
    this.validateRequired('DATABASE_URL', errors);

    // Validate Redis configuration (required for caching)
    this.validateRequired('REDIS_URL', errors);

    // Validate environment
    const nodeEnv = this.nodeEnv;
    if (!['development', 'production', 'test'].includes(nodeEnv)) {
      errors.push(`NODE_ENV must be one of: development, production, test (got: ${nodeEnv})`);
    }

    // If we're in production, enforce stricter requirements
    if (nodeEnv === 'production') {
      this.validateProductionConfig(errors);
    }

    // Enforce cloud-rooted execution policy for runtime data stores
    const cloudPolicy = validateCloudRootPolicy(
      nodeEnv,
      this.configService.get<string>('DATABASE_URL'),
      this.configService.get<string>('REDIS_URL')
    );
    if (!cloudPolicy.ok && cloudPolicy.reason) {
      errors.push(cloudPolicy.reason);
    }

    // Fail fast if any validation errors occurred
    if (errors.length > 0) {
      this.logger.error('Configuration validation failed:');
      errors.forEach((error, index) => {
        this.logger.error(`  ${index + 1}. ${error}`);
      });
      this.logger.error('\nApplication cannot start with invalid configuration.');
      this.logger.error('Please check your .env file and ensure all required secrets are set.');
      throw new Error(
        `Configuration validation failed with ${errors.length} error(s). See logs for details.`
      );
    }

    this.validated = true;
    this.logger.log('Configuration validation successful');
  }

  /**
   * Validate a required secret with optional constraints
   */
  private validateSecret(
    key: string,
    errors: string[],
    options: { minLength?: number; required?: boolean } = {}
  ): void {
    const { minLength = 32, required = true } = options;
    const value = this.configService.get<string>(key);

    if (!value || value.trim() === '') {
      if (required) {
        errors.push(`${key} is required but not set`);
      }
      return;
    }

    // Check for default/placeholder values (warning only, not a hard error)
    const dangerousDefaults = [
      'your-secret-key',
      '[REDACTED_SECRET]',
      'changeme',
      'password',
      'your-super-secret',
    ];

    if (dangerousDefaults.some((bad) => value.toLowerCase().includes(bad))) {
      this.logger.warn(
        `WARNING: ${key} appears to contain a placeholder value. Consider using a strong, random secret.`
      );
    }

    // Validate minimum length (this is still a hard error for security)
    if (value.length < minLength) {
      errors.push(
        `${key} must be at least ${minLength} characters long (current: ${value.length})`
      );
    }
  }

  /**
   * Validate a required configuration value
   */
  private validateRequired(key: string, errors: string[]): void {
    const value = this.configService.get<string>(key);

    if (!value || value.trim() === '') {
      errors.push(`${key} is required but not set`);
    }
  }

  /**
   * Additional validation for production environments
   * Note: Some checks are warnings to allow initial deployment
   */
  private validateProductionConfig(errors: string[]): void {
    // Ensure CORS origins are properly configured
    const corsOrigins = this.corsOrigins;
    if (corsOrigins.includes('http://localhost:3000')) {
      this.logger.warn(
        'WARNING: Production environment includes localhost in CORS_ORIGINS. This may be a security risk.'
      );
    }

    // Warn about frontend URL (not a hard error to allow initial deployment)
    if (!this.configService.get<string>('FRONTEND_URL')) {
      this.logger.warn(
        'WARNING: FRONTEND_URL is not set. This should be configured for production.'
      );
    }

    // Warn about API keys (not a hard error to allow initial deployment)
    if (
      !this.configService.get<string>('ANTHROPIC_API_KEY') &&
      !this.configService.get<string>('OPENAI_API_KEY')
    ) {
      this.logger.warn(
        'WARNING: No AI service API key (ANTHROPIC_API_KEY or OPENAI_API_KEY) is set. AI features may not work.'
      );
    }
  }

  /**
   * Ensure configuration has been validated before use
   */
  private ensureValidated(): void {
    if (!this.validated) {
      throw new Error(
        'AppConfigService has not been validated yet. This should not happen - check module initialization order.'
      );
    }
  }

  // ============================================================================
  // Type-safe Configuration Getters
  // ============================================================================

  /**
   * Get JWT secret (guaranteed to exist and be secure after validation)
   */
  get jwtSecret(): string {
    this.ensureValidated();
    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error(
        'JWT_SECRET is not configured. This should have been caught during validation.'
      );
    }
    return secret;
  }

  /**
   * Get JWT refresh secret (falls back to main JWT secret if not set)
   */
  get jwtRefreshSecret(): string {
    this.ensureValidated();
    return this.configService.get<string>('JWT_REFRESH_SECRET') || this.jwtSecret;
  }

  /**
   * Get JWT issuer
   */
  get jwtIssuer(): string {
    return this.configService.get<string>('JWT_ISSUER') || 'the-new-fuse';
  }

  /**
   * Get JWT expiration time
   */
  get jwtExpiresIn(): string {
    return this.configService.get<string>('JWT_EXPIRES_IN') || '7d';
  }

  /**
   * Get database URL (guaranteed to exist after validation)
   */
  get databaseUrl(): string {
    this.ensureValidated();
    const url = this.configService.get<string>('DATABASE_URL');
    if (!url) {
      throw new Error(
        'DATABASE_URL is not configured. This should have been caught during validation.'
      );
    }
    return url;
  }

  /**
   * Get Redis URL (guaranteed to exist after validation)
   */
  get redisUrl(): string {
    this.ensureValidated();
    const url = this.configService.get<string>('REDIS_URL');
    if (!url) {
      throw new Error(
        'REDIS_URL is not configured. This should have been caught during validation.'
      );
    }
    return url;
  }

  /**
   * Get Redis host
   */
  get redisHost(): string {
    return this.configService.get<string>('REDIS_HOST') || 'localhost';
  }

  /**
   * Get Redis port
   */
  get redisPort(): number {
    return this.configService.get<number>('REDIS_PORT') || 6379;
  }

  /**
   * Get Redis password (optional)
   */
  get redisPassword(): string | undefined {
    return this.configService.get<string>('REDIS_PASSWORD');
  }

  /**
   * Get application port
   */
  get port(): number {
    return this.configService.get<number>('PORT') || 3001;
  }

  /**
   * Get node environment
   */
  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV') || 'development';
  }

  /**
   * Check if running in production
   */
  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  /**
   * Check if running in development
   */
  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  /**
   * Check if running in test
   */
  get isTest(): boolean {
    return this.nodeEnv === 'test';
  }

  /**
   * Get CORS origins as array
   */
  get corsOrigins(): string[] {
    const origins = this.configService.get<string>('CORS_ORIGINS');
    if (origins) {
      return origins.split(',').map((o) => o.trim());
    }
    return ['http://localhost:3000'];
  }

  /**
   * Get frontend URL
   */
  get frontendUrl(): string {
    return this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
  }

  /**
   * Get backend URL
   */
  get backendUrl(): string {
    return this.configService.get<string>('BACKEND_URL') || `http://localhost:${this.port}`;
  }

  /**
   * Get API base URL
   */
  get apiBaseUrl(): string {
    return this.configService.get<string>('API_BASE_URL') || this.backendUrl;
  }

  /**
   * Get Anthropic API key (optional)
   */
  get anthropicApiKey(): string | undefined {
    return this.configService.get<string>('ANTHROPIC_API_KEY');
  }

  /**
   * Get OpenAI API key (optional)
   */
  get openaiApiKey(): string | undefined {
    return this.configService.get<string>('OPENAI_API_KEY');
  }

  /**
   * Get Gemini API key (optional)
   */
  get geminiApiKey(): string | undefined {
    return this.configService.get<string>('GEMINI_API_KEY');
  }

  /**
   * Get OpenRouter API key (optional)
   */
  get openRouterApiKey(): string | undefined {
    return this.configService.get<string>('OPENROUTER_API_KEY');
  }

  /**
   * Get Brave API key (optional)
   */
  get braveApiKey(): string | undefined {
    return this.configService.get<string>('BRAVE_API_KEY');
  }

  /**
   * Get Firebase project ID (optional)
   */
  get firebaseProjectId(): string | undefined {
    return this.configService.get<string>('FIREBASE_PROJECT_ID');
  }

  /**
   * Get Firebase private key (optional)
   */
  get firebasePrivateKey(): string | undefined {
    return this.configService.get<string>('FIREBASE_PRIVATE_KEY');
  }

  /**
   * Get Firebase client email (optional)
   */
  get firebaseClientEmail(): string | undefined {
    return this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
  }

  /**
   * Get Supabase URL (optional)
   */
  get supabaseUrl(): string | undefined {
    return this.configService.get<string>('SUPABASE_URL');
  }

  /**
   * Get Supabase key (optional)
   */
  get supabaseKey(): string | undefined {
    return this.configService.get<string>('SUPABASE_KEY');
  }

  /**
   * Get Supabase service role key (optional)
   */
  get supabaseServiceRoleKey(): string | undefined {
    return this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
  }

  /**
   * Get SMTP configuration
   */
  get smtp(): {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
  } {
    return {
      host: this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com',
      port: this.configService.get<number>('SMTP_PORT') || 587,
      user: this.configService.get<string>('SMTP_USER') || '',
      pass: this.configService.get<string>('SMTP_PASS') || '',
      from: this.configService.get<string>('FROM_EMAIL') || 'noreply@thenewfuse.com',
    };
  }

  /**
   * Get log level
   */
  get logLevel(): string {
    return this.configService.get<string>('LOG_LEVEL') || 'info';
  }

  /**
   * Get a custom configuration value with optional default
   */
  get<T = string>(key: string, defaultValue?: T): T | undefined {
    return this.configService.get<T>(key, defaultValue);
  }

  /**
   * Get a required custom configuration value (throws if not found)
   */
  getOrThrow<T = string>(key: string): T {
    const value = this.configService.get<T>(key);
    if (value === undefined || value === null || value === '') {
      throw new Error(`Required configuration value ${key} is not set`);
    }
    return value;
  }
}
