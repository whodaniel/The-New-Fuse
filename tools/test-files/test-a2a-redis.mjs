#!/usr/bin/env node

/**
 * Quick Redis Test for A2A Implementation
 * Tests the Redis connection and basic operations
 */

import Redis from 'ioredis';

async function testRedisA2A() {
  console.log('🚀 Testing Redis for A2A Implementation...\n');

  try {
    // Connect to Redis
    const redis = new Redis({
      host: 'localhost',
      port: 6379,
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
    });

    // Test 1: Basic Connection
    console.log('📋 Test 1: Redis Connection');
    const pong = await redis.ping();
    console.log('✅ Redis connection successful:', pong);

    // Test 2: A2A Agent Registration Test
    console.log('\n📋 Test 2: A2A Agent Registration in Redis');
    const testAgent = {
      agentId: 'test-agent-redis',
      name: 'Test Agent Redis',
      type: 'ASSISTANT',
      version: '1.0.0',
      description: 'Test agent for Redis operations',
      capabilities: ['chat', 'search'],
      registeredAt: new Date().toISOString(),
      status: 'ONLINE'
    };

    // Store agent in Redis
    await redis.hset('a2a:agents:test-agent-redis', testAgent);
    console.log('✅ Agent stored in Redis');

    // Retrieve agent from Redis
    const retrievedAgent = await redis.hgetall('a2a:agents:test-agent-redis');
    console.log('✅ Agent retrieved from Redis:', retrievedAgent);

    // Test 3: A2A Message Queue Test
    console.log('\n📋 Test 3: A2A Message Queue in Redis');
    const testMessage = {
      messageId: 'msg-test-001',
      fromAgentId: 'test-agent-redis',
      toAgentId: 'test-agent-redis',
      content: 'Hello from Redis test!',
      type: 'REQUEST',
      priority: 'MEDIUM',
      timestamp: new Date().toISOString()
    };

    // Add message to queue
    await redis.lpush('a2a:messages:test-agent-redis', JSON.stringify(testMessage));
    console.log('✅ Message added to Redis queue');

    // Get message from queue
    const messageData = await redis.rpop('a2a:messages:test-agent-redis');
    const retrievedMessage = JSON.parse(messageData || '{}');
    console.log('✅ Message retrieved from Redis queue:', retrievedMessage);

    // Test 4: A2A Pub/Sub Test
    console.log('\n📋 Test 4: A2A Pub/Sub in Redis');
    
    // Create subscriber
    const subscriber = new Redis({
      host: 'localhost',
      port: 6379,
    });

    // Subscribe to A2A channel
    await subscriber.subscribe('a2a:broadcasts');
    console.log('✅ Subscribed to A2A broadcast channel');

    // Set up message handler
    subscriber.on('message', (channel, message) => {
      console.log('✅ Received broadcast message:', { channel, message: JSON.parse(message) });
    });

    // Publish test message
    const broadcastMessage = {
      type: 'SYSTEM_ANNOUNCEMENT',
      content: 'A2A system is operational!',
      timestamp: new Date().toISOString(),
      fromAgentId: 'system'
    };

    await redis.publish('a2a:broadcasts', JSON.stringify(broadcastMessage));
    console.log('✅ Broadcast message published');

    // Wait a moment for the message to be received
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 5: A2A Heartbeat Test
    console.log('\n📋 Test 5: A2A Heartbeat in Redis');
    const heartbeatData = {
      agentId: 'test-agent-redis',
      timestamp: new Date().toISOString(),
      status: 'ONLINE',
      load: 0.2,
      memory: '150MB'
    };

    // Store heartbeat with TTL
    await redis.setex('a2a:heartbeat:test-agent-redis', 30, JSON.stringify(heartbeatData));
    console.log('✅ Heartbeat stored in Redis with 30s TTL');

    // Retrieve heartbeat
    const retrievedHeartbeat = await redis.get('a2a:heartbeat:test-agent-redis');
    console.log('✅ Heartbeat retrieved from Redis:', JSON.parse(retrievedHeartbeat || '{}'));

    // Cleanup
    await redis.del('a2a:agents:test-agent-redis');
    await redis.del('a2a:heartbeat:test-agent-redis');
    await subscriber.unsubscribe();
    await subscriber.quit();
    await redis.quit();

    console.log('\n🎉 All Redis A2A tests completed successfully!');
    console.log('💡 The A2A Redis infrastructure is working correctly.');

  } catch (error) {
    console.error('❌ Redis test failed:', error.message);
    console.log('\n💡 Make sure Redis is running on localhost:6379');
    console.log('💡 You can start Redis with: redis-server');
  }
}

// Check if this script is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testRedisA2A();
}

export { testRedisA2A };
