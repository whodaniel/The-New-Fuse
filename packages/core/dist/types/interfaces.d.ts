export interface IAgent {
    id: string;
    name: string;
    capabilities: string[];
    processMessage(message: string): Promise<string>;
}
export interface IMessage {
    id: string;
    content: string;
    sender: string;
    timestamp: Date;
    type: 'user' | 'agent' | 'system';
}
export interface IPromptTemplate {
    id: string;
    name: string;
    template: string;
    variables: string[];
}
export interface IMemoryStore {
    store(key: string, value: unknown, ttl?: number): Promise<void>;
    get(key: string): Promise<unknown>;
    delete(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
}
export interface ILLMProvider {
    name: string;
    model: string;
    generateResponse(prompt: string, options?: any): Promise<string>;
}
export interface IAgentConfiguration {
    id: string;
    name: string;
    model: string;
    systemPrompt: string;
    capabilities: string[];
    settings: Record<string, any>;
}
export interface ITaskResult {
    success: boolean;
    result?: any;
    error?: string;
    duration?: number;
}
export interface IServiceHealth {
    healthy: boolean;
    message?: string;
    timestamp: Date;
}
//# sourceMappingURL=interfaces.d.ts.map