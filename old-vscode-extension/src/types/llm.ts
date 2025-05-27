import * as vscode from 'vscode';

export interface LLMProvider {
    id: string;
    name: string;
    modelName?: string;
    capabilities?: string[];
    generate(prompt: string, options?: GenerateOptions): Promise<string>;
    isAvailable(): Promise<boolean>;
    getInfo(): Promise<LLMProviderInfo>;
}

export interface LLMProviderInfo {
    name: string;
    version: string;
    capabilities: string[];
    models: string[];
    maxTokens: number;
    isAvailable: boolean;
    metadata?: Record<string, any>;
}

export interface GenerateOptions {
    temperature?: number;
    maxTokens?: number;
    stop?: string[];
    model?: string;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    metadata?: Record<string, any>;
}

export interface LLMResponse {
    text: string;
    tokens?: {
        prompt: number;
        completion: number;
        total: number;
    };
    model?: string;
    metadata?: Record<string, any>;
}

export interface LLMResult {
    text: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    metadata?: Record<string, any>;
}

export interface LLMMetrics {
    requestCount: number;
    tokenCount: number;
    averageResponseTime: number;
    errorRate: number;
    lastUpdated: Date;
}

export interface ProviderCapabilities {
    maxTokens: number;
    supportsChatCompletion: boolean;
    supportsCodeCompletion: boolean;
    supportsEmbeddings: boolean;
    availableModels: string[];
}