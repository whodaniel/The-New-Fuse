import { ConfigService } from '@nestjs/config';

/**
 * Railway Environment Configuration
 * Handles Railway-specific environment variable parsing and configuration
 */
export class RailwayConfigService {
  constructor(private configService: ConfigService) {}

  /**
   * Get the proper database URL for Railway environment
   */
  getDatabaseUrl(): string {
    // Railway provides DATABASE_URL in the format: postgresql://username:password@host:port/database
    const databaseUrl = this.configService.get('DATABASE_URL');

    if (!databaseUrl) {
      throw new Error('DATABASE_URL is required in Railway environment');
    }

    // Parse and validate the URL format
    if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
      throw new Error('DATABASE_URL must be a valid PostgreSQL connection string');
    }

    return databaseUrl;
  }

  /**
   * Get the proper Redis URL for Railway environment
   */
  getRedisUrl(): string {
    // Railway provides REDIS_URL in the format: redis://host:port
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

    // Railway-specific: Check if URL contains railway domain
    if (redisUrl.includes('railway')) {
      console.log('✅ Railway Redis URL detected:', redisUrl);
    }

    return redisUrl;
  }

  /**
   * Get configuration for Railway environment
   */
  getRailwayConfig() {
    return {
      databaseUrl: this.getDatabaseUrl(),
      redisUrl: this.getRedisUrl(),
      isRailwayEnvironment: this.configService.get('RAILWAY_ENVIRONMENT') === 'true',
      serviceName: this.configService.get('RAILWAY_SERVICE_NAME') || 'the-new-fuse-api',
      projectId: this.configService.get('RAILWAY_PROJECT_ID'),
    };
  }
}

/**
 * Railway Environment Validator
 * Validates that all required Railway environment variables are present
 */
export function validateRailwayEnvironment() {
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
        `❌ Missing required Railway environment variable: ${varConfig.name} - ${varConfig.description}`
      );
    }
  }

  if (errors.length > 0) {
    console.error('❌ Railway environment validation failed!');
    errors.forEach((error) => console.error(error));
    console.error(
      '\\n💡 Tip: Ensure all Railway services are properly linked and environment variables are set.'
    );
    process.exit(1);
  }

  console.log('✅ Railway environment validation passed!');
}
