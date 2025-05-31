import { createClient } from 'redis';
// Message to send to the agent
const initializationMessage = {
    type: 'initialization',
    capabilities: [
        'text-processing',
        'data-analysis',
        'code-generation'
    ],
    config: {
        allowExternalCalls: true,
        responseFormat: 'json',
        maxTokens: 2000
    }
};
// Create a self-executing async function to use top-level await
(async function () {
    try {
        // Create a Redis client
        const redisClient = createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379'
        });
        // Connect to Redis
        await redisClient.connect();
        console.log('Connected to Redis');
        // Publish initialization message to Trae agent
        await redisClient.publish('agent:trae', JSON.stringify(initializationMessage));
        console.log('Sent initialization message to Trae agent');
        // Disconnect from Redis
        await redisClient.disconnect();
        console.log('Disconnected from Redis');
    }
    catch (error) {
        console.error('Error in augment-to-trae script:', error);
    }
})();
