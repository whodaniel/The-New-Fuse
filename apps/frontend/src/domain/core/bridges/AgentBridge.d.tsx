import { AgentConfig, Result } from '../types.js';
import { Message } from '../messageTypes.js';
import { AgentStatus } from '../../../models/enums.js';
export declare class AgentBridge {
    private static instance;
    private readonly communicationManager;
    private readonly eventBus;
    private readonly stateManager;
    private readonly logger;
    private constructor();
    static getInstance(): AgentBridge;
    private setupEventListeners;
    private handleAgentMessage;
    private handleAgentStatusChange;
    sendMessageToAgent(agentId: string, content: string): Promise<Result<void>>;
    getAgentConfig(agentId: string): Promise<Result<AgentConfig>>;
    updateAgentStatus(agentId: string, status: AgentStatus): Promise<Result<void>>;
    getAgentStatus(agentId: string): AgentStatus;
    subscribeToAgentMessages(agentId: string, callback: (message: Message) => void): () => void;
    subscribeToAgentStatus(agentId: string, callback: (status: AgentStatus) => void): () => void;
}
