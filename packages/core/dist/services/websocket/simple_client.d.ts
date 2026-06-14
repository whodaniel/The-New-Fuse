import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { Logger } from 'winston';
export declare class SimpleWebSocketClient {
    private state;
    private redisService;
    private logger;
    private config;
    constructor(config: any, logger: Logger, redisService: UnifiedRedisService);
    initialize(): Promise<void>;
    sendMessage(channel: string, message: any): Promise<void>;
    subscribe(channel: string, callback: (message: any) => void): Promise<void>;
    disconnect(): Promise<void>;
}
//# sourceMappingURL=simple_client.d.ts.map