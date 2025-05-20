/**
 * Redis Client Usage Examples
 * 
 * This file demonstrates how to use both the standard Redis client and the MCP Redis client.
 */

import { createRedisClient } from '../redis/redis-factory.js';
import { RedisService } from '../types/redis/service.js';

/**
 * Example using the standard Redis client
 */
async function standardRedisExample() {
  console.log('=== Standard Redis Client Example ===');
  
  // Create a standard Redis client
  const redis = createRedisClient({
    type: 'standard',
    config: {
      host: 'localhost',
      port: 6379,
      password: 'your-password'
    }
  });
  
  // Basic key-value operations
  await redis.set('key', 'value');
  const value = await redis.get('key');
  console.log('Value:', value);
  
  // Hash operations
  await redis.hset('hash', 'field', 'value');
  const hashValue = await redis.hget('hash', 'field');
  console.log('Hash value:', hashValue);
  
  // List operations
  await redis.lpush('list', ['value1', 'value2']);
  const listValues = await redis.lrange('list', 0, -1);
  console.log('List values:', listValues);
  
  // JSON operations
  try {
    await redis.json_set('user:1', '.', { name: 'John', age: 30 });
    const user = await redis.json_get('user:1');
    console.log('User:', user);
  } catch (error) {
    console.error('JSON operations require RedisJSON module');
  }
}

/**
 * Example using the MCP Redis client
 */
async function mcpRedisExample() {
  console.log('=== MCP Redis Client Example ===');
  
  // Create an MCP Redis client with SSL/TLS configuration
  const redis = createRedisClient({
    type: 'mcp',
    config: {
      host: 'localhost',
      port: 6379,
      username: 'username',
      password: 'your-password',
      db: 0,
      ssl: true,
      ca_path: '/path/to/ca.pem',
      ssl_keyfile: '/path/to/key.pem',
      ssl_certfile: '/path/to/cert.pem',
      cert_reqs: 'required',
      ca_certs: '/path/to/ca_certs.pem',
      cluster_mode: false
    }
  });
  
  // Basic key-value operations
  await redis.set('key', 'value');
  const value = await redis.get('key');
  console.log('Value:', value);
  
  // Hash operations
  await redis.hset('hash', 'field', 'value');
  const hashValue = await redis.hget('hash', 'field');
  console.log('Hash value:', hashValue);
  
  // Vector operations
  await redis.set_vector_in_hash('item:1', 'embedding', [0.1, 0.2, 0.3]);
  const vector = await redis.get_vector_from_hash('item:1', 'embedding');
  console.log('Vector:', vector);
  
  // Client list operation
  const clientList = await redis.client_list();
  console.log('Client list:', clientList);
}

/**
 * Run the examples
 */
async function runExamples() {
  try {
    await standardRedisExample();
    console.log('\n');
    await mcpRedisExample();
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Run the examples if this file is executed directly
if (require.main === module) {
  runExamples();
}
