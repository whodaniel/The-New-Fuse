export interface PromptParameter {
    name: string;
    type: "string" | "number" | "boolean" | "array" | "object";
    description?: string;
    required: boolean;
    default?: unknown;
    validation?: {
        min?: number;
        max?: number;
        pattern?: string;
        enum?: unknown[];
    };
}
export interface PromptMetrics {
    successRate: number;
    averageResponseTime: number;
    errorRate: number;
    tokenUsage: {
        average: number;
        total: number;
    };
    lastUsed: Date;
}
export interface PromptTemplate {
    id: string;
    name: string;
    description: string;
    template: string;
    parameters: PromptParameter[];
    category: string;
    version: number;
    metrics: PromptMetrics;
    metadata: {
        author: string;
        created: Date;
        updated: Date;
        tags: string[];
    };
    render(params: Record<string, unknown>): string;
    validate(params: Record<string, unknown>): {
        isValid: boolean;
        errors?: string[];
    };
}
export interface AgentPromptTemplate extends PromptTemplate {
    agentId: string;
    purpose: "system" | "user" | "function" | "response";
    contextRequirements?: {
        needsHistory?: boolean;
        needsMemory?: boolean;
        needsTools?: boolean;
        needsState?: boolean;
    };
    expectedResponse?: {
        format: "text" | "json" | "markdown" | "code";
        schema?: object;
    };
}
