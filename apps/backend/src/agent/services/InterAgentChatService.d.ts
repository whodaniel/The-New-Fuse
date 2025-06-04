import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RedisService } from './RedisService.js';
import { AlertService } from './AlertService.js';
import { MonitoringService } from './MonitoringService.js';
export declare class InterAgentChatService implements OnModuleInit {
    private readonly configService;
    private readonly redisService;
    private readonly alertService;
    private readonly monitoringService;
    private readonly eventEmitter;
    private readonly channelPrefix;
    private agentId;
    constructor(configService: ConfigService, redisService: RedisService, alertService: AlertService, monitoringService: MonitoringService, eventEmitter: EventEmitter2);
    onModuleInit(): Promise<void>;
    /**
     * Subscribe to the agent's message channel
     */
    private subscribeToAgentChannel;
    /**
     * Handle an incoming message from another agent
     */
    private handleIncomingMessage;
    /**
     * Send a message to another agent
     */
    sendMessage(toAgentId: string, content: string, metadata?: Record<string, any>): Promise<string>;
    /**
     * Broadcast a message to all agents
     */
    broadcastMessage(content: string, metadata?: Record<string, any>): Promise<string>;
    /**
     * Generate a unique message ID
     */
    private generateMessageId;
    /**
     * Check if the agent chat service is healthy
     */
    checkHealth(): Promise<{
        status: string;
        details?: any;
    }>;
}
