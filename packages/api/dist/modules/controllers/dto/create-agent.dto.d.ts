import type { CreateAgentDto as ICreateAgentDto } from '@the-new-fuse/types';
import { AgentType, AgentCapability } from '@the-new-fuse/types';
export declare class CreateAgentDto implements ICreateAgentDto {
    name: string;
    type: AgentType;
    capabilities: AgentCapability[];
    metadata?: Record<string, any>;
    ownerId?: string;
}
//# sourceMappingURL=create-agent.dto.d.ts.map