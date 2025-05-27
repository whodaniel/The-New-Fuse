import * as vscode from 'vscode';
import { Cerebras } from '@cerebras/cerebras_cloud_sdk';
import { LLMProvider, GenerateOptions, LLMResponseMessage } from '../llm_types.js'; // Assuming llm_types.ts exists

const CEREBRAS_API_KEY_SECRET_NAME = 'thefuse.cerebrasApiKey';

export class CerebrasProvider implements LLMProvider {
    private cerebrasClient: Cerebras | undefined;
    private context: vscode.ExtensionContext;
    private isClientInitialized: boolean = false;
    private initializationPromise: Promise<void> | undefined;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        // Initialize client lazily or explicitly via a dedicated method
    }

    private async initializeClient(): Promise<void> {
        if (this.isClientInitialized && this.cerebrasClient) {
            return;
        }
        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        this.initializationPromise = (async () => {
            try {
                const apiKey = await this.context.secrets.get(CEREBRAS_API_KEY_SECRET_NAME);
                if (apiKey) {
                    this.cerebrasClient = new Cerebras({ apiKey });
                    this.isClientInitialized = true;
                    console.log('Cerebras client initialized successfully.');
                } else {
                    console.error('Cerebras API key not found in secrets.');
                    vscode.window.showWarningMessage('Cerebras API key not configured. Please set it in the settings.');
                    this.isClientInitialized = false;
                }
            } catch (error) {
                console.error('Failed to initialize Cerebras client:', error);
                vscode.window.showErrorMessage(`Failed to initialize Cerebras client: ${error instanceof Error ? error.message : String(error)}`);
                this.isClientInitialized = false;
            } finally {
                this.initializationPromise = undefined;
            }
        })();
        return this.initializationPromise;
    }

    async isConfigured(): Promise<boolean> {
        if (!this.isClientInitialized || !this.cerebrasClient) {
            await this.initializeClient();
        }
        return this.isClientInitialized && !!this.cerebrasClient;
    }

    getId(): string {
        return 'cerebras';
    }

    getDisplayName(): string {
        return 'Cerebras';
    }

    async getAvailableModels(): Promise<{ id: string; name: string; }[]> {
        if (!(await this.isConfigured())) {
            // Optionally, prompt user to configure or throw error
            // For now, return empty or a message indicating not configured
            return [];
        }
        // Hardcoded models as per requirement
        return [
            { id: 'llama3.1-8b', name: 'Llama3.1 8B' },
            { id: 'llama-4-scout-17b-16e-instruct', name: 'Llama-4 Scout 17B Instruct' },
            // Add other models from Table 2 if needed
        ];
    }

    async generate(options: GenerateOptions, cancellationToken?: vscode.CancellationToken): Promise<LLMResponseMessage | null> {
        if (!(await this.isConfigured()) || !this.cerebrasClient) {
            vscode.window.showErrorMessage('Cerebras provider is not configured. Please check your API key.');
            throw new Error('Cerebras provider not configured.');
        }

        const messages = options.messages || (options.prompt ? [{ role: 'user', content: options.prompt }] : []);
        if (messages.length === 0) {
            throw new Error('No prompt or messages provided for generation.');
        }

        try {
            const chatCompletion = await this.cerebrasClient.chat.completions.create({
                model: options.modelId, // Ensure modelId is passed in GenerateOptions
                messages: messages,
                // stream: false, // Non-streaming for now
                // max_tokens: options.maxTokens, // Optional: if you want to control output length
                // temperature: options.temperature, // Optional
            });

            if (cancellationToken?.isCancellationRequested) {
                console.log('Cerebras generation cancelled.');
                return { role: 'assistant', content: '' }; // Or throw a cancellation error
            }

            const content = chatCompletion.choices[0]?.message?.content;
            if (content === null || content === undefined) {
                throw new Error('No content received from Cerebras API.');
            }
            return { role: 'assistant', content };

        } catch (error) {
            console.error('Error generating text with Cerebras:', error);
            vscode.window.showErrorMessage(`Cerebras API error: ${error instanceof Error ? error.message : String(error)}`);
            throw error; // Re-throw or handle as appropriate
        }
    }
}

// Define or import LLMProvider and GenerateOptions if not already globally available
// For example, a simplified version for context:
// export interface LLMProvider {
//     getId(): string;
//     getDisplayName(): string;
//     isConfigured(): Promise<boolean>;
//     getAvailableModels(): Promise<{ id: string; name: string; }[]>;
//     generate(options: GenerateOptions, cancellationToken?: vscode.CancellationToken): Promise<LLMResponseMessage | null>;
// }

// export interface LLMResponseMessage {
//     role: 'user' | 'assistant' | 'system';
//     content: string;
//     tool_calls?: any[]; // For function calling, if supported
// }

// export interface GenerateOptions {
//     prompt?: string;
//     messages?: LLMResponseMessage[];
//     modelId: string;
//     onChunk?: (chunk: string) => void; // For streaming
//     maxTokens?: number;
//     temperature?: number;
//     // Other provider-specific options
// }