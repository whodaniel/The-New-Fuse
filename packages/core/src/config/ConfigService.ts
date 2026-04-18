
import { Injectable } from '@nestjs/common';
import { SystemConfig, DatabaseConfig, RedisConfig, MonitoringConfig, AIConfig } from '../types/index.js';
import { ServiceState } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { ConfigurationError } from '../utils/errors.js';

export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  STAGING: 'staging',
  TEST: 'test',
} as const;

@Injectable()
export class ConfigService {
  private state: ServiceState = ServiceState.UNINITIALIZED;
  private config: SystemConfig;
  private readonly requiredEnvVars = [
    'NODE_ENV',
    'DATABASE_URL',
    'REDIS_HOST',
    'REDIS_PORT',
  ];

  constructor() {
    logger.setContext('ConfigService');
    this.config = this.loadConfiguration();
  }

  async start(): Promise<void> {
    if (this.state === ServiceState.RUNNING) {
      logger.warn('ConfigService is already running');
      return;
    }

    try {
      this.state = ServiceState.INITIALIZING;
      logger.info('Starting ConfigService');

      // Validate configuration
      this.validateConfiguration();

      this.state = ServiceState.RUNNING;
      logger.info('ConfigService started successfully', { 
        environment: this.config.environment 
      });
    } catch (error) {
      this.state = ServiceState.ERROR;
      logger.error('Failed to start ConfigService', error as Error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (this.state === ServiceState.STOPPED) {
      logger.warn('ConfigService is already stopped');
      return;
    }

    try {
      this.state = ServiceState.STOPPING;
      logger.info('Stopping ConfigService');

      this.state = ServiceState.STOPPED;
      logger.info('ConfigService stopped successfully');
    } catch (error) {
      this.state = ServiceState.ERROR;
      logger.error('Failed to stop ConfigService', error as Error);
      throw error;
    }
  }

  getState(): ServiceState {
    return this.state;
  }

  // Configuration getters
  get<T = any>(key: string, defaultValue?: T): T {
    const keys = key.split('.');
    let value: any = this.config;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue as T;
      }
    }

    return value as T;
  }

  getEnvironment(): string {
    return this.config.environment;
  }

  isDevelopment(): boolean {
    return this.config.environment === ENVIRONMENTS.DEVELOPMENT;
  }

  isProduction(): boolean {
    return this.config.environment === ENVIRONMENTS.PRODUCTION;
  }

  isStaging(): boolean {
    return this.config.environment === ENVIRONMENTS.STAGING;
  }

  isTest(): boolean {
    return this.config.environment === ENVIRONMENTS.TEST;
  }

  getDatabaseConfig(): DatabaseConfig {
    return this.config.database;
  }

  getRedisConfig(): RedisConfig {
    return this.config.redis;
  }

  getRedisHost(): string {
    return this.config.redis.host;
  }

  getRedisPort(): number {
    return this.config.redis.port;
  }

  getRedisPassword(): string | undefined {
    return this.config.redis.password;
  }

  getRedisDb(): number {
    return this.config.redis.db || 0;
  }

  getMonitoringConfig(): MonitoringConfig {
    return this.config.monitoring;
  }

  getAIConfig(): AIConfig {
    return this.config.ai;
  }

  // Environment variable helpers
  getEnv(key: string, defaultValue?: string): string {
    // 1. Check primary key
    if (process.env[key]) return process.env[key]!;

    // 2. Check Stripe Projects CLI protocol fallback (e.g. STRIPE_PROJECT_POSTGRES_URL)
    const stripeProjectKey = this.mapToStripeProjectKey(key);
    if (stripeProjectKey && process.env[stripeProjectKey]) {
      return process.env[stripeProjectKey]!;
    }

    // 3. Check generic STRIPE_PROJECT_ prefix if not already checked
    const genericStripeKey = `STRIPE_PROJECT_${key}`;
    if (process.env[genericStripeKey]) {
      return process.env[genericStripeKey]!;
    }

    return defaultValue || '';
  }

  private mapToStripeProjectKey(key: string): string | null {
    const mapping: Record<string, string> = {
      'DATABASE_URL': 'STRIPE_PROJECT_POSTGRES_URL',
      'REDIS_HOST': 'STRIPE_PROJECT_REDIS_HOST',
      'REDIS_PORT': 'STRIPE_PROJECT_REDIS_PORT',
      'REDIS_PASSWORD': 'STRIPE_PROJECT_REDIS_PASSWORD',
      'OPENAI_API_KEY': 'STRIPE_PROJECT_OPENAI_API_KEY',
    };
    return mapping[key] || null;
  }

  getEnvNumber(key: string, defaultValue?: number): number {
    const value = process.env[key];
    if (!value) return defaultValue || 0;
    
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      logger.warn('Invalid number in environment variable', { key, value });
      return defaultValue || 0;
    }
    
    return parsed;
  }

  getEnvBoolean(key: string, defaultValue?: boolean): boolean {
    const value = process.env[key];
    if (!value) return defaultValue || false;
    
    return value.toLowerCase() === 'true' || value === '1';
  }

  getEnvArray(key: string, separator: string = ',', defaultValue?: string[]): string[] {
    const value = process.env[key];
    if (!value) return defaultValue || [];
    
    return value.split(separator).map(item => item.trim()).filter(Boolean);
  }

  // Configuration validation
  private validateConfiguration(): void {
    logger.info('Validating configuration');

    // Check required environment variables
    const missing = this.requiredEnvVars.filter(key => !process.env[key]);
    if (missing.length > 0) {
      throw new ConfigurationError(
        `Missing required environment variables: ${missing.join(', ')}`,
        { missing }
      );
    }

    // Validate environment
    const validEnvironments = Object.values(ENVIRONMENTS);
    if (!validEnvironments.includes(this.config.environment as any)) {
      throw new ConfigurationError(
        `Invalid environment: ${this.config.environment}. Must be one of: ${validEnvironments.join(', ')}`,
        { environment: this.config.environment, validEnvironments }
      );
    }

    // Validate database URL
    if (!this.isValidUrl(this.config.database.url)) {
      throw new ConfigurationError(
        'Invalid database URL format',
        { url: this.config.database.url }
      );
    }

    // Validate Redis configuration
    if (!this.config.redis.host || this.config.redis.port <= 0 || this.config.redis.port > 65535) {
      throw new ConfigurationError(
        'Invalid Redis configuration',
        { host: this.config.redis.host, port: this.config.redis.port }
      );
    }

    logger.info('Configuration validation completed successfully');
  }

  private loadConfiguration(): SystemConfig {
    logger.info('Loading configuration from environment');

    const environment = (process.env.NODE_ENV || ENVIRONMENTS.DEVELOPMENT) as SystemConfig['environment'];

    const config: SystemConfig = {
      environment,
      database: this.loadDatabaseConfig(),
      redis: this.loadRedisConfig(),
      monitoring: this.loadMonitoringConfig(),
      ai: this.loadAIConfig(),
    };

    logger.info('Configuration loaded', { 
      environment: config.environment,
      databaseConfigured: !!config.database.url,
      redisConfigured: !!config.redis.host,
      monitoringEnabled: config.monitoring.enabled,
      aiProvidersCount: config.ai.providers.length,
    });

    return config;
  }

  private loadDatabaseConfig(): DatabaseConfig {
    return {
      url: this.getEnv('DATABASE_URL'),
      maxConnections: this.getEnvNumber('DATABASE_MAX_CONNECTIONS', 10),
      connectionTimeout: this.getEnvNumber('DATABASE_CONNECTION_TIMEOUT', 30000),
      queryTimeout: this.getEnvNumber('DATABASE_QUERY_TIMEOUT', 60000),
    };
  }

  private loadRedisConfig(): RedisConfig {
    return {
      host: this.getEnv('REDIS_HOST', 'localhost'),
      port: this.getEnvNumber('REDIS_PORT', 6379),
      password: this.getEnv('REDIS_PASSWORD'),
      db: this.getEnvNumber('REDIS_DB', 0),
      maxRetries: this.getEnvNumber('REDIS_MAX_RETRIES', 3),
    };
  }

  private loadMonitoringConfig(): MonitoringConfig {
    return {
      enabled: this.getEnvBoolean('MONITORING_ENABLED', true),
      metricsInterval: this.getEnvNumber('METRICS_INTERVAL', 30000),
      logLevel: (this.getEnv('LOG_LEVEL', 'info') as MonitoringConfig['logLevel']),
      enablePerformanceTracking: this.getEnvBoolean('ENABLE_PERFORMANCE_TRACKING', true),
    };
  }

  private loadAIConfig(): AIConfig {
    const providers = this.getEnvArray('AI_PROVIDERS', ',', ['ollama', 'lmstudio']);
    
    return {
      providers: providers.map(name => ({
        name,
        type: name as any,
        endpoint: this.getEnv(`${name.toUpperCase()}_ENDPOINT`, `http://localhost:${this.getDefaultPort(name)}`),
        command: this.getEnv(`${name.toUpperCase()}_COMMAND`, name),
        checkCommand: this.getEnv(`${name.toUpperCase()}_CHECK_COMMAND`),
        models: this.getEnvArray(`${name.toUpperCase()}_MODELS`, ',', []),
      })),
      defaultProvider: this.getEnv('DEFAULT_AI_PROVIDER', providers[0]),
      maxConcurrentRequests: this.getEnvNumber('AI_MAX_CONCURRENT_REQUESTS', 5),
      requestTimeout: this.getEnvNumber('AI_REQUEST_TIMEOUT', 30000),
    };
  }

  private getDefaultPort(providerName: string): number {
    const defaultPorts: Record<string, number> = {
      ollama: 11434,
      lmstudio: 1234,
      localai: 8080,
    };
    
    return defaultPorts[providerName] || 8080;
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Configuration updates (for runtime configuration changes)
  updateConfig(path: string, value: any): void {
    const keys = path.split('.');
    let target: any = this.config;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in target) || typeof target[key] !== 'object') {
        target[key] = {};
      }
      target = target[key];
    }

    const finalKey = keys[keys.length - 1];
    const oldValue = target[finalKey];
    target[finalKey] = value;

    logger.info('Configuration updated', { 
      path, 
      oldValue, 
      newValue: value 
    });
  }

  // Configuration export/import for debugging
  exportConfig(): Record<string, any> {
    return {
      ...this.config,
      // Mask sensitive information
      database: {
        ...this.config.database,
        url: this.maskSensitiveUrl(this.config.database.url),
      },
      redis: {
        ...this.config.redis,
        password: this.config.redis.password ? '***masked***' : undefined,
      },
    };
  }

  private maskSensitiveUrl(url: string): string {
    try {
      const parsed = new URL(url);
      if (parsed.password) {
        parsed.password = '***masked***';
      }
      return parsed.toString();
    } catch {
      return '***invalid-url***';
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: Record<string, any> }> {
    try {
      const details = {
        state: this.state,
        environment: this.config.environment,
        configurationValid: true,
        requiredEnvVarsPresent: this.requiredEnvVars.every(key => !!process.env[key]),
      };

      const status = this.state === ServiceState.RUNNING && details.requiredEnvVarsPresent 
        ? 'healthy' 
        : 'unhealthy';

      return { status, details };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: (error as Error).message,
          state: this.state,
        },
      };
    }
  }
}
