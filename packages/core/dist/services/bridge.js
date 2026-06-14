import { createClient } from 'redis';
import { createLogger, transports, format } from 'winston';
const logger = createLogger({
    level: 'info',
    format: format.combine(format.timestamp(), format.json()),
    transports: [new transports.Console()],
});
export class RedisBridge {
    constructor(redisHost = 'redis://localhost:6379') {
        this.redisSubscriber = createClient({ url: redisHost });
        this.redisPublisher = this.redisSubscriber.duplicate();
        this.redisSubscriber.on('error', (err) => logger.error('Redis Subscriber Error', err));
        this.redisPublisher.on('error', (err) => logger.error('Redis Publisher Error', err));
    }
    async start() {
        await this.redisSubscriber.connect();
        await this.redisPublisher.connect();
        await this.redisSubscriber.subscribe('channel1', (message, channel) => {
            logger.info(`Received message from ${channel}: ${message}`);
            // Process message and forward to another channel
            this.redisPublisher.publish('channel2', `Forwarded: ${message}`);
        });
        logger.info('Redis bridge started.');
    }
}
//# sourceMappingURL=bridge.js.map