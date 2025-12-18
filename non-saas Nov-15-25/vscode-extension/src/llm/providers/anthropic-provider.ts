import * as vscode from 'vscode';
import { LLMProvider, LLMQueryOptions } from '../../types';

/**
 * Anthropic Claude LLM Provider implementation
 * Migrated and enhanced from old extension with full feature parity
 */
export class AnthropicProvider implements LLMProvider {
    public readonly id: string = 'anthropic';
    public readonly name: string = 'Anthropic Claude';

    private apiKey: string | undefined;
    private currentModel: string = 'claude-3-sonnet-20240229';
    
    private readonly availableModels = [
        { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: 'Most capable model for complex tasks' },
        { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', description: 'Balanced performance and speed' },
        { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', description: 'Fastest model for simple tasks' },
        { id: 'claude-2.1', name: 'Claude 2.1', description: 'Previous generation model' },
        { id: 'claude-2.0', name: 'Claude 2.0', description: 'Legacy model' },
        { id: 'claude-instant-1.2', name: 'Claude Instant 1.2', description: 'Fast, affordable model' }
    ];

    constructor(private readonly context: vscode.ExtensionContext) {
        this.loadConfiguration();
        
        // Listen for configuration changes
        context.subscriptions.push(
            vscode.workspace.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('theNewFuse.anthropic')) {
                    this.loadConfiguration();
                }
            })
        );
    }

    private async loadConfiguration() {
        const config = vscode.workspace.getConfiguration('theNewFuse.anthropic');
        
        // Try to get API key from secrets first, then from configuration
        try {
            this.apiKey = await this.context.secrets.get('anthropic-api-key');
            if (!this.apiKey) {
                this.apiKey = config.get<string>('apiKey');
            }
        } catch (error) {
            console.warn('Failed to load Anthropic API key from secrets:', error);
            this.apiKey = config.get<string>('apiKey');
        }
        
        this.currentModel = config.get<string>('model', 'claude-3-sonnet-20240229');
    }

    public async isConfigured(): Promise<boolean> {
        return !!this.apiKey;
    }

    // Implement missing interface methods
    public async isAvailable(): Promise<boolean> {
        return !!this.apiKey;
    }

    public async query(prompt: string, options?: LLMQueryOptions): Promise<string> {
        // Delegate to generateChatCompletion for simple queries
        return this.generateChatCompletion([{ role: 'user', content: prompt }], options);
    }

    public async checkHealth(): Promise<{ status: 'healthy' | 'unhealthy' | 'unknown', message: string, details?: string }> {
        if (!this.apiKey) {
            return {
                status: 'unhealthy',
                message: 'Anthropic API key not configured',
                details: 'Please set your Anthropic API key in the extension settings or secrets.'
            };
        }

        try {
            // Simple health check with a minimal request
            const response = await this.makeRequest('https://api.anthropic.com/v1/messages', {
                model: 'claude-3-haiku-20240307', // Use fastest model for health check
                messages: [{ role: 'user', content: 'Hello' }],
                max_tokens: 10
            });

            if (response.ok) {
                return {
                    status: 'healthy',
                    message: `Anthropic provider is healthy (model: ${this.currentModel})`
                };
            } else {
                const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
                return {
                    status: 'unhealthy',
                    message: 'Anthropic API request failed',
                    details: errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`
                };
            }
        } catch (error) {
            return {
                status: 'unhealthy',
                message: 'Anthropic API connection failed',
                details: error instanceof Error ? error.message : String(error)
            };
        }
    }

    public async generateText(prompt: string, metadata?: any): Promise<{ text: string; metadata?: any }> {
        const options = metadata || {};
        if (!this.apiKey) {
            throw new Error('Anthropic API key not configured');
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000); // 60-second timeout

            const response = await this.makeRequest('https://api.anthropic.com/v1/messages', {
                model: this.currentModel,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: options?.maxTokens ?? 1000,
                temperature: options?.temperature ?? 0.7
            }, controller.signal);

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
                throw new Error(`Anthropic API error: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            return { text: data.content[0]?.text || '', metadata: options };
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error('Request timed out. Please try again.');
            }
            throw error;
        }
    }

    public async generateChatCompletion(messages: Array<{ role: string; content: string }>, options?: {
        maxTokens?: number;
        temperature?: number;
        stream?: boolean;
    }): Promise<string> {
        if (!this.apiKey) {
            throw new Error('Anthropic API key not configured');
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000);

            // Convert messages to Anthropic format
            const anthropicMessages = messages.map(msg => ({
                role: msg.role === 'assistant' ? 'assistant' : 'user',
                content: msg.content
            }));

            const response = await this.makeRequest('https://api.anthropic.com/v1/messages', {
                model: this.currentModel,
                messages: anthropicMessages,
                max_tokens: options?.maxTokens ?? 1000,
                temperature: options?.temperature ?? 0.7
            }, controller.signal);

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
                throw new Error(`Anthropic API error: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            return data.content[0]?.text || '';
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error('Request timed out. Please try again.');
            }
            throw error;
        }
    }

    public getAvailableModels(): Array<{ id: string; name: string; description?: string }> {
        return this.availableModels;
    }

    public async setModel(modelId: string): Promise<boolean> {
        const model = this.availableModels.find(m => m.id === modelId);
        if (!model) {
            return false;
        }

        this.currentModel = modelId;
        
        // Update configuration
        await vscode.workspace.getConfiguration('theNewFuse.anthropic').update(
            'model',
            modelId,
            vscode.ConfigurationTarget.Global
        );

        return true;
    }

    public getCurrentModel(): string {
        return this.currentModel;
    }

    /**
     * Parses XML function call output from Claude
     * Used for MCP tools integration
     */
    public parseXmlFunctionCall(content: string): { name: string; arguments: Record<string, any> } | null {
        try {
            // Extract XML function call tags
            const functionCallMatch = content.match(/<function_call>\s*([\s\S]*?)\s*<\/function_call>/);
            if (!functionCallMatch) {
                return null;
            }

            const functionCallContent = functionCallMatch[1];

            // Extract function name
            const nameMatch = functionCallContent.match(/<name>\s*(.*?)\s*<\/name>/);
            if (!nameMatch) {
                return null;
            }

            const name = nameMatch[1];

            // Extract arguments
            const argsMatch = functionCallContent.match(/<arguments>\s*([\s\S]*?)\s*<\/arguments>/);
            if (!argsMatch) {
                return { name, arguments: {} };
            }

            // Try to parse arguments as JSON
            try {
                const args = JSON.parse(argsMatch[1]);
                return { name, arguments: args };
            } catch (jsonError) {
                console.warn('Failed to parse function call arguments as JSON:', jsonError);
                return { name, arguments: { raw: argsMatch[1] } };
            }
        } catch (error) {
            console.error('Failed to parse XML function call:', error);
            return null;
        }
    }

    private async makeRequest(url: string, body: any, signal?: AbortSignal): Promise<Response> {
        return fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey!,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify(body),
            signal
        });
    }
}
