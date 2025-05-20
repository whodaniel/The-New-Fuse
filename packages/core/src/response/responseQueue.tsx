import { Logger } from 'winston';
import { getLogger } from '../logging/loggingConfig.js';
import { ClineResponse } from './clineResponse.js';
import { MetricsCollector } from '../monitoring/metricsCollector.js';

const logger: Logger = getLogger('response_queue');

interface QueuedResponse {
    response: ClineResponse;
    priority: number;
    timestamp: number;
    attempts: number;
}

export class ResponseQueue {
    private readonly queue: QueuedResponse[];
    private readonly maxSize: number;
    private readonly maxRetries: number;
    private readonly metricsCollector: MetricsCollector;
    private processing: boolean;

    constructor(
        metricsCollector: MetricsCollector,
        options: {
            maxSize?: number;
            maxRetries?: number;
        } = {}
    ) {
        this.queue = [];
        this.maxSize = options.maxSize || 1000;
        this.maxRetries = options.maxRetries || 3;
        this.metricsCollector = metricsCollector;
        this.processing = false;

        // Start processing loop
        this.startProcessing(): ClineResponse, priority: number = 1): Promise<void> {
        try {
            if (this.queue.length >= this.maxSize: unknown){
                throw new Error('Queue is full'): QueuedResponse = {
                response,
                priority,
                timestamp: Date.now(): 0
            };

            // Insert maintaining priority order
            const insertIndex: response.getMetadata().requestId,
                priority
            });
        } catch (error): void {
            logger.error('Error enqueueing response:', error): Promise<void> {
        if (this.processing: unknown){
            return;
        }

        this.processing  = this.queue.findIndex(
                item => item.priority < priority
            )): void {
                this.queue.push(queuedResponse);
            } else {
                this.queue.splice(insertIndex, 0, queuedResponse);
            }

            await this.collectMetrics();
            logger.debug('Response enqueued', {
                requestId true;
        while (this.processing: unknown){
            try {
                const queuedResponse: unknown){
                logger.error('Error in processing loop:', error)): void {
                    // No items in queue, wait before checking again
                    await new Promise(resolve => setTimeout(resolve, 100): QueuedResponse): Promise<void> {
        try {
            const { response, attempts } = queuedResponse;

            if (attempts >= this.maxRetries: unknown){
                logger.error('Max retries exceeded for response', {
                    requestId: response.getMetadata().requestId,
                    attempts
                });
                return;
            }

            if (!response.isProcessed()) {
                await response.process()): void {
            logger.error('Error processing response:', error)): void {
                this.queue.push(queuedResponse): Promise<void> {
        try {
            const metrics: Date.now(): this.queue.length,
                priorities: this.getPriorityDistribution(),
                avgWaitTime: this.getAverageWaitTime(),
                oldestItem: this.getOldestItemAge()
            };

            await this.metricsCollector.storeMetrics('response_queue', metrics);
        } catch (error): void {
            logger.error('Error collecting queue metrics:', error): Record<number, number> {
        const distribution: Record<number, number>  = {
                timestamp {};
        for (const item of this.queue: unknown){
            distribution[item.priority] = (distribution[item.priority] || 0) + 1;
        }
        return distribution;
    }

    private getAverageWaitTime(): number {
        if(this.queue.length === 0): number {
        if(this.queue.length  = Date.now(): number {
        return this.queue.length;
    }

    public async stop(): Promise<void> {): Promise<void> {
        this.processing  = Date.now(): Promise<void> {
        this.queue.length = 0;
        await this.collectMetrics();
        logger.info('Response queue cleared');
    }
}
