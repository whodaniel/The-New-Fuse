var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DACCStreamingService_1;
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StreamEventType } from '@the-new-fuse/types';
import Redis from 'ioredis';
let DACCStreamingService = DACCStreamingService_1 = class DACCStreamingService {
    configService;
    logger = new Logger(DACCStreamingService_1.name);
    redis;
    subscriber;
    publisher;
    streamSubject = new Subject();
    channelPrefix;
    constructor(configService) {
        this.configService = configService;
        const redisUrl = this.configService.get('REDIS_URL', 'redis://localhost:6379');
        this.channelPrefix = this.configService.get('DACC_REDIS_CHANNEL_PREFIX', 'dacc:stream:');
        // Create Redis instances
        this.redis = new Redis(redisUrl);
        this.subscriber = new Redis(redisUrl);
        this.publisher = new Redis(redisUrl);
    }
    async onModuleInit() {
        this.logger.log('Initializing DACC Streaming Service');
        // Set up Redis subscriber
        this.subscriber.on('message', (channel, message) => {
            try {
                const packet = JSON.parse(message);
                this.streamSubject.next({ channel, packet });
            }
            catch (error) {
                this.logger.warn(`Failed to parse stream message: ${error.message}`);
            }
        });
        // Subscribe to all DACC stream channels
        await this.subscriber.psubscribe(`${this.channelPrefix}*`);
        this.logger.log('DACC Streaming Service initialized');
    }
    async onModuleDestroy() {
        this.logger.log('Shutting down DACC Streaming Service');
        await this.subscriber.punsubscribe();
        await this.subscriber.quit();
        await this.publisher.quit();
        await this.redis.quit();
        this.streamSubject.complete();
    }
    /**
     * Publish a stream packet to Redis
     */
    async publishStream(executionId, packet) {
        const channel = `${this.channelPrefix}${executionId}`;
        const message = JSON.stringify(packet);
        try {
            await this.publisher.publish(channel, message);
            this.logger.debug(`Published stream packet to ${channel}: ${packet.event_type}`);
        }
        catch (error) {
            this.logger.error(`Failed to publish stream packet: ${error.message}`);
            throw error;
        }
    }
    /**
     * Get observable for specific execution stream
     */
    getExecutionStream(executionId) {
        const targetChannel = `${this.channelPrefix}${executionId}`;
        return this.streamSubject.pipe(filter(({ channel }) => channel === targetChannel), map(({ packet }) => packet));
    }
    /**
     * Get observable for specific event types
     */
    getEventTypeStream(executionId, eventTypes) {
        return this.getExecutionStream(executionId).pipe(filter(packet => eventTypes.includes(packet.event_type)));
    }
    /**
     * Get observable for all streams (admin/monitoring)
     */
    getAllStreams() {
        return this.streamSubject.asObservable();
    }
    /**
     * Create Server-Sent Events observable for HTTP response
     */
    createSSEStream(executionId) {
        return this.getExecutionStream(executionId).pipe(map(packet => ({
            data: JSON.stringify(packet),
            type: packet.event_type,
            id: `${executionId}_${Date.now()}`,
            retry: 5000
        })));
    }
    /**
     * Publish workflow update event
     */
    async publishWorkflowUpdate(executionId, step, data) {
        const packet = {
            event_type: StreamEventType.WORKFLOW_UPDATE,
            data,
            step_name: step,
            timestamp: new Date().toISOString(),
            session_id: executionId
        };
        await this.publishStream(executionId, packet);
    }
    /**
     * Publish agent thought event
     */
    async publishThought(executionId, step, thought) {
        const packet = {
            event_type: StreamEventType.THOUGHT,
            data: { message: thought },
            step_name: step,
            timestamp: new Date().toISOString(),
            session_id: executionId
        };
        await this.publishStream(executionId, packet);
    }
    /**
     * Publish tool call event
     */
    async publishToolCall(executionId, step, toolName, request) {
        const packet = {
            event_type: StreamEventType.TOOL_CALL,
            data: { tool_name: toolName, request },
            step_name: step,
            timestamp: new Date().toISOString(),
            session_id: executionId
        };
        await this.publishStream(executionId, packet);
    }
    /**
     * Publish tool output event
     */
    async publishToolOutput(executionId, step, toolName, output) {
        const packet = {
            event_type: StreamEventType.TOOL_OUTPUT,
            data: { tool_name: toolName, output },
            step_name: step,
            timestamp: new Date().toISOString(),
            session_id: executionId
        };
        await this.publishStream(executionId, packet);
    }
    /**
     * Publish log message event
     */
    async publishLogMessage(executionId, step, level, message) {
        const packet = {
            event_type: StreamEventType.LOG_MESSAGE,
            data: { level, message },
            step_name: step,
            timestamp: new Date().toISOString(),
            session_id: executionId
        };
        await this.publishStream(executionId, packet);
    }
    /**
     * Publish token stream event (for streaming LLM responses)
     */
    async publishTokenStream(executionId, step, tokens) {
        const packet = {
            event_type: StreamEventType.TOKEN_STREAM,
            data: { tokens },
            step_name: step,
            timestamp: new Date().toISOString(),
            session_id: executionId
        };
        await this.publishStream(executionId, packet);
    }
    /**
     * Publish final output event
     */
    async publishFinalOutput(executionId, step, output) {
        const packet = {
            event_type: StreamEventType.FINAL_OUTPUT,
            data: { output },
            step_name: step,
            timestamp: new Date().toISOString(),
            session_id: executionId
        };
        await this.publishStream(executionId, packet);
    }
    /**
     * Get stream statistics
     */
    async getStreamStats() {
        try {
            const info = await this.redis.info('replication');
            const keys = await this.redis.keys(`${this.channelPrefix}*`);
            return {
                activeChannels: keys.length,
                totalMessages: 0, // Would need to implement message counting
                redisInfo: info
            };
        }
        catch (error) {
            this.logger.error(`Failed to get stream stats: ${error.message}`);
            throw error;
        }
    }
    /**
     * Clean up old streams
     */
    async cleanupOldStreams(maxAgeHours = 24) {
        let cleanedCount = 0;
        try {
            const keys = await this.redis.keys(`${this.channelPrefix}*`);
            for (const key of keys) {
                // This is a simplified cleanup - in production, you'd want more sophisticated logic
                // to determine if a stream is old and can be cleaned up
                const keyAgeStr = await this.redis.object('IDLETIME', key);
                const keyAge = parseInt(keyAgeStr, 10);
                if (!isNaN(keyAge) && keyAge > maxAgeHours * 3600) {
                    await this.redis.del(key);
                    cleanedCount++;
                }
            }
            this.logger.log(`Cleaned up ${cleanedCount} old stream keys`);
            return cleanedCount;
        }
        catch (error) {
            this.logger.error(`Failed to cleanup old streams: ${error.message}`);
            return 0;
        }
    }
};
DACCStreamingService = DACCStreamingService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], DACCStreamingService);
export { DACCStreamingService };
//# sourceMappingURL=streaming.service.js.map