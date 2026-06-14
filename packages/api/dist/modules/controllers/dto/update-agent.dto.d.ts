import type { UpdateAgentDto as IUpdateAgentDto } from '@the-new-fuse/types';
import { AgentType, AgentCapability } from '@the-new-fuse/types';
export declare class UpdateAgentDto implements IUpdateAgentDto {
    name?: string;
    type?: AgentType;
    capabilities?: AgentCapability[];
    metadata?: Record<string, any>;
}
//# sourceMappingURL=update-agent.dto.d.ts.map