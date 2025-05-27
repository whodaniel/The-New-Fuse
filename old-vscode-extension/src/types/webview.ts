import { LLMProviderInfo } from './llm.js';

export interface WebViewMessage {
    command: string;
    text?: string;
    data?: Record<string, any>;
    timestamp?: string;
}

export interface WebViewConnection {
    id: string;
    status: 'connected' | 'disconnected';
    timestamp: string;
}

export interface WebViewStatus {
    connected: boolean;
    provider?: LLMProviderInfo;
    error?: string;
}

export interface WebViewCommandEvent {
    command: string;
    args: any[];
    timestamp: string;
}

export interface WebViewCommandHandler {
    (message: WebViewMessage): Promise<void>;
}