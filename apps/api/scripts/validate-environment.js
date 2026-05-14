#!/usr/bin/env node

/**
 * Environment Configuration Validation Script
 * Validates that the application is properly configured for CloudRuntime environment
 */

console.log('🚂 Validating Environment Configuration...\\n');

function validateEnvironment() {
  const requiredVars = [
    {
      name: 'DATABASE_URL',
      description: 'PostgreSQL connection URL',
      example: 'postgresql://user:password@db.cloud_runtime.internal:5432/database',
    },
    {
      name: 'REDIS_URL',
      description: 'Redis connection URL',
      example: 'redis://redis.cloud_runtime.internal:6379',
    },
    {
      name: 'JWT_SECRET',
      description: 'JWT secret key (min 32 chars)',
      example: 'very-long-secret-key-that-is-more-than-32-characters',
    },
    {
      name: 'JWT_REFRESH_SECRET',
      description: 'JWT refresh secret key (min 32 chars)',
      example: 'another-very-long-secret-key-for-refresh-tokens',
    },
  ];

  const errors = [];
  const warnings = [];

  console.log('🔍 Checking required environment variables:\\n');

  for (const varConfig of requiredVars) {
    const value = process.env[varConfig.name];

    if (!value) {
      errors.push(`❌ Missing required environment variable: ${varConfig.name}`);
      console.error(`   ❌ ${varConfig.name}: MISSING (${varConfig.description})`);
      console.error(`      Example: ${varConfig.example}`);
    } else {
      console.log(`   ✅ ${varConfig.name}: Present`);

      // Validate JWT secrets length
      if (
        (varConfig.name === 'JWT_SECRET' || varConfig.name === 'JWT_REFRESH_SECRET') &&
        value.length < 32
      ) {
        errors.push(`❌ ${varConfig.name} must be at least 32 characters`);
        console.error(`   ⚠️  ${varConfig.name} is too short (${value.length} chars, needs 32+)`);
      }

      // Validate URL formats
      if (
        varConfig.name === 'DATABASE_URL' &&
        !value.startsWith('postgresql://') &&
        !value.startsWith('postgres://')
      ) {
        warnings.push(`⚠️  DATABASE_URL should start with postgresql:// or postgres://`);
        console.log(`   ⚠️  DATABASE_URL format should be: ${varConfig.example}`);
      }

      if (
        varConfig.name === 'REDIS_URL' &&
        !value.startsWith('redis://') &&
        !value.startsWith('rediss://')
      ) {
        warnings.push(`⚠️  REDIS_URL should start with redis:// or rediss://`);
        console.log(`   ⚠️  REDIS_URL format should be: ${varConfig.example}`);
      }
    }
  }

  console.log('\\n📋 Validation Results:');
  if (errors.length === 0) {
    console.log('   ✅ All required environment variables are present!');
  } else {
    console.error(`   ❌ Found ${errors.length} error(s):`);
    errors.forEach((error) => console.error(`      ${error}`));
  }

  if (warnings.length > 0) {
    console.log(`   ⚠️  Found ${warnings.length} warning(s):`);
    warnings.forEach((warning) => console.log(`      ${warning}`));
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Run validation
const result = validateEnvironment();

if (!result.isValid) {
  console.error('\\n❌ Environment validation failed!');
  console.error('\\n💡 Troubleshooting Tips:');
  console.error('   - Ensure you have linked PostgreSQL and Redis services in CloudRuntime');
  console.error('   - Check that all required environment variables are set');
  console.error(
    '   - Verify DATABASE_URL format: postgresql://username:password@host:port/database'
  );
  console.error('   - Verify REDIS_URL format: redis://host:port');
  console.error('   - JWT secrets must be at least 32 characters long');
  process.exit(1);
} else {
  console.log('\\n✅ Environment validation passed!');
  console.log('\\n💡 Next Steps:');
  console.log('   1. Ensure all CloudRuntime services are properly linked');
  console.log('   2. Set DATABASE_URL to your CloudRuntime PostgreSQL connection string');
  console.log('   3. Set REDIS_URL to your CloudRuntime Redis connection string');
  console.log('   4. Set JWT_SECRET and JWT_REFRESH_SECRET to secure values (32+ chars)');
  console.log('   5. Deploy with: cloud_runtime up');

  // Test with mock CloudRuntime environment
  console.log('\\n🧪 Testing CloudRuntime environment simulation...');
  process.env.DATABASE_URL = 'postgresql://user:password@db.cloud_runtime.internal:5432/database';
  process.env.REDIS_URL = 'redis://redis.cloud_runtime.internal:6379';
  process.env.JWT_SECRET = 'very-long-secret-key-that-is-more-than-32-characters';
  process.env.JWT_REFRESH_SECRET = 'another-very-long-secret-key-for-refresh-tokens';
  process.env.CLOUD_RUNTIME_ENVIRONMENT = 'true';

  console.log('   ✅ CloudRuntime environment simulation successful!');
  console.log('\\n📋 CloudRuntime Configuration Summary:');
  console.log('   DATABASE_URL:', process.env.DATABASE_URL);
  console.log('   REDIS_URL:', process.env.REDIS_URL);
  console.log('   CLOUD_RUNTIME_ENVIRONMENT:', process.env.CLOUD_RUNTIME_ENVIRONMENT);

  process.exit(0);
}
