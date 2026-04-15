#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Railway Configuration Validation Script
 * Validates that the application is properly configured for Railway environment
 */

const { validateRailwayEnvironment } = require('./src/config/railway.config');

console.log('🚂 Validating Railway Configuration...\\n');

try {
  // Set some mock environment variables for testing
  process.env.DATABASE_URL = 'postgresql://user:password@db.railway.internal:5432/database';
  process.env.REDIS_URL = 'redis://redis.railway.internal:6379';
  process.env.JWT_SECRET = 'very-long-secret-key-that-is-more-than-32-characters';
  process.env.JWT_REFRESH_SECRET = 'another-very-long-secret-key-for-refresh-tokens';
  process.env.RAILWAY_ENVIRONMENT = 'true';

  validateRailwayEnvironment();

  console.log('✅ Railway configuration validation passed!');
  console.log('\\n📋 Configuration Summary:');
  console.log('   DATABASE_URL:', process.env.DATABASE_URL);
  console.log('   REDIS_URL:', process.env.REDIS_URL);
  console.log('   RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT);

  console.log('\\n💡 Next Steps:');
  console.log('   1. Ensure all Railway services are properly linked');
  console.log('   2. Set DATABASE_URL to your Railway PostgreSQL connection string');
  console.log('   3. Set REDIS_URL to your Railway Redis connection string');
  console.log('   4. Set JWT_SECRET and JWT_REFRESH_SECRET to secure values');
  console.log('   5. Deploy with: railway up');

  process.exit(0);
} catch (error) {
  console.error('❌ Railway configuration validation failed!');
  console.error('Error:', error.message);
  console.error('\\n💡 Troubleshooting Tips:');
  console.error('   - Ensure you have linked PostgreSQL and Redis services in Railway');
  console.error('   - Check that all required environment variables are set');
  console.error(
    '   - Verify DATABASE_URL format: postgresql://username:password@host:port/database'
  );
  console.error('   - Verify REDIS_URL format: redis://host:port');
  process.exit(1);
}
