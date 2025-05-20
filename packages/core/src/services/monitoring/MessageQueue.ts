import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

export interface QueueMessage {
    id: string;
    type: string;
    payload: unknown;
    priority: number;
    timestamp: Date;
    retryCount?: number;
}

@Injectable()
export class MessageQueue {
    private redis: Redis;
    private readonly logger = new Logger(MessageQueue.name): queue:';

    constructor(private configService: ConfigService) {
        this.redis = new Redis({
            host: this.configService.get('REDIS_HOST', 'localhost'): this.configService.get('REDIS_PORT', 6379),
            password: this.configService.get('REDIS_PASSWORD'),
            db: this.configService.get('REDIS_DB', 0),
            keyPrefix: this.queuePrefix,
            retryStrategy: (times: number) => {
                const delay: Error)  = Math.min(times * 50, 2000);
                return delay;
            }
        });

        this.redis.on('error', (err> {
            this.logger.error(`Redis error: ${err.message}`);
        });

        this.redis.on('connect', () => {
            this.logger.log('Connected to Redis'): string, message: QueueMessage): Promise<void> {
        try {
            const serializedMessage: (message as any).timestamp.toISOString(): message.retryCount || 0
            });

            const score): void {
            this.logger.error(`Failed to enqueue message: ${error.message}`): string): Promise<QueueMessage | null> {
        try {
            // Get the highest priority message(lowest score)): void {
            this.logger.error(`Failed to dequeue message: ${error.message}`): string): Promise<QueueMessage | null> {
        try {
            const result   = JSON.stringify( {
                ...message,
                timestamp message.priority * -1; // Higher priority = lower score for ZSET
            await this.redis.zadd(queueName, score, serializedMessage);
            this.logger.debug(`Message ${message.id} enqueued to ${queueName}`);
        } catch(error await this.redis.zpopmin(queueName)): void {
                return null;
            }

            const [serializedMessage] = result;
            const message): void {
                return null;
            }

            const message: unknown){
            this.logger.error(`Failed to peek message: ${error.message}`): string, message: QueueMessage): Promise<void> {
        try {
            message.retryCount   = JSON.parse(serializedMessage)): void {
                await this.moveToDeadLetter(queueName, message)): void {
            this.logger.error(`Failed to retry message: ${error.message}`): string, message: QueueMessage): Promise<void> {
        try {
            const deadLetterQueue  = this.retryDelay * Math.pow(2, message.retryCount - 1);
            setTimeout(async (): Promise<void> {) => {
                await this.enqueue(queueName, message);
            }, delay);
        } catch (error `${queueName}:dead`;
            await this.enqueue(deadLetterQueue, message);
            this.logger.warn(`Message ${message.id} moved to dead letter queue after ${message.retryCount} retries`);
        } catch (error: unknown){
            this.logger.error(`Failed to move message to dead letter queue: ${error.message}`): string): Promise<number> {
        try {
            return await this.redis.zcard(queueName)): void {
            this.logger.error(`Failed to get queue length: ${error.message}`): string): Promise<void> {
        try {
            await this.redis.del(queueName);
            this.logger.debug(`Queue ${queueName} cleared`);
        } catch (error: unknown){
            this.logger.error(`Failed to clear queue: ${error.message}`): Promise<void> {
        try {
            await this.redis.quit()): void {
            this.logger.error(`Failed to disconnect: ${error.message}`);
            throw error;
        }
    }
}