import * as vscode from 'vscode';
import { EventEmitter } from 'events';
import { LMAPIBridge, LMResponse } from './lm-api-bridge.js'; // Assuming LMRequestParams is defined here
import { AgentRegistry } from './agent-registry.js'; // Assuming AgentRegistry provides agent info
import { Logger } from './core/logging.js';

// Define LMRequestParams if not imported
interface LMRequestParams {
    prompt: string;
    systemPrompt?: string;
    maxTokens?: number; // Added maxTokens
    // Add other relevant parameters like temperature, stop sequences etc.
}


export class CollaborativeCompletionProvider implements vscode.CompletionItemProvider {
    // ... existing properties ...
    private logger: Logger;

    constructor(
        private lmBridge: LMAPIBridge,
        private agentRegistry: AgentRegistry,
        private context: vscode.ExtensionContext
    ) {
        this.logger = Logger.getInstance();
        // ... existing constructor code ...
    }

    // ... existing methods ...

    async provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext
    ): Promise<vscode.CompletionItem[] | undefined> {
        // ... existing code ...

        try {
            // ... existing code ...

            const results = await Promise.allSettled(
                agents.map(agent => this.requestCompletionFromAgent(agent.id, prompt, document, position))
            );

            // ... existing code ...

        } catch (error) {
             if (error instanceof Error) {
                this.log(`Error providing completions: ${error.message}`);
            } else {
                this.log(`Error providing completions: An unknown error occurred`);
            }
            return undefined;
        }
    }

    private async requestCompletionFromAgent(
        agentId: string,
        prompt: string,
        document: vscode.TextDocument,
        position: vscode.Position
    ): Promise<vscode.CompletionItem[]> {
        try {
            const agent = this.agentRegistry.getAgent(agentId);
            if (!agent || !agent.capabilities.includes('completion')) {
                return [];
            }

            // Construct agent-specific prompt if needed
            const systemPrompt = `You are the ${agent.name} AI agent. Provide code completions.`;

            const response = await this.lmBridge.generate({
                prompt,
                systemPrompt,
                maxTokens: 200, // Add maxTokens if required by LMRequestParams
                // Add other parameters as needed
            });

            if (response.error || !response.text) {
                throw new Error(response.error || 'No completion text received');
            }

            return this.parseCompletions(response.text, agentId, document, position);

        } catch (error) {
             if (error instanceof Error) {
                this.log(`Error requesting completion from ${agentId}: ${error.message}`);
            } else {
                this.log(`Error requesting completion from ${agentId}: An unknown error occurred`);
            }
            return [];
        }
    }

    private async getFallbackCompletion(prompt: string): Promise<string | null> {
        try {
            const response = await this.lmBridge.generate({
                prompt,
                // Add maxTokens if required by LMRequestParams
                // maxTokens: 100,
            });
            return response.text || null;
        } catch (error) {
             if (error instanceof Error) {
                this.log(`Error getting fallback completion: ${error.message}`);
            } else {
                this.log(`Error getting fallback completion: An unknown error occurred`);
            }
            return null;
        }
    }

    // ... existing methods ...

     private log(message: string, ...optionalParams: any[]) {
       this.logger.info(`[CollaborativeCompletion] ${message}`, ...optionalParams);
    }
}