/**
 * Redis Cloud Connection Example
 * 
 * This file demonstrates how to connect to Redis Cloud using our Redis implementation.
 */

import { createRedisClient } from '../redis/redis-factory.js';
import { RedisService } from '../types/redis/service.js';

/**
 * Example using Redis Cloud with standard Redis client
 */
async function redisCloudStandardExample() {
  console.log('=== Redis Cloud Standard Client Example ===');
  
  // Create a standard Redis client connected to Redis Cloud
  const redis = createRedisClient({
    type: 'standard',
    config: {
      host: 'redis-11337.c93.us-east-1-3.ec2.redns.redis-cloud.com',
      port: 11337,
      username: 'default',
      password: 'CxXMZw3qW3zYXq1JYy7bCuqwRrL7tH0d',
      // Redis Cloud uses TLS by default
      tls: true
    }
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
  
  // Create an MCP Redis client connected to Redis Cloud
  const redis = createRedisClient({
    type: 'mcp',
    config: {
      host: 'redis-11337.c93.us-east-1-3.ec2.redns.redis-cloud.com',
      port: 11337,
      username: 'default',
      password: 'CxXMZw3qW3zYXq1JYy7bCuqwRrL7tH0d',
      ssl: true
      // Note: Redis Cloud manages its own certificates, so we don't need to specify
      // ca_path, ssl_keyfile, ssl_certfile, etc.
    }
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
  
  // Create a Redis client using the URL connection string
  const redis = createRedisClient({
    type: 'standard',
    config: 'rediss://default:CxXMZw3qW3zYXq1JYy7bCuqwRrL7tH0d@redis-11337.c93.us-east-1-3.ec2.redns.redis-cloud.com:11337'
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

export { redisCloudStandardExample, redisCloudMCPExample, redisCloudURLExample };
