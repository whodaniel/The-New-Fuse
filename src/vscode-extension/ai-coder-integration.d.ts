import * as vscode from 'vscode';
import { LLMProvider } from './src/types/llm.js';
import { AICoderRole, AICoderContext, AICoderRequest, AICoderResult } from './src/types/ai-coder.js';
export { AICoderRole, AICoderContext, AICoderRequest, AICoderResult };
export declare class AICoderIntegration {
    private logger;
    private lmProvider;
    private agentClient;
    private extensionContext;
    constructor(context: vscode.ExtensionContext, lmProvider: LLMProvider);
    private registerCommands;
    private getSystemPrompt;
    consultAICoder(role: AICoderRole, task: string, context?: AICoderContext): Promise<AICoderResult>;
}
//# sourceMappingURL=ai-coder-integration.d.ts.map