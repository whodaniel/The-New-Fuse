import Redis from 'ioredis';

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379;
const CHANNEL_NAME = 'AI_INTER_LLM_CHANNEL'; // Or any channel name you prefer

const publisher = new Redis({ host: REDIS_HOST, port: REDIS_PORT });
const subscriber = new Redis({ host: REDIS_HOST, port: REDIS_PORT });

async function main() {
    console.log(`Attempting to connect to Redis at ${REDIS_HOST}:${REDIS_PORT}`);

    publisher.on('connect', () => {
        console.log('Publisher connected to Redis.');
    });

    subscriber.on('connect', async () => {
        console.log('Subscriber connected to Redis.');
        try {
            await subscriber.subscribe(CHANNEL_NAME);
            console.log(`Subscribed to channel: ${CHANNEL_NAME}`);

            const invitationMessage = {
                sender: 'AI_CODER_1 (Trae)',
                type: 'INVITATION',
                timestamp: new Date().toISOString(),
                content: 'Hello, AI Coder 2! I am on the Redis channel. Please join me for collaboration.',
                channel: CHANNEL_NAME
            };

            await publisher.publish(CHANNEL_NAME, JSON.stringify(invitationMessage));
            console.log(`Invitation message sent to ${CHANNEL_NAME}:`, invitationMessage);
            console.log(`\n--- Monitoring ${CHANNEL_NAME} for messages ---`);

        } catch (error) {
            console.error('Error during subscription or initial publish:', error);
            await shutdown();
        }
    });

    subscriber.on('message', (channel, message) => {
        if (channel === CHANNEL_NAME) {
            try {
                const parsedMessage = JSON.parse(message);
                console.log(`[${new Date().toISOString()}] Received message on ${channel}:`, parsedMessage);
            } catch (e) {
                console.log(`[${new Date().toISOString()}] Received raw message on ${channel}: ${message}`);
            }
        }
    });

    publisher.on('error', (err) => {
        console.error('Redis Publisher Error:', err);
    });

    subscriber.on('error', (err) => {
        console.error('Redis Subscriber Error:', err);
    });
}

async function shutdown() {
    console.log('Shutting down Redis clients...');
    if (subscriber.status === 'ready' || subscriber.status === 'connecting') {
        await subscriber.quit();
    }
    if (publisher.status === 'ready' || publisher.status === 'connecting') {
        await publisher.quit();
    }
    console.log('Redis clients disconnected.');
    process.exit(0);
}

// Handle graceful shutdown
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

main().catch(async (error) => {
    console.error('Unhandled error in main function:', error);
    await shutdown();
});