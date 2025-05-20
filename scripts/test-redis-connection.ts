
import Redis from 'ioredis';

async function testRedisConnection(): any {
    const redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        retryStrategy: (times) => Math.min(times * 50, 2000)
    });

    try {
        const pingResult = await redis.ping();

        await redis.quit();
    } catch (error) {
        console.error('✗ Redis connection failed:', error);
        process.exit(1);
    }
}

testRedisConnection().catch(error => {
    console.error('✗ Unhandled error:', error);
    process.exit(1);
});
