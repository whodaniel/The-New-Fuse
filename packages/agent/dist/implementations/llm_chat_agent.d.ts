/**
 * LLM Chat Agent Implementation
 * A versatile conversational AI agent that can interface with multiple LLM providers
 */
import { IAgent } from '../interfaces/IAgent.js';
export interface LLMChatConfig {
    agentId: string;
    name: string;
    provider: 'openai' | 'anthropic' | 'google' | 'perplexity' | 'local';
    model?: string;
    apiKey?: string;
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
}
export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: Date;
    metadata?: Record<string, unknown>;
}
export interface ChatSession {
    sessionId: string;
    messages: ChatMessage[];
    createdAt: Date;
    lastActive: Date;
    metadata?: Record<string, unknown>;
}
export interface ChatResponse {
    content: string;
    tokensUsed: {
        input: number;
        output: number;
    };
    model: string;
    finishReason: 'stop' | 'length' | 'error';
}
export declare class LLMChatAgent implements IAgent {
    readonly id: string;
    readonly name: string;
    readonly type = "llm_chat";
    readonly capabilities: string[];
    private config;
    private memory;
    private sessions;
    private state;
    private isInitialized;
    private conversationHistory;
    constructor(config: LLMChatConfig);
    initialize(): Promise<void>;
    process(message: any): Promise<any>;
    learn(data: unknown): Promise<void>;
    saveToMemory(key: string, value: unknown): Promise<void>;
    retrieveFromMemory(key: string): Promise<any>;
    getState(): Promise<any>;
    setState(state: unknown): Promise<void>;
    sendMessage(message: any): Promise<void>;
    receiveMessage(message: any): Promise<void>;
    handleError(error: Error): Promise<void>;
    chat(content: string, sessionId?: string): Promise<ChatResponse>;
    complete(prompt: string, options?: {
        maxTokens?: number;
        temperature?: number;
    }): Promise<ChatResponse>;
    analyze(text: string, analysisType: 'sentiment' | 'summary' | 'entities' | 'topics'): Promise<any>;
    generateCode(description: string, language: string): Promise<ChatResponse>;
    clearHistory(sessionId?: string): Promise<void>;
    private getOrCreateSession;
    private callLLM;
    private generateSimulatedResponse;
}
export default LLMChatAgent;
//# sourceMappingURL=llm_chat_agent.d.ts.map