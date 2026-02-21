/**
 * Redis Usage Examples
 * 
 * This file demonstrates how to use the Redis service in different environments.
 */

import { RedisService, createRedisClient } from '../redis.js';
import dotenv from 'dotenv';

/**
 * Example using environment variables
 */
async function environmentExample() {
  console.log('=== Redis Environment Example ===');
  
  // Load environment variables based on NODE_ENV
  const env = process.env.NODE_ENV || 'development';
  dotenv.config({ path: `.env.${env}` });
  
  // Create Redis service
  const redisService = new RedisService();
  await redisService.initialize();
  
  try {
    // Test connection
    const pingResult = await redisService.ping();
    console.log('Redis ping result:', pingResult);
    
    // Set and get a value
    await redisService.set('test-key', 'Hello from environment example!');
    const value = await redisService.get('test-key');
    console.log('Retrieved value:', value);
    
    // Clean up
    await redisService.del('test-key');
  } finally {
    // Always disconnect when done
    await redisService.disconnect();
  }
}

/**
 * Example using explicit development configuration
 */
async function developmentExample() {
  console.log('=== Redis Development Example ===');
  
  // Create Redis service with development configuration
  const redisService = new RedisService();
  await redisService.initialize('development');
  
  try {
    // Test connection
    const pingResult = await redisService.ping();
    console.log('Redis ping result:', pingResult);
    
    // Set and get a value
    await redisService.set('test-key', 'Hello from development example!');
    const value = await redisService.get('test-key');
    console.log('Retrieved value:', value);
    
    // Clean up
    await redisService.del('test-key');
  } finally {
    // Always disconnect when done
    await redisService.disconnect();
  }
}

/**
 * Example using explicit production configuration (Redis Cloud)
 */
async function productionExample() {
  console.log('=== Redis Production Example (Redis Cloud) ===');
  
  // Create Redis service with production configuration
  const redisService = new RedisService();
  await redisService.initialize('production');
  
  try {
    // Test connection
    const pingResult = await redisService.ping();
    console.log('Redis ping result:', pingResult);
    
    // Set and get a value
    await redisService.set('test-key', 'Hello from production example!');
    const value = await redisService.get('test-key');
    console.log('Retrieved value:', value);
    
    // Clean up
    await redisService.del('test-key');
  } finally {
    // Always disconnect when done
    await redisService.disconnect();
  }
}

/**
 * Example using direct client creation
 */
async function directClientExample() {
  console.log('=== Redis Direct Client Example ===');
  
  // Create Redis client directly
  const client = await createRedisClient({
    host: 'localhost',
    port: 6379
  });
  
  try {
    // Use client directly
    await client.set('test-key', 'Hello from direct client example!');
    const value = await client.get('test-key');
    console.log('Retrieved value:', value);
    
    // Clean up
    await client.del('test-key');
  } finally {
    // Always disconnect when done
    await client.disconnect();
  }
}

/**
 * Run all examples
 */
async function runExamples() {
  try {
    await environmentExample();
    console.log('\n');
    
    await developmentExample();
    console.log('\n');
    
    // Uncomment to test production example (Redis Cloud)
    // await productionExample();
    // console.log('\n');
    
    await directClientExample();
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runExamples();
}

export { environmentExample, developmentExample, productionExample, directClientExample };
