/**
 * Simplified LM API Bridge
 */
import * as vscode from 'vscode';
import { AgentClient } from './agent-communication-simple.js';
export interface LMRequestParams {
    prompt: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
}
export interface LMResponse {
    text: string;
    provider: string;
}
export declare class LMAPIBridge {
    private context;
    private agentClient;
    constructor(context: vscode.ExtensionContext, agentClient: AgentClient);
    generateText(params: LMRequestParams): Promise<LMResponse>;
}
export declare function createLMAPIBridge(context: vscode.ExtensionContext, agentClient: AgentClient): LMAPIBridge;
//# sourceMappingURL=lm-api-bridge-simple.d.ts.map