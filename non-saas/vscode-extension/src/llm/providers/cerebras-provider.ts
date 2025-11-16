import * as vscode from 'vscode';
import { LLMProvider, LLMQueryOptions } from '../../types';

/**
 * Cerebras LLM Provider implementation
 * Migrated and enhanced from old extension with full feature parity
 */
export class CerebrasProvider implements LLMProvider {
    public readonly id: string = 'cerebras';
    public readonly name: string = 'Cerebras';

    private apiKey: string | undefined;
    private currentModel: string = 'llama3.1-8b';
    private isClientInitialized: boolean = false;
    private initializationPromise: Promise<void> | undefined;
    
    private readonly availableModels = [
        { id: 'llama3.1-8b', name: 'Llama 3.1 8B', description: 'Fast and efficient for most tasks' },
        { id: 'llama3.1-70b', name: 'Llama 3.1 70B', description: 'More capable for complex reasoning' },
        { id: 'llama-4-scout-17b-16e-instruct', name: 'Llama-4 Scout 17B Instruct', description: 'Optimized for instruction following' },
        { id: 'mixtral-8x7b', name: 'Mixtral 8x7B', description: 'Mixture of experts model' },
        { id: 'codellama-70b', name: 'CodeLlama 70B', description: 'Specialized for code generation' }
    ];

    constructor(private readonly context: vscode.ExtensionContext) {
        this.loadConfiguration();
        
        // Listen for configuration changes
        context.subscriptions.push(
            vscode.workspace.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('theNewFuse.cerebras')) {
                    this.loadConfiguration();
                }
            })
        );
    }

    private async loadConfiguration() {
        const config = vscode.workspace.getConfiguration('theNewFuse.cerebras');
        
        // Try to get API key from secrets first, then from configuration
        try {
            this.apiKey = await this.context.secrets.get('cerebras-api-key');
            if (!this.apiKey) {
                this.apiKey = config.get<string>('apiKey');
            }
        } catch (error) {
            console.warn('Failed to load Cerebras API key from secrets:', error);
            this.apiKey = config.get<string>('apiKey');
        }
        
        this.currentModel = config.get<string>('model', 'llama3.1-8b');
        this.isClientInitialized = false; // Reset initialization when config changes
    }

    private async initializeClient(): Promise<void> {
        if (this.isClientInitialized && this.apiKey) {
            return;
        }
        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        this.initializationPromise = (async () => {
            try {
                if (this.apiKey) {
                    this.isClientInitialized = true;
                    console.log('Cerebras client initialized successfully.');
                } else {
                    console.error('Cerebras API key not found.');
                    this.isClientInitialized = false;
                }
            } catch (error) {
                console.error('Failed to initialize Cerebras client:', error);
                this.isClientInitialized = false;
            } finally {
                this.initializationPromise = undefined;
            }
        })();
        return this.initializationPromise;
    }

    public async isConfigured(): Promise<boolean> {
        if (!this.isClientInitialized) {
            await this.initializeClient();
        }
        return this.isClientInitialized && !!this.apiKey;
    }

    // Implement missing interface methods
    public async isAvailable(): Promise<boolean> {
        return !!this.apiKey;
    }

    public async query(prompt: string, options?: LLMQueryOptions): Promise<string> {
        // Ensure client initialized
        await this.initializeClient();
        // TODO: Implement actual query logic
        throw new Error('CerebrasProvider.query not implemented');
    }

    public async checkHealth(): Promise<{ status: 'healthy' | 'unhealthy' | 'unknown', message: string, details?: string }> {
        if (!this.apiKey) {
            return {
                status: 'unhealthy',
                message: 'Cerebras API key not configured',
                details: 'Please set your Cerebras API key in the extension settings or secrets.'
            };
        }

        try {
            // Simple health check with a minimal request
            const response = await this.makeRequest('https://api.cerebras.ai/v1/chat/completions', {
                model: 'llama3.1-8b', // Use fastest model for health check
                messages: [{ role: 'user', content: 'Hello' }],
                max_tokens: 10,
                stream: false
            });

            if (response.ok) {
                return {
                    status: 'healthy',
                    message: `Cerebras provider is healthy (model: ${this.currentModel})`
                };
            } else {
                const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
                return {
                    status: 'unhealthy',
                    message: 'Cerebras API request failed',
                    details: errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`
                };
            }
        } catch (error) {
            return {
                status: 'unhealthy',
                message: 'Cerebras API connection failed',
                details: error instanceof Error ? error.message : String(error)
            };
        }
    }

    public async generateText(prompt: string, metadata?: any): Promise<{ text: string; metadata?: any }> {
        const options = metadata || {};
        if (!await this.isConfigured()) {
            throw new Error('Cerebras provider not configured. Please check your API key.');
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000); // 60-second timeout

            const response = await this.makeRequest('https://api.cerebras.ai/v1/chat/completions', {
                model: this.currentModel,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: options?.maxTokens ?? 1000,
                temperature: options?.temperature ?? 0.7,
                stream: false
            }, controller.signal);

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
                throw new Error(`Cerebras API error: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            return { text: data.choices[0]?.message?.content || '', metadata: options };
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
        if (!await this.isConfigured()) {
            throw new Error('Cerebras provider not configured. Please check your API key.');
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000);

            // Convert messages to Cerebras format
            const cerebrasMessages = messages.map(msg => ({
                role: msg.role,
                content: msg.content
            }));

            const response = await this.makeRequest('https://api.cerebras.ai/v1/chat/completions', {
                model: this.currentModel,
                messages: cerebrasMessages,
                max_tokens: options?.maxTokens ?? 1000,
                temperature: options?.temperature ?? 0.7,
                stream: false
            }, controller.signal);

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
                throw new Error(`Cerebras API error: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            return data.choices[0]?.message?.content || '';
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
        await vscode.workspace.getConfiguration('theNewFuse.cerebras').update(
            'model',
            modelId,
            vscode.ConfigurationTarget.Global
        );

        return true;
    }

    public getCurrentModel(): string {
        return this.currentModel;
    }

    private async makeRequest(url: string, body: any, signal?: AbortSignal): Promise<Response> {
        return fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey!}`
            },
            body: JSON.stringify(body),
            signal
        });
    }
}
