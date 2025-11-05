import { PrismaService } from '../prisma/prisma.service';
import { Agent, CreateAgentDto, UpdateAgentDto, RegisteredEntity, CreateEntityDto, UpdateEntityDto as FuseUpdateEntityDto } from '@the-new-fuse/types';
export declare class MCPRegistryService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    registerAgent(params: CreateAgentDto): Promise<Agent>;
    getAgentById(id: string): Promise<Agent | null>;
    updateAgentProfile(agentId: string, _updates: UpdateAgentDto): Promise<Agent | null>;
    deleteAgent(id: string): Promise<boolean>;
    registerEntity(params: CreateEntityDto): Promise<RegisteredEntity>;
    getEntityById(id: string): Promise<RegisteredEntity | null>;
    updateEntity(id: string, _updates: FuseUpdateEntityDto): Promise<RegisteredEntity | null>;
    deleteEntity(id: string): Promise<boolean>;
    listAgents(): Promise<Agent[]>;
    listEntities(): Promise<RegisteredEntity[]>;
    private handleError;
}
//# sourceMappingURL=mcp-registry.service.d.ts.map