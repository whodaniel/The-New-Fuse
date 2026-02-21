/**
 * Redis Cloud Connection Example
 *
 * This file demonstrates how to connect to Redis Cloud using our Redis implementation.
 */

import { createRedisClient } from '../redis/redis-factory.js';

function getRedisCloudConfig() {
  const host = process.env.REDIS_HOST || 'redis-11337.c93.us-east-1-3.ec2.redns.redis-cloud.com';
  const port = Number(process.env.REDIS_PORT || 11337);
  const username = process.env.REDIS_USERNAME || 'default';
  const password = process.env.REDIS_PASSWORD;

  if (!password) {
    throw new Error('REDIS_PASSWORD is required to connect to Redis Cloud.');
  }

  const url = process.env.REDIS_URL || `rediss://${username}:${password}@${host}:${port}`;
  return { host, port, username, password, url };
}

/**
 * Example using Redis Cloud with standard Redis client
 */
async function redisCloudStandardExample() {
  console.log('=== Redis Cloud Standard Client Example ===');
  const { host, port, username, password } = getRedisCloudConfig();

  // Create a standard Redis client connected to Redis Cloud
  const redis = createRedisClient({
    type: 'standard',
    config: {
      host,
      port,
      username,
      password,
      // Redis Cloud uses TLS by default
      tls: true,
    },
  });

  // Test the connection
  try {
    // Set a test key
    await redis.set('test-key', 'Hello Redis Cloud!');
    console.log('Successfully set test key');

    // Get the test key
    const value = await redis.get('test-key');
    console.log('Retrieved value:', value);

    // Try some other operations
    await redis.hset('test-hash', 'field1', 'value1');
    const hashValue = await redis.hget('test-hash', 'field1');
    console.log('Hash value:', hashValue);

    // Get server info
    const info = await redis.info();
    console.log('Server info summary:', info.substring(0, 200) + '...');

    // Clean up
    await redis.del('test-key');
    await redis.del('test-hash');
    console.log('Cleaned up test keys');
  } catch (error) {
    console.error('Error connecting to Redis Cloud:', error);
  }
}

/**
 * Example using Redis Cloud with MCP Redis client
 */
async function redisCloudMCPExample() {
  console.log('=== Redis Cloud MCP Client Example ===');
  const { host, port, username, password } = getRedisCloudConfig();

  // Create an MCP Redis client connected to Redis Cloud
  const redis = createRedisClient({
    type: 'mcp',
    config: {
      host,
      port,
      username,
      password,
      ssl: true,
      // Note: Redis Cloud manages its own certificates, so we don't need to specify
      // ca_path, ssl_keyfile, ssl_certfile, etc.
    },
  });

  // Test the connection (note: this is simulated in our MCP implementation)
  try {
    // Set a test key
    await redis.set('test-key-mcp', 'Hello Redis Cloud via MCP!');
    console.log('Successfully set test key (simulated)');

    // Get the test key
    const value = await redis.get('test-key-mcp');
    console.log('Retrieved value (simulated):', value);
  } catch (error) {
    console.error('Error with MCP Redis Cloud client:', error);
  }
}

/**
 * Example using Redis Cloud with URL connection string
 */
async function redisCloudURLExample() {
  console.log('=== Redis Cloud URL Connection Example ===');
  const { url } = getRedisCloudConfig();

  // Create a Redis client using the URL connection string
  const redis = createRedisClient({
    type: 'standard',
    config: url,
    // Note: We use 'rediss://' (with double 's') for TLS/SSL connections
  });

  // Test the connection
  try {
    // Set a test key
    await redis.set('test-key-url', 'Hello Redis Cloud via URL!');
    console.log('Successfully set test key');

    // Get the test key
    const value = await redis.get('test-key-url');
    console.log('Retrieved value:', value);

    // Clean up
    await redis.del('test-key-url');
    console.log('Cleaned up test key');
  } catch (error) {
    console.error('Error connecting to Redis Cloud via URL:', error);
  }
}

/**
 * Run the examples
 */
async function runExamples() {
  try {
    await redisCloudStandardExample();
    console.log('\n');
    await redisCloudMCPExample();
    console.log('\n');
    await redisCloudURLExample();
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Run the examples if this file is executed directly
if (require.main === module) {
  runExamples();
}

export { redisCloudMCPExample, redisCloudStandardExample, redisCloudURLExample };
