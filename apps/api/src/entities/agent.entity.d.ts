import { User } from './user.entity.tsx';
import { AgentType } from '../dtos/agent.dto.tsx';
import { Message } from './message.entity.tsx';
import { WorkflowStep } from './workflow-step.entity.tsx';
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
