import * as vscode from 'vscode';

export class ConfigurationManager {
    constructor(private context: vscode.ExtensionContext) {}

    getApiUrl(): string {
        const config = vscode.workspace.getConfiguration('theNewFuse');
        return config.get('apiUrl') || 'http://localhost:3001/api';
    }

    async getAuthToken(): Promise<string | undefined> {
        return await this.context.secrets.get('authToken');
    }

    async setAuthToken(token: string): Promise<void> {
        await this.context.secrets.store('authToken', token);
    }

    getLLMProvider(): string {
        const config = vscode.workspace.getConfiguration('theNewFuse');
        return config.get('llmProvider') || 'vscode';
    }

    getMaxTokens(): number {
        const config = vscode.workspace.getConfiguration('theNewFuse');
        return config.get('maxTokens') || 4000;
    }

    getTemperature(): number {
        const config = vscode.workspace.getConfiguration('theNewFuse');
        return config.get('temperature') || 0.7;
    }

    isDebugLoggingEnabled(): boolean {
        const config = vscode.workspace.getConfiguration('theNewFuse');
        return config.get('enableDebugLogging') || false;
    }

    async updateConfig(key: string, value: any): Promise<void> {
        const config = vscode.workspace.getConfiguration('theNewFuse');
        await config.update(key, value, vscode.ConfigurationTarget.Global);
    }
}