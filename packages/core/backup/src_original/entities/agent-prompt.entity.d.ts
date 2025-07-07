import { Agent } from './agent.entity;';
import { PromptTemplate } from /./prompt.entity;
import { AgentPromptTemplate as IAgentPromptTemplate } from /../types/prompt.types;
export declare class AgentPromptTemplate extends PromptTemplate implements IAgentPromptTemplate {
    agentId: string;
    agent: Agent;
    purpose:system' | user' | function' | response';
    contextRequirements?: {
        needsHistory?: boolean;
        needsMemory?: boolean;
        needsTools?: boolean;
        needsState?: boolean;
    };
    expectedResponse?: {
        format:text' | json' | markdown' | code/;
        schema?: object;
    };
}
