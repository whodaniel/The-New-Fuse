import { ConfigService } from '@nestjs/config';

/**
 * GCP Environment Configuration
 * Handles GCP-specific environment variable parsing and configuration
 */
export class GcpConfigService {
  constructor(private configService: ConfigService) {}

  /**
   * Get GCP Project ID
   */
  getProjectId(): string {
    const projectId = this.configService.get('GCP_PROJECT_ID');
    if (!projectId) {
      throw new Error('GCP_PROJECT_ID is required');
    }
    return projectId;
  }

  /**
   * Get GCS Bucket Name
   */
  getGcsBucket(): string {
    const bucket = this.configService.get('GCS_BUCKET');
    if (!bucket) {
      throw new Error('GCS_BUCKET is required');
    }
    return bucket;
  }

  /**
   * Get configuration for GCP environment
   */
  getGcpConfig() {
    return {
      projectId: this.getProjectId(),
      bucket: this.getGcsBucket(),
      keyFile: this.configService.get('GCP_KEY_FILE'),
      isGcpEnvironment: !!this.configService.get('GCP_PROJECT_ID'),
    };
  }
}

/**
 * GCP Environment Validator
 * Validates that all required GCP environment variables are present
 */
export function validateGcpEnvironment() {
  const requiredVars = [
    { name: 'GCP_PROJECT_ID', description: 'GCP Project ID' },
    { name: 'GCS_BUCKET', description: 'GCS Bucket Name' },
    { name: 'DATABASE_URL', description: 'PostgreSQL connection URL (Supabase)' },
    { name: 'REDIS_URL', description: 'Redis connection URL (Upstash)' },
  ];

  const errors: string[] = [];

  for (const varConfig of requiredVars) {
    if (!process.env[varConfig.name]) {
      errors.push(
        `❌ Missing required GCP environment variable: ${varConfig.name} - ${varConfig.description}`
      );
    }
  }

  if (errors.length > 0) {
    console.warn('⚠️ GCP environment validation warnings:');
    errors.forEach((error: any) => console.warn(error));
  } else {
    console.log('✅ GCP environment validation passed!');
  }
}
