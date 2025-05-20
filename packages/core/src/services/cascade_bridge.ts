import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { createLogger, transports, format } from 'winston';
import WebSocket from 'ws';
import fetch from 'node-fetch';
import { createCipheriv, randomBytes } from 'crypto';
import { EventEmitter } from 'events';

const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.colorize(),
        format.timestamp(),
        format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level}]: ${message}`;
        })
    ),
    transports: [
        new transports.Console()
    ]
});

interface Heartbeat {
    agent_id: string;
    timestamp: string;
    status: string;
    load: number;
}

interface RedisConfig {
    host: string;
    port: number;
    db: number;
}

interface Message {
    id: string;
    content: any;
    sender_id: string;
}

interface Response {
    message_id: string;
}

@Injectable()
export class CascadeBridge {
    private static readonly MAX_MESSAGE_SIZE = 1024 * 1024; // 1MB
    private redisClient: Redis;
    private pubsub: Redis;
    private connected: boolean = false;
    private logger = new Logger(CascadeBridge.name);

    constructor(private configService: ConfigService) {
        const redisConfig: RedisConfig = {
            host: this.configService.get('REDIS_HOST', 'localhost'),
            port: this.configService.get('REDIS_PORT', 6379),
            password: this.configService.get('REDIS_PASSWORD'),
            db: this.configService.get('REDIS_DB', 0),
            keyPrefix: 'fuse:bridge:',
            retryStrategy: (times: number) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            }
        };

        this.redisClient = new Redis(redisConfig);
        this.pubsub = new Redis(redisConfig);

        this.redisClient.on('error', (err: Error) => {
            this.logger.error(`Redis client error: ${err.message}`);
        });

        this.pubsub.on('error', (err: Error) => {
            this.logger.error(`Redis pubsub error: ${err.message}`);
        });
    }

    async connect(): Promise<void> {
        if (this.connected) return;
        
        try {
            await this.redisClient.ping();
            this.connected = true;
        } catch (error) {
            this.logger.error(`Failed to connect to Redis: ${error.message}`);
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        if (!this.connected) return;
        
        try {
            await this.redisClient.quit();
            this.connected = false;
        } catch (error) {
            this.logger.error(`Error disconnecting from Redis: ${error.message}`);
            throw error;
        }
    }

    async publish(channel: string, message: Message): Promise<void> {
        if (!this.connected) {
            throw new Error('Not connected to Redis');
        }

        try {
            const messageString = JSON.stringify(message);
            await this.redisClient.publish(channel, messageString);
            this.logger.debug(`Message sent to ${channel}`, { messageId: message.id });
        } catch (error) {
            this.logger.error(`Failed to publish message: ${error.message}`);
            throw error;
        }
    }

    async subscribe(channel: string): Promise<void> {
        try {
            await this.pubsub.subscribe(channel);
        } catch (error) {
            this.logger.error(`Failed to subscribe to channel: ${error.message}`);
            throw error;
        }
    }

    async unsubscribe(channel: string): Promise<void> {
        try {
            await this.pubsub.unsubscribe(channel);
            this.logger.debug(`Unsubscribed from ${channel}`);
        } catch (error) {
            this.logger.error(`Failed to unsubscribe from channel: ${error.message}`);
            throw error;
        }
    }

    onMessage(callback: (message: Message) => void): void {
        this.pubsub.on('message', (channel: string, messageStr: string) => {
            try {
                const message = JSON.parse(messageStr);
                callback(message);
            } catch (error) {
                this.logger.error(`Error parsing message: ${error.message}`);
            }
        });
    }
}
