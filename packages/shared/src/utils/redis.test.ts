import { redisClient } from './redis.js';

const testRedisConnection = async () => {
    try {
        await redisClient.connect();
        
        // Test set/get operations
        const testKey = 'test_key_' + Date.now();
        const testValue = 'Hello Redis Cloud!';
        
        console.log('Setting test value...');
        await redisClient.set(testKey, testValue);
        console.log('Set value successfully');
        
        console.log('Getting test value...');
        const retrievedValue = await redisClient.get(testKey);
        console.log('Retrieved value:', retrievedValue);
        
        if (retrievedValue !== testValue) {
            throw new Error('Retrieved value does not match set value');
        }
        
        // Clean up
        await redisClient.delete(testKey);
        console.log('Deleted test key');
        
        await redisClient.disconnect();
        console.log('Redis connection test completed successfully!');
    } catch (error) {
        console.error('Redis test failed:', error);
        process.exit(1);
    }
};

// Run the test
testRedisConnection();