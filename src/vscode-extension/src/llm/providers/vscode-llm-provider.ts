import * as vscode from 'vscode';
import { LLMProvider, LLMQueryOptions, LLMProviderResponse } from '../../types';

export class VSCodeLLMProvider implements LLMProvider {
    id = 'vscode';
    name = 'VS Code';
    private _modelName: string | undefined;
    private _modelShortName: string | undefined;
    private _initialized = false;
    private _outputChannel: vscode.OutputChannel | undefined;

    constructor(private readonly context: vscode.ExtensionContext) {
        // Create a dedicated output channel for this provider's logs
        this._outputChannel = vscode.window.createOutputChannel("The New Fuse - VS Code LLM");
        this.log("VSCode LLM Provider initialized");
    }

    // Log messages to the dedicated output channel
    private log(message: string): void {
        if (this._outputChannel) {
            const timestamp = new Date().toISOString();
            this._outputChannel.appendLine(`[${timestamp}] ${message}`);
        }
        // Also log to console for extension host debugging
        console.log(`[VSCodeLLM] ${message}`);
    }

    async isInitialized(): Promise<boolean> {
        return this._initialized;
    }

    async initialize(): Promise<void> {
        this.log("Initializing VSCode LLM Provider");
        try {
            // Check if VS Code LM API is available
            if (typeof vscode.lm === 'undefined' || typeof vscode.lm.selectChatModels !== 'function') {
                this.log("VS Code Language Model API (vscode.lm.selectChatModels) is not available. VS Code LLM provider cannot be initialized.");
                vscode.window.showWarningMessage('VS Code Language Models (GitHub Copilot) are not available. Please ensure VS Code is up to date and GitHub Copilot is active.');
                this._initialized = false;
                return;
            }
            
            // Try to get available models
            // Example: const [model] = await vscode.lm.selectChatModels({ vendor: 'copilot', family: 'gpt-4' }); // Adjust as needed
            const models = await vscode.lm.selectChatModels(); // Using existing logic for now
            if (!models || models.length === 0) {
                this.log("No VS Code language models available - please ensure GitHub Copilot is installed and active");
                this._initialized = false;
                return;
            }
            
            // Store model info for later reference
            this._modelName = models[0].name;
            this._modelShortName = this._modelName.split(' ')[0]; // Get first word as short name
            
            this._initialized = true;
            this.log(`Successfully initialized with model: ${this._modelName}`);
        } catch (error) {
            this.log(`Initialization error: ${error instanceof Error ? error.message : String(error)}`);
            vscode.window.showErrorMessage(`Failed to initialize VS Code LLM provider: ${error instanceof Error ? error.message : String(error)}`);
            if (error instanceof Error && error.stack) {
                this.log(`Stack trace: ${error.stack}`);
            }
            this._initialized = false;
        }
    }

    async isAvailable(): Promise<boolean> {
        try {
            this.log("Checking VSCode LLM availability");
            // Check if VS Code version supports interacting with Language Models
            if (!vscode.lm) {
                this.log("VS Code LM API not available - requires VS Code 1.90.0 or higher");
                return false;
            }
            
            // Try to get the available models
            const models = await vscode.lm.selectChatModels();
            if (!models || models.length === 0) {
                this.log("No VS Code language models are available - please ensure GitHub Copilot is installed and active");
                return false;
            }
            
            this.log(`Found ${models.length} available models: ${models.map(m => m.name).join(', ')}`);
            return true;
        } catch (error) {
            this.log(`Error checking availability: ${error instanceof Error ? error.message : String(error)}`);
            if (error instanceof Error && error.stack) {
                this.log(`Stack trace: ${error.stack}`);
            }
            return false;
        }
    }
    
    get modelName(): string | undefined {
        return this._modelName;
    }

    // Enhanced version of getInfo that includes diagnostic data
    async getInfo(): Promise<LLMProviderResponse> {
        // First check basic availability
        const available = await this.isAvailable();
        
        // Try to get detailed model info if available
        let modelInfo: Record<string, any> = {};
        try {
            if (vscode.lm) {
                const models = await vscode.lm.selectChatModels();
                if (models && models.length > 0) {
                    modelInfo = {
                        name: models[0].name,
                        id: models[0].id,
                        totalModels: models.length
                    };
                }
            }
        } catch (error) {
            this.log(`Error getting model details: ${error instanceof Error ? error.message : String(error)}`);
        }
        
        return {
            provider: this.id,
            modelName: this._modelName || 'Unknown',
            available,
            initialized: this._initialized,
            temperature: 0.7,
            maxTokens: 2048,
            metadata: {
                modelInfo,
                apiVersion: vscode.version,
                extensionVersion: this.context.extension?.packageJSON?.version,
                diagnostics: {
                    hasLmApi: !!vscode.lm,
                    extensionContext: !!this.context
                }
            }
        };
    }

    async query(prompt: string, options?: LLMQueryOptions): Promise<string> {
        this.log(`Query request initiated with prompt length: ${prompt.length} chars`);
        
        // Ensure the provider is initialized first
        if (!this._initialized) {
            this.log("Provider not initialized, attempting to initialize");
            await this.initialize();
        }
        
        try {
            // Verify LM API is available
            if (!vscode.lm) {
                throw new Error('VS Code Language Model API is not available in this version of VS Code');
            }
            
            this.log("Getting available models");
            const models = await vscode.lm.selectChatModels();
            if (!models || models.length === 0) {
                throw new Error('No VS Code language models available');
            }

            const model = models[0]; // Use the first available model
            this.log(`Using VS Code language model: ${model.name}`);
            
            const messages = [
                vscode.LanguageModelChatMessage.User(prompt)
            ];

            // Create a cancellation token source with a timeout
            const cts = new vscode.CancellationTokenSource();
            const timeoutMs = 60000; // 60 seconds timeout
            const timeoutId = setTimeout(() => {
                this.log("Request timed out after 60 seconds");
                cts.cancel();
            }, timeoutMs);

            try {
                this.log("Sending request to VS Code LM API");
                const response = await model.sendRequest(
                    messages, 
                    {}, // Default options
                    cts.token
                );
                
                let fullResponse = '';
                let chunkCount = 0;
                
                this.log("Starting to process response chunks");
                for await (const chunk of response.text) {
                    chunkCount++;
                    fullResponse += chunk;
                    
                    // Log progress periodically but not for every chunk
                    if (chunkCount % 10 === 0) {
                        this.log(`Processing in progress: ${chunkCount} chunks received (${fullResponse.length} chars total)`);
                    }
                }
                
                // Clear the timeout if the response completes normally
                clearTimeout(timeoutId);
                this.log(`Query complete: ${chunkCount} total chunks (${fullResponse.length} chars total)`);
                
                return fullResponse;
            } catch (error) {
                // Clear the timeout if an error occurs
                clearTimeout(timeoutId);
                
                this.log(`Error during query: ${error instanceof Error ? error.message : String(error)}`);
                if (error instanceof Error && error.stack) {
                    this.log(`Stack trace: ${error.stack}`);
                }
                
                throw error;
            }
        } catch (error) {
            this.log(`VSCodeLLM query failed: ${error instanceof Error ? error.message : String(error)}`);
            if (error instanceof Error && error.stack) {
                this.log(`Stack trace: ${error.stack}`);
            }
            
            let errorMessage: string;
            
            if (error instanceof vscode.LanguageModelError) {
                switch (error.code) {
                    case vscode.LanguageModelError.NotFound.name:
                        errorMessage = 'The selected language model is not available. Please check VS Code settings.';
                        break;
                    case vscode.LanguageModelError.Blocked.name:
                        errorMessage = 'The content was filtered due to VS Code content policies.';
                        break;
                    case vscode.LanguageModelError.NoPermissions.name:
                        errorMessage = 'Permission error: You do not have access to this language model.';
                        break;
                    default:
                        this.log(`Unknown VS Code LLM error code: ${error.code}`);
                        errorMessage = `VS Code LLM error (${error.code}): ${error.message}`;
                }
            } else if (error instanceof Error) {
                errorMessage = error.message;
            } else {
                errorMessage = String(error);
            }
            
            throw new Error(`Failed to query VS Code LLM: ${errorMessage}`);
        }
    }

    async streamResponse(prompt: string, callback: (chunk: string) => void, options?: LLMQueryOptions): Promise<void> {
        this.log(`Stream request initiated with prompt length: ${prompt.length} chars`);
        
        // Ensure the provider is initialized first
        if (!this._initialized) {
            this.log("Provider not initialized, attempting to initialize");
            await this.initialize();
        }
        
        try {
            // Verify LM API is available
            if (!vscode.lm) {
                throw new Error('VS Code Language Model API is not available in this version of VS Code');
            }
            
            this.log("Getting available models");
            const models = await vscode.lm.selectChatModels();
            if (!models || models.length === 0) {
                throw new Error('No VS Code language models available');
            }

            const model = models[0]; // Use the first available model
            this.log(`Using VS Code language model: ${model.name}`);
            
            // Send initial status to inform the caller we're beginning
            callback('');  // Empty chunk signals the start of streaming
            
            const messages = [
                vscode.LanguageModelChatMessage.User(prompt)
            ];

            // Create a cancellation token source with a timeout
            const cts = new vscode.CancellationTokenSource();
            const timeoutMs = 60000; // 60 seconds timeout
            const timeoutId = setTimeout(() => {
                this.log("Request timed out after 60 seconds");
                cts.cancel();
            }, timeoutMs);

            try {
                this.log("Sending request to VS Code LM API");
                const response = await model.sendRequest(
                    messages, 
                    {}, // Default options
                    cts.token
                );
                
                let fullResponse = '';
                let chunkCount = 0;
                
                this.log("Starting to stream response chunks");
                for await (const chunk of response.text) {
                    chunkCount++;
                    fullResponse += chunk;
                    callback(chunk);
                    
                    // Log progress periodically but not for every chunk
                    if (chunkCount % 10 === 0) {
                        this.log(`Streaming in progress: ${chunkCount} chunks received (${fullResponse.length} chars total)`);
                    }
                }
                
                // Clear the timeout if the response completes normally
                clearTimeout(timeoutId);
                this.log(`Streaming complete: ${chunkCount} total chunks (${fullResponse.length} chars total)`);
            } catch (error) {
                // Clear the timeout if an error occurs
                clearTimeout(timeoutId);
                
                this.log(`Error during streaming: ${error instanceof Error ? error.message : String(error)}`);
                if (error instanceof Error && error.stack) {
                    this.log(`Stack trace: ${error.stack}`);
                }
                
                throw error;
            }
        } catch (error) {
            this.log(`VSCodeLLM stream failed: ${error instanceof Error ? error.message : String(error)}`);
            if (error instanceof Error && error.stack) {
                this.log(`Stack trace: ${error.stack}`);
            }
            
            let errorMessage: string;
            
            if (error instanceof vscode.LanguageModelError) {
                switch (error.code) {
                    case vscode.LanguageModelError.NotFound.name:
                        errorMessage = 'The selected language model is not available. Please check VS Code settings.';
                        break;
                    case vscode.LanguageModelError.Blocked.name:
                        errorMessage = 'The content was filtered due to VS Code content policies.';
                        break;
                    case vscode.LanguageModelError.NoPermissions.name:
                        errorMessage = 'Permission error: You do not have access to this language model.';
                        break;
                    default:
                        this.log(`Unknown VS Code LLM error code: ${error.code}`);
                        errorMessage = `VS Code LLM error (${error.code}): ${error.message}`;
                }
            } else if (error instanceof Error) {
                errorMessage = error.message;
            } else {
                errorMessage = String(error);
            }
            
            // Send error to callback so it appears in the chat
            callback(`Error: ${errorMessage}`);
            
            throw new Error(`Failed to stream VS Code LLM response: ${errorMessage}`);
        }
    }
}
