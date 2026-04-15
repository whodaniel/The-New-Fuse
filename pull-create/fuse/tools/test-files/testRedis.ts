import RedisConnection from './utils/redisConnection.js';

const AUGMENT_AI_CHANNEL = 'augment_ai_channel';

async function testRedisConnection(): any {
  try {
    console.log('Initializing Redis connection...');
    const redis = await RedisConnection.initialize();
    
    // Test basic operations
    await redis.set('test_key', 'Hello Augment AI!');
    const value = await redis.get('test_key');
    console.log('Basic operations test:', value);

    // Test pub/sub
    const subscriber = await RedisConnection.initialize();
    await subscriber.subscribe(AUGMENT_AI_CHANNEL);
    
    subscriber.on('message', (channel, message) => {
      console.log(`Received message from ${channel}:`, message);
    });

    // Publish test message
    await redis.publish(AUGMENT_AI_CHANNEL, 'Testing Augment AI communication');
    
    console.log('Connection status:', RedisConnection.isConnected() ? 'Connected' : 'Not connected');
    
    // Cleanup
    setTimeout(async () => {
      await subscriber.unsubscribe();
      await subscriber.quit();
      await redis.del('test_key');
      await redis.quit();
      console.log('Cleanup completed');
    }, 1000);
  } catch (error) {
    console.error('Redis test failed:', error);
  }
}

testRedisConnection();
