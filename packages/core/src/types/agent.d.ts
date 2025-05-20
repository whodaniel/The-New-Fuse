import { LLMProviderConfig } from './llm.types.js';

// Define these interfaces locally instead of importing from @the-new-fuse/types
interface BaseAgentConfig {
  tools?: AgentTool[];
  memory?: boolean;
  visualization?: boolean;
}

interface AgentTool {
  name: string;
  description: string;
  execute: (input: Record<string, unknown>) => Promise<unknown>;
}

export interface Agent {
    config: ExtendedAgentConfig;
    state: AgentState;
    skills: AgentSkill[];
    memory: AgentMemory[];
    tasks: AgentTask[];
    actions: AgentAction[];
}

export interface ExtendedAgentConfig extends BaseAgentConfig {
    id: string;
    name: string;
    description?: string;
    type: string;
    llmConfig: LLMProviderConfig;
    capabilities: {
        reasoning: boolean;
        planning: boolean;
        learning: boolean;
        toolUse: boolean;
        memory: boolean;
    };
    constraints: {
        maxTokensPerRequest: number;
        maxRequestsPerMinute: number;
        maxCostPerDay: number;
    };
    metadata?: Record<string, unknown>;
}

export interface AgentSkill extends AgentTool {
    id: string;
    type: string;
    constraints?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
}

export interface AgentState {
    id: string;
    agentId: string;
    status: "idle" | "busy" | "error";
    currentTask?: string;
    lastActive: Date;
    metrics: {
        totalTasks: number;
        successfulTasks: number;
        failedTasks: number;
        averageTaskDuration: number;
        messagesProcessed: number;
        toolsUsed: number;
    };
    messages: Message[];
    pendingTasks: any[];
    activeTools: string[];
}

export interface AgentAction {
    id: string;
    agentId: string;
    type: string;
    params: Record<string, unknown>;
    status: "pending" | "running" | "completed" | "failed";
    result?: unknown;
    error?: string;
    startTime: Date;
    endTime?: Date;
}

export interface AgentMemory {
    id: string;
    agentId: string;
    type: string;
    content: unknown;
    importance: number;
    timestamp: Date;
    metadata?: Record<string, unknown>;
}

export interface AgentTask {
    id: string;
    agentId: string;
    type: string;
    status: "pending" | "running" | "completed" | "failed";
    priority: number;
    input: unknown;
    output?: unknown;
    error?: string;
    startTime: Date;
    endTime?: Date;
    metadata?: Record<string, unknown>;
}

export interface Message {
    role: "user" | "assistant" | "system";
    content: string;
    timestamp?: Date;
    metadata?: Record<string, unknown>;
}

export interface ToolCall {
    name: string;
    parameters: Record<string, any>;
}
