/**
 * Redis Cloud Connection Example
 *
 * This file demonstrates how to connect to Redis Cloud using the Node.js Redis client.
 */

import { createClient } from 'redis';

/**
 * Example using Redis Cloud with Node.js Redis client
 */
async function redisCloudExample() {
  console.log('=== Redis Cloud Connection Example ===');

  const redisPassword = process.env.REDIS_PASSWORD;
  if (!redisPassword) {
    throw new Error('REDIS_PASSWORD is required to connect to Redis Cloud.');
  }

  // Create a Redis client connected to Redis Cloud
  const client = createClient({
    username: process.env.REDIS_USERNAME || 'default',
    password: redisPassword,
    socket: {
      host: process.env.REDIS_HOST || 'redis-11337.c93.us-east-1-3.ec2.redns.redis-cloud.com',
      port: Number(process.env.REDIS_PORT || 11337),
    },
  });

  // Set up error handler
  client.on('error', (err) => console.log('Redis Client Error', err));

  // Test the connection
  try {
    // Connect to Redis
    await client.connect();
    console.log('Successfully connected to Redis Cloud');

    // Set a test key
    await client.set('foo', 'bar');
    console.log('Successfully set key "foo"');

    // Get the test key
    const value = await client.get('foo');
    console.log('Retrieved value:', value); // Should print "bar"

    // Try some hash operations
    await client.hSet('user:1', 'name', 'John');
    await client.hSet('user:1', 'email', 'john@example.com');
    const name = await client.hGet('user:1', 'name');
    console.log('User name:', name); // Should print "John"

    // Get all hash fields
    const user = await client.hGetAll('user:1');
    console.log('User data:', user); // Should print { name: 'John', email: 'john@example.com' }

    // Try list operations
    await client.lPush('mylist', ['value1', 'value2', 'value3']);
    const listLength = await client.lLen('mylist');
    console.log('List length:', listLength); // Should print 3

    const listValues = await client.lRange('mylist', 0, -1);
    console.log('List values:', listValues); // Should print ['value3', 'value2', 'value1']

    // Clean up
    await client.del('foo');
    await client.del('user:1');
    await client.del('mylist');
    console.log('Cleaned up test keys');

    // Disconnect from Redis
    await client.disconnect();
    console.log('Disconnected from Redis Cloud');
  } catch (error) {
    console.error('Error connecting to Redis Cloud:', error);
    // Ensure we disconnect even if there's an error
    try {
      await client.disconnect();
    } catch (disconnectError) {
      console.error('Error disconnecting from Redis:', disconnectError);
    }
  }
}

/**
 * Run the example
 */
async function run() {
  try {
    await redisCloudExample();
  } catch (error) {
    console.error('Error running example:', error);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  run();
}

export { redisCloudExample };
