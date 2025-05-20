import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class RedisService implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private client;
    private pubClient;
    private subClient;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    private handleAgentMessage;
    private handleComposerMessage;
    private handleRooCoderMessage;
    sendToComposer(message: any): Promise<void>;
    sendToRooCoder(message: any): Promise<void>;
    getAgentState(agentId: string): Promise<any>;
    setAgentState(agentId: string, state: any): Promise<void>;
    clearAgentState(agentId: string): Promise<void>;
}
