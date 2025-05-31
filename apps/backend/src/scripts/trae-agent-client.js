import Redis from 'ioredis';
import { TraeMonitor } from '../services/agent/trae-monitor.js';
import { Logger } from '@nestjs/common';
class TraeAgentClient {
    constructor() {
        this.logger = new Logger(TraeAgentClient.name);
        this.isConnected = false;
        this.channels = {
            primary: 'agent:trae',
            broadcast: 'agent:broadcast',
            augment: 'agent:augment',
            heartbeat: 'agent:heartbeat'
        };
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        this.redis = new Redis(redisUrl);
        this.subscriber = new Redis(redisUrl);
        this.monitor = new TraeMonitor();
        this.setupEventHandlers();
        this.initialize();
    }
    setupEventHandlers() {
        this.subscriber.on('message', this.handleMessage.bind(this));
        this.subscriber.on('error', this.handleError.bind(this));
        this.redis.on('error', this.handleError.bind(this));
    }
    async initialize() {
        try {
            // Initialize monitoring
            await this.monitor.initialize();
            // Subscribe to channels
            await this.subscriber.subscribe(this.channels.primary, this.channels.broadcast, this.channels.augment, this.channels.heartbeat);
            this.isConnected = true;
            this.logger.log('Trae Agent initialized and connected to Redis channels');
            // Start heartbeat
            await this.monitor.startHeartbeat('trae');
            // Enable metrics collection
            this.monitor.enableMetrics({
                collectInterval: 30000, // Collect metrics every 30 seconds
                reportInterval: 300000 // Report metrics every 5 minutes
            });
            // Setup alert handlers
            this.monitor.onAlert((alert) => {
                this.logger.warn(`Received alert: ${JSON.stringify(alert)}`);
            });
            // Send initial handshake
            await this.sendInitialHandshake();
        }
        catch (error) {
            this.logger.error('Failed to initialize Trae Agent:', error);
            throw error;
        }
    }
    async sendInitialHandshake() {
        const initMessage = {
            type: 'system',
            timestamp: new Date().toISOString(),
            metadata: {
                version: '1.1.0',
                priority: 'high',
                source: 'trae'
            },
            details: {
                action: 'acknowledge',
                capabilities: ['code_analysis', 'task_coordination', 'system_integration', 'pair_programming'],
                monitoring: {
                    status: 'active',
                    heartbeat: true,
                    metrics: true
                }
            }
        };
        await this.publishMessage(this.channels.augment, initMessage);
        this.logger.log('Initial handshake sent to Augment');
    }
    async handleMessage(channel, message) {
        try {
            const startTime = Date.now();
            let success = true;
            let errorDetails = '';
            const parsedMessage = JSON.parse(message);
            this.logger.debug(`Received message on channel ${channel}:`, parsedMessage);
            switch (parsedMessage.type) {
                case 'system':
                    await this.handleSystemMessage(parsedMessage);
                    break;
                case 'task':
                    await this.handleTaskMessage(parsedMessage);
                    break;
                case 'code_review':
                    await this.handleCodeReviewMessage(parsedMessage);
                    break;
                default:
                    this.logger.warn(`Unhandled message type: ${parsedMessage.type}`);
                    success = false;
                    errorDetails = `Unhandled message type: ${parsedMessage.type}`;
            }
            // Record metrics
            const processingTime = Date.now() - startTime;
            this.monitor.recordMetric({
                messageType: parsedMessage.type,
                processingTime,
                success,
                errorDetails: success ? undefined : errorDetails
            });
        }
        catch (error) {
            this.logger.error('Error handling message:', error);
            // Record error metric
            this.monitor.recordMetric({
                messageType: 'unknown',
                processingTime: 0,
                success: false,
                errorDetails: error instanceof Error ? error.message : String(error)
            });
        }
    }
    async handleSystemMessage(message) {
        if (message.details?.action === 'initialize') {
            await this.sendAcknowledgment(message);
        }
    }
    async handleTaskMessage(message) {
        // Implement task handling logic
        this.logger.log(`Processing task: ${JSON.stringify(message.details)}`);
    }
    async handleCodeReviewMessage(message) {
        // Implement code review handling logic
        this.logger.log(`Processing code review: ${JSON.stringify(message.details)}`);
    }
    async sendAcknowledgment(message) {
        const ackMessage = {
            type: 'system',
            timestamp: new Date().toISOString(),
            metadata: {
                version: '1.1.0',
                priority: 'high',
                source: 'trae'
            },
            details: {
                action: 'acknowledge',
                replyTo: message.metadata.source,
                status: {
                    monitoring: 'active',
                    heartbeat: 'enabled',
                    metrics: 'collecting'
                }
            }
        };
        await this.publishMessage(this.channels.augment, ackMessage);
    }
    async publishMessage(channel, message) {
        try {
            await this.redis.publish(channel, JSON.stringify(message));
        }
        catch (error) {
            this.logger.error(`Failed to publish message to ${channel}:`, error);
            throw error;
        }
    }
    handleError(error) {
        this.logger.error('Redis error:', error);
        this.isConnected = false;
    }
    async cleanup() {
        try {
            await this.subscriber.unsubscribe();
            await this.subscriber.quit();
            await this.redis.quit();
            await this.monitor.cleanup();
            this.isConnected = false;
            this.logger.log('Trae Agent cleaned up successfully');
        }
        catch (error) {
            this.logger.error('Error during cleanup:', error);
            throw error;
        }
    }
}
// Start the Trae Agent client
async function main() {
    const client = new TraeAgentClient();
    // Handle process termination
    process.on('SIGINT', async () => {
        await client.cleanup();
        process.exit(0);
    });
    process.on('SIGTERM', async () => {
        await client.cleanup();
        process.exit(0);
    });
}
// Run the main function
main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
