"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Example = void 0;
import redis_1 from 'redis';
import logging_config_1 from './logging_config.js';
class Example {
    constructor(redisHost, redisPort, redisDb) {
        this.redisClient = (0, redis_1.createClient)({
            socket: {
                host: redisHost,
                port: redisPort
            },
            database: redisDb
        });
        this.pubsub = this.redisClient.duplicate();
        this.connected = false;
        this.logger = (0, logging_config_1.setupLogging)('example');
    }
    async connect() {
        try {
            await this.redisClient.connect();
            await this.pubsub.connect();
            const pong = await this.redisClient.ping();
            if (pong === 'PONG') {
                this.connected = true;
                await this.pubsub.subscribe('example_channel', this.handleMessage.bind(this));
                this.logger.info('Subscribed to example_channel');
            }
        }
        catch (error) {
            this.logger.error('Error connecting to Redis:', error instanceof Error ? error.message : String(error));
            throw error;
        }
    }
    async sendMessage(message) {
        if (!this.connected) {
            throw new Error('Not connected to Redis');
        }
        try {
            const messageStr = JSON.stringify(message);
            await this.redisClient.publish('example_channel', messageStr);
            this.logger.debug('Sent message:', messageStr);
        }
        catch (error) {
            this.logger.error('Error sending message:', error instanceof Error ? error.message : String(error));
            throw error;
        }
    }
    async handleMessage(message) {
        try {
            const messageData = JSON.parse(message);
            this.logger.debug('Received message:', messageData);
        }
        catch (error) {
            this.logger.error('Error processing message:', error instanceof Error ? error.message : String(error));
        }
    }
    async disconnect() {
        try {
            if (this.connected) {
                await this.pubsub.unsubscribe('example_channel');
                await this.pubsub.quit();
                await this.redisClient.quit();
                this.connected = false;
                this.logger.info('Disconnected from Redis');
            }
        }
        catch (error) {
            this.logger.error('Error disconnecting:', error instanceof Error ? error.message : String(error));
            throw error;
        }
    }
    isConnected() {
        return this.connected;
    }
}
exports.Example = Example;
//# sourceMappingURL=example.js.map