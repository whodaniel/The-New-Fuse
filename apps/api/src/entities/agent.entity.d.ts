import { AgentType } from '../dtos/agent.dto';
import { User } from './user.entity';
import { Message } from './message.entity';
import { WorkflowStep } from './workflow-step.entity';
export declare class Agent {
    id: string;
    name: string;
    type: AgentType;
    config: Record<string, any>;
    description?: string;
    instanceId?: string;
    isActive: boolean;
    owner: User;
    messages: Message[];
    workflowSteps: WorkflowStep[];
    capabilities: string[];
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    lastActiveAt?: Date;
}
//# sourceMappingURL=agent.entity.d.ts.map