import { Observable } from 'rxjs';
import { RedisService } from '../redis/redis.service';
export interface AgentMessage {
    id: string;
    sender: string;
    recipient: string;
    content: unknown;
    metadata?: Record<string, unknown>;
    timestamp: string;
    type: 'direct' | 'broadcast' | 'task_request' | 'task_response' | 'status_update' | 'error';
    priority: 'low' | 'medium' | 'high';
}
interface MessageValidator {
    validate(message: AgentMessage): Promise<boolean>;
}
export declare class AgentCommunicationBridge {
    private readonly redisService;
    private readonly websocketGateway;
    private readonly messageValidator;
    private readonly channels;
    private readonly logger;
    private readonly circuitBreaker;
    constructor(redisService: RedisService, websocketGateway: any, // WebSocketGateway instance
    messageValidator: MessageValidator);
    broadcastMessage(message: AgentMessage): Promise<void>;
    sendDirectMessage(message: AgentMessage): Promise<void>;
    getAgentChannel(agentId: string): Observable<AgentMessage>;
    private initializeRedisSubscriptions;
    private logCommunication;
}
export {};
//# sourceMappingURL=AgentCommunicationBridge.d.ts.map