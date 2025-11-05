import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { StreamPacket, StreamEventType } from '@the-new-fuse/types';
export declare class DACCStreamingService implements OnModuleInit, OnModuleDestroy {
    private configService;
    private readonly logger;
    private redis;
    private subscriber;
    private publisher;
    private streamSubject;
    private channelPrefix;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    /**
     * Publish a stream packet to Redis
     */
    publishStream(executionId: string, packet: StreamPacket): Promise<void>;
    /**
     * Get observable for specific execution stream
     */
    getExecutionStream(executionId: string): Observable<StreamPacket>;
    /**
     * Get observable for specific event types
     */
    getEventTypeStream(executionId: string, eventTypes: StreamEventType[]): Observable<StreamPacket>;
    /**
     * Get observable for all streams (admin/monitoring)
     */
    getAllStreams(): Observable<{
        channel: string;
        packet: StreamPacket;
    }>;
    /**
     * Create Server-Sent Events observable for HTTP response
     */
    createSSEStream(executionId: string): Observable<{
        data: string;
        type?: string;
        id?: string;
        retry?: number;
    }>;
    /**
     * Publish workflow update event
     */
    publishWorkflowUpdate(executionId: string, step: string, data: any): Promise<void>;
    /**
     * Publish agent thought event
     */
    publishThought(executionId: string, step: string, thought: string): Promise<void>;
    /**
     * Publish tool call event
     */
    publishToolCall(executionId: string, step: string, toolName: string, request: any): Promise<void>;
    /**
     * Publish tool output event
     */
    publishToolOutput(executionId: string, step: string, toolName: string, output: any): Promise<void>;
    /**
     * Publish log message event
     */
    publishLogMessage(executionId: string, step: string, level: string, message: string): Promise<void>;
    /**
     * Publish token stream event (for streaming LLM responses)
     */
    publishTokenStream(executionId: string, step: string, tokens: string): Promise<void>;
    /**
     * Publish final output event
     */
    publishFinalOutput(executionId: string, step: string, output: any): Promise<void>;
    /**
     * Get stream statistics
     */
    getStreamStats(): Promise<{
        activeChannels: number;
        totalMessages: number;
        redisInfo: any;
    }>;
    /**
     * Clean up old streams
     */
    cleanupOldStreams(maxAgeHours?: number): Promise<number>;
}
//# sourceMappingURL=streaming.service.d.ts.map