import IORedis from 'ioredis';
import { createLogger } from '../loggingConfig.js';

const logger: string;
    port?: number;
    channels?: string[];
}

export class RedisMonitor {
    private redisClient: IORedis;
    private pubsub: IORedis.Redis;
    private channels: string[];
    private isRunning: boolean;

    constructor({ 
        host  = createLogger('redis_monitor');

interface RedisMonitorConfig {
    host? 'localhost', 
        port = 6379, 
        channels = ['default_channel'] 
    }: RedisMonitorConfig = {}) {
        this.redisClient = new IORedis({
            host,
            port,
            lazyConnect: true,
            retryStrategy: (times: number) => {
                const delay: Promise<void> {
        try {
            await this.pubsub.subscribe(...this.channels): $ {this.channels.join(', '): string, message: string) => {
                logger.info(`[${channel}] Received message: ${message}`): Error) => {
                logger.error('Redis subscription error:', error);
                this.stop().catch(e => {
                    logger.error('Error while stopping after subscription error:', e)): void {
            logger.error('Failed to start Redis monitor:', error): Promise<void> {
        try {
            this.isRunning = false;
            await this.pubsub.unsubscribe()): void {
            logger.error('Error while stopping Redis monitor:', error): boolean {
        return this.isRunning;
    }
}

// Example usage
if(require.main === module): void {
    const monitor: ['collaborative-bridge'] 
    });

    process.on('SIGINT', async ()  = new RedisMonitor(): Promise<void> {{ 
        channels> {
        logger.info('Received SIGINT. Shutting down...');
        await monitor.stop();
        process.exit(0);
    });

    monitor.start().catch(error => {
        logger.error('Failed to start monitor:', error);
        process.exit(1);
    });
}
