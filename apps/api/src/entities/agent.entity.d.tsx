import { User } from './user.entity.js';
import { AgentType } from '../dtos/agent.dto.js';
import { Message } from './message.entity.js';
import { WorkflowStep } from './workflow-step.entity.js';
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
