import * as vscode from 'vscode';

export interface TheFuseAPI {
    readonly apiVersion: string;
    readonly extensionPath: string;
    
    initialize(): Promise<void>;
    dispose(): void;
    
    // LLM related methods
    generateText(prompt: string, options?: any): Promise<{ text: string }>;
    getAvailableModels(): Promise<string[]>;
    setModel(modelName: string): Promise<void>;
    
    // MCP related methods
    initializeMCP(): Promise<void>;
    executeMCPTool(toolId: string, params: any): Promise<any>;
    
    // Relay related methods
    sendMessageToWeb(message: string, metadata?: any): void;
    isRelayConnected(): boolean;
    
    // Utility methods
    showInformationMessage(message: string): void;
    showErrorMessage(message: string): void;
}