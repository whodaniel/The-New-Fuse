/**
 * Local AI Detection Service
 * Detects available local AI CLIs and registers them as Agents
 */
import { CreateAgentDto, AgentCapability } from '@the-new-fuse/types';
export interface LocalAIProvider {
    name: string;
    command: string;
    checkCommand: string[];
    description: string;
    capabilities: AgentCapability[];
    defaultModel?: string;
    apiEndpoint?: string;
}
export declare class LocalAIDetectionService {
    private readonly logger;
    private readonly supportedProviders;
    detectAvailableAIs(): Promise<LocalAIProvider[]>;
    checkProviderAvailability(provider: LocalAIProvider): Promise<boolean>;
    createAgentFromProvider(provider: LocalAIProvider, userId: string): CreateAgentDto;
    detectAndCreateAgents(userId: string): Promise<CreateAgentDto[]>;
    createDefaultSystemAgents(): Promise<CreateAgentDto[]>;
    refreshAgentProviders(userId: string): Promise<CreateAgentDto[]>;
}
//# sourceMappingURL=LocalAIDetectionService.d.ts.map