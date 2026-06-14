import { Agent } from './agent.entity.js';
import { PromptTemplate } from './prompt.entity.js';
export declare class AgentPrompt {
    id: string;
    agentId: string;
    agent: Agent;
    promptId: string;
    prompt: PromptTemplate;
    purpose: 'system' | 'user' | 'function' | 'response';
    config?: Record<string, any>;
    formatOptions?: {
        format: 'text' | 'json' | 'markdown';
    };
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=agent-prompt.entity.d.ts.map