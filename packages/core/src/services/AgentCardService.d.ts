import { AgentCard } from '../../types/src/agentCard.js';
import { EventEmitter2 } from '@nestjs/event-emitter';
export declare class AgentCardService {
    private eventEmitter;
    private configService?;
    private discoveredAgents;
    private logger;
    private cardStoragePath;
    private cardUrlMap;
    constructor(eventEmitter: EventEmitter2, configService?: {
        get: (key: string) => string;
    } | undefined);
    discoverAgent(url: string): Promise<AgentCard>;
    advertiseAgentCard(card: AgentCard, hostUrl: string): Promise<void>;
    getDiscoveredAgents(): AgentCard[];
    getAgentById(id: string): AgentCard | undefined;
    getAgentUrl(id: string): string | undefined;
    private hostCard;
}
