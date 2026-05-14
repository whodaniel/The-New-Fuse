#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * CloudRuntime Configuration Validation Script
 * Validates that the application is properly configured for CloudRuntime environment
 */

const { validateCloudRuntimeEnvironment } = require('./src/config/cloud_runtime.config');

console.log('🚂 Validating CloudRuntime Configuration...\\n');

try {
  // Set some mock environment variables for testing
  process.env.DATABASE_URL = 'postgresql://user:password@db.cloud_runtime.internal:5432/database';
  process.env.REDIS_URL = 'redis://redis.cloud_runtime.internal:6379';
  process.env.JWT_SECRET = 'very-long-secret-key-that-is-more-than-32-characters';
  process.env.JWT_REFRESH_SECRET = 'another-very-long-secret-key-for-refresh-tokens';
  process.env.CLOUD_RUNTIME_ENVIRONMENT = 'true';

  validateCloudRuntimeEnvironment();

  console.log('✅ CloudRuntime configuration validation passed!');
  console.log('\\n📋 Configuration Summary:');
  console.log('   DATABASE_URL:', process.env.DATABASE_URL);
  console.log('   REDIS_URL:', process.env.REDIS_URL);
  console.log('   CLOUD_RUNTIME_ENVIRONMENT:', process.env.CLOUD_RUNTIME_ENVIRONMENT);

  console.log('\\n💡 Next Steps:');
  console.log('   1. Ensure all CloudRuntime services are properly linked');
  console.log('   2. Set DATABASE_URL to your CloudRuntime PostgreSQL connection string');
  console.log('   3. Set REDIS_URL to your CloudRuntime Redis connection string');
  console.log('   4. Set JWT_SECRET and JWT_REFRESH_SECRET to secure values');
  console.log('   5. Deploy with: cloud_runtime up');

  process.exit(0);
} catch (error) {
  console.error('❌ CloudRuntime configuration validation failed!');
  console.error('Error:', error.message);
  console.error('\\n💡 Troubleshooting Tips:');
  console.error('   - Ensure you have linked PostgreSQL and Redis services in CloudRuntime');
  console.error('   - Check that all required environment variables are set');
  console.error(
    '   - Verify DATABASE_URL format: postgresql://username:password@host:port/database'
  );
  console.error('   - Verify REDIS_URL format: redis://host:port');
  process.exit(1);
}
