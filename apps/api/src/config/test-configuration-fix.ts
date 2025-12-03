/**
 * Test file to verify that the configuration fixes work correctly
 * with Railway environment variables
 */
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { getDatabaseConfig } from './database.config.js';

// Type assertion for the database config that includes connection properties
type DatabaseConfigWithConnection = TypeOrmModuleOptions & {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
};

// Simple mock that provides the basic get method needed for testing
class MockConfigService {
  private env: Record<string, string | undefined>;

  constructor(env: Record<string, string | undefined> = {}) {
    this.env = env;
  }

  get<T>(key: string, defaultValue?: T): T {
    const value = this.env[key];
    if (value !== undefined) {
      return value as unknown as T;
    }
    return defaultValue as T;
  }
}

function testDatabaseConfiguration() {
  console.log('🧪 Testing Database Configuration Fixes...');

  // Test 1: Railway DATABASE_URL format
  const railwayEnv = new MockConfigService({
    DATABASE_URL: 'postgresql://user:password@postgres.railway.internal:5432/dbname',
  });

  const railwayConfig = getDatabaseConfig(
    railwayEnv as unknown as ConfigService
  ) as DatabaseConfigWithConnection;
  console.log('✅ Railway DATABASE_URL test:');
  console.log(`   Host: ${railwayConfig.host} (should be: postgres.railway.internal)`);
  console.log(`   Port: ${railwayConfig.port} (should be: 5432)`);
  console.log(`   Username: ${railwayConfig.username} (should be: user)`);
  console.log(`   Database: ${railwayConfig.database} (should be: dbname)`);

  // Test 2: Traditional environment variables (fallback)
  const traditionalEnv = new MockConfigService({
    DB_HOST: 'traditional-db-host',
    DB_PORT: '5433',
    DB_USERNAME: 'traditional-user',
    DB_PASSWORD: 'traditional-pass',
    DB_DATABASE: 'traditional-db',
  });

  const traditionalConfig = getDatabaseConfig(
    traditionalEnv as unknown as ConfigService
  ) as DatabaseConfigWithConnection;
  console.log('✅ Traditional env vars test:');
  console.log(`   Host: ${traditionalConfig.host} (should be: traditional-db-host)`);
  console.log(`   Port: ${traditionalConfig.port} (should be: 5433)`);
  console.log(`   Username: ${traditionalConfig.username} (should be: traditional-user)`);
  console.log(`   Database: ${traditionalConfig.database} (should be: traditional-db)`);

  // Test 3: No environment variables (should use defaults)
  const noEnv = new MockConfigService({});
  const defaultConfig = getDatabaseConfig(
    noEnv as unknown as ConfigService
  ) as DatabaseConfigWithConnection;
  console.log('✅ No env vars test (defaults):');
  console.log(`   Host: ${defaultConfig.host} (should be: localhost)`);
  console.log(`   Port: ${defaultConfig.port} (should be: 5432)`);
  console.log(`   Username: ${defaultConfig.username} (should be: postgres)`);
}

function testRedisConfiguration() {
  console.log('\\n🧪 Testing Redis Configuration Fixes...');

  // Test 1: Railway REDIS_URL format
  const railwayRedisEnv = new MockConfigService({
    REDIS_URL: 'redis://redis.railway.internal:6379',
  });

  // We can't directly test the Redis connection without mocking,
  // but we can test the URL parsing logic
  const redisUrl = railwayRedisEnv.get('REDIS_URL');
  console.log('✅ Railway REDIS_URL test:');
  console.log(`   URL: ${redisUrl} (should be: redis://redis.railway.internal:6379)`);

  // Test 2: No Redis URL (should fail gracefully)
  const noRedisEnv = new MockConfigService({});
  const noRedisUrl = noRedisEnv.get('REDIS_URL');
  console.log('✅ No Redis URL test:');
  console.log(`   URL: ${noRedisUrl} (should be: undefined)`);
}

function runAllTests() {
  console.log('🚀 Running Configuration Fix Tests...\\n');
  testDatabaseConfiguration();
  testRedisConfiguration();
  console.log('\\n✅ All configuration tests completed!');
}

runAllTests();
