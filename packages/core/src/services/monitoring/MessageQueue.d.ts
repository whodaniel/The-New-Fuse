import { ConfigService } from '@nestjs/config';
export interface QueueMessage {
    id: string;
    type: string;
    payload: unknown;
    priority: number;
    timestamp: Date;
    retryCount?: number;
}
export declare class MessageQueue {
    private configService;
    private redis;
    private readonly logger;
    queue: ;;
    constructor(configService: ConfigService);
}
