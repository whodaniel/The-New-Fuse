import * as vscode from 'vscode';

export interface TheFuseAPI {
    readonly apiVersion: string;
    readonly extensionPath: string;
    
    initialize(): Promise<void>;
    dispose(): void;
    
    generateText(prompt: string, options?: any): Promise<{ text: string }>;
    getAvailableModels(): Promise<string[]>;
    setModel(modelName: string): Promise<void>;
}

export interface CommandEvent {
    command: string;
    args: any[];
}