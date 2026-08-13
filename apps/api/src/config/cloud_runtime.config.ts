import { ConfigService } from '@nestjs/config';

/**
 * CloudRuntime Environment Configuration
 * Handles CloudRuntime-specific environment variable parsing and configuration
 */
export class CloudRuntimeConfigService {
  constructor(private configService: ConfigService) {}

  /**
   * Get the proper database URL for CloudRuntime environment
   */
  getDatabaseUrl(): string {
    // CloudRuntime provides DATABASE_URL in the format: postgresql://username:password@host:port/database
    const databaseUrl = this.configService.get('DATABASE_URL');

    if (!databaseUrl) {
      throw new Error('DATABASE_URL is required in CloudRuntime environment');
    }

    // Parse and validate the URL format
    if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
      throw new Error('DATABASE_URL must be a valid PostgreSQL connection string');
    }

    return databaseUrl;
  }

  /**
   * Get the proper Redis URL for CloudRuntime environment
   */
  getRedisUrl(): string {
    // CloudRuntime provides REDIS_URL in the format: redis://host:port
    const redisUrl = this.configService.get('REDIS_URL');

    if (!redisUrl) {
      // Fallback to individual Redis config
      const host = this.configService.get('REDIS_HOST') || 'localhost';
      const port = this.configService.get('REDIS_PORT') || '6379';
      return `redis://${host}:${port}`;
    }

    // Validate Redis URL format
    if (!redisUrl.startsWith('redis://') && !redisUrl.startsWith('rediss://')) {
      throw new Error('REDIS_URL must be a valid Redis connection string');
    }

    // CloudRuntime-specific: Check if URL contains cloud_runtime domain
    if (redisUrl.includes('cloud_runtime')) {
      console.log('✅ CloudRuntime Redis URL detected:', redisUrl);
    }

    return redisUrl;
  }

  /**
   * Get configuration for CloudRuntime environment
   */
  getCloudRuntimeConfig() {
    return {
      databaseUrl: this.getDatabaseUrl(),
      redisUrl: this.getRedisUrl(),
      isCloudRuntimeEnvironment: this.configService.get('CLOUD_RUNTIME_ENVIRONMENT') === 'true',
      serviceName: this.configService.get('CLOUD_RUNTIME_SERVICE_NAME') || 'the-new-fuse-api',
      projectId: this.configService.get('CLOUD_RUNTIME_PROJECT_ID'),
    };
  }
}

/**
 * CloudRuntime Environment Validator
 * Validates that all required CloudRuntime environment variables are present
 */
export function validateCloudRuntimeEnvironment() {
  const requiredVars = [
    { name: 'DATABASE_URL', description: 'PostgreSQL connection URL' },
    { name: 'REDIS_URL', description: 'Redis connection URL' },
    { name: 'JWT_SECRET', description: 'JWT secret key' },
    { name: 'JWT_REFRESH_SECRET', description: 'JWT refresh secret key' },
  ];

  const errors: string[] = [];

  for (const varConfig of requiredVars) {
    if (!process.env[varConfig.name]) {
      errors.push(
        `❌ Missing required CloudRuntime environment variable: ${varConfig.name} - ${varConfig.description}`
      );
    }
  }

  if (errors.length > 0) {
    console.error('❌ CloudRuntime environment validation failed!');
    errors.forEach((error: any) => console.error(error));
    console.error(
      '\\n💡 Tip: Ensure all CloudRuntime services are properly linked and environment variables are set.'
    );
    process.exit(1);
  }

  console.log('✅ CloudRuntime environment validation passed!');
}
