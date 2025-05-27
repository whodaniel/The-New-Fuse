import * as vscode from 'vscode';

export interface LLMProvider {
    id: string;
    name: string;
    modelName?: string;
    isAvailable(): Promise<boolean>;
    query(prompt: string, options?: LLMQueryOptions): Promise<string>;
    generateText?(prompt: string, metadata?: any): Promise<{ text: string; metadata?: any }>;
    streamResponse?(prompt: string, callback: (chunk: string) => void, options?: LLMQueryOptions): Promise<void>;
    initialize?(): Promise<void>;
    isInitialized?(): Promise<boolean> | boolean;
    getInfo?(): Promise<LLMProviderResponse>;
}

export interface LLMQueryOptions {
    maxTokens?: number;
    temperature?: number;
    stopSequences?: string[];
    model?: string;
    context?: vscode.ExtensionContext;
}

export interface LLMResponse {
    text: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}

export interface LLMProviderResponse {
    provider: string;
    modelName?: string;
    available?: boolean;
    initialized?: boolean;
    temperature?: number;
    maxTokens?: number;
    metadata?: Record<string, any>;
    content?: string | any;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}

// Configuration interface for provider metadata used in monitoring
export interface LLMProviderConfig {
    id: string;
    name: string;
    provider?: string;
    modelName?: string;
}

// Generic request interface for monitoring purposes
export interface LLMProviderRequest {
    prompt: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    options?: any;
}

export interface LLMHealthStatus {
    status: 'healthy' | 'unhealthy';
    provider?: string;
    message: string;
    details?: string;
}
