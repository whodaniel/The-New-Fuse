import * as vscode from 'vscode';
/**
 * VSCodeCopilotProvider provides an interface for interacting with
 * GitHub Copilot's VS Code extension features.
 */
export declare class VSCodeCopilotProvider {
    private context;
    private outputChannel;
    private isAvailable;
    constructor(context: vscode.ExtensionContext, outputChannel?: vscode.OutputChannel);
    /**
     * Check if GitHub Copilot is available in the current VS Code instance
     */
    checkAvailability(): Promise<boolean>;
    /**
     * Generate text using VS Code Copilot
     */
    generateText(options: {
        prompt: string;
        systemPrompt?: string;
        temperature?: number;
        maxTokens?: number;
        stopSequences?: string[];
    }): Promise<string>;
    /**
     * Get Copilot configuration
     */
    getConfig(): Promise<any>;
    /**
     * Log a message to the output channel
     */
    private log;
}
//# sourceMappingURL=VSCodeCopilotProvider.d.ts.map