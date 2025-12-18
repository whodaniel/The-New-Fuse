import * as vscode from 'vscode';

/**
 * LLM Provider Health Status
 */
export interface LLMProviderHealth {
    status: 'healthy' | 'unhealthy';
    message: string;
    timestamp: number;
    details?: any;
}

/**
 * Enhanced LLM Provider Manager
 * Uses VS Code's built-in LLM API directly
 */
export class LLMProviderManager {
    private _activeProviderId: string | undefined;
    private _activeModelId: string | undefined;
    private _failedProviders: Set<string> = new Set();
    private _healthStatus: Map<string, LLMProviderHealth> = new Map();
    private _selectedModel: vscode.LanguageModelChat | undefined;
    
    // Keep this for backward compatibility with previous code
    private _initializationError: string | undefined;

    constructor(private readonly context: vscode.ExtensionContext) {
        // Load the last selected provider from configuration
        this._activeProviderId = vscode.workspace.getConfiguration('theNewFuse').get<string>('selectedProviderId');
        this._activeModelId = vscode.workspace.getConfiguration('theNewFuse').get<string>('selectedModelId');

        // Listen for configuration changes
        context.subscriptions.push(
            vscode.workspace.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('theNewFuse')) {
                    this._activeProviderId = vscode.workspace.getConfiguration('theNewFuse').get<string>('selectedProviderId');
                    this._activeModelId = vscode.workspace.getConfiguration('theNewFuse').get<string>('selectedModelId');
                    console.log(`Configuration changed: Provider=${this._activeProviderId}, Model=${this._activeModelId}`);
                }
            })
        );
        
        // Check for available language models at initialization
        this.checkAvailableModels();
    }

    /**
     * Check for available language models
     */
    private async checkAvailableModels() {
        try {
            const availableModels = await vscode.lm.selectChatModels({});
            console.log(`Found ${availableModels?.length || 0} available language models`);
            
            if (!availableModels || availableModels.length === 0) {
                this._initializationError = 'No language models detected';
                console.warn('No language models detected. Ensure a provider like GitHub Copilot is installed and enabled.');
            } else if (this._activeProviderId && this._activeModelId) {
                // Try to initialize the selected model
                await this.initializeSelectedModel(this._activeProviderId, this._activeModelId);
            }
        } catch (err: any) {
            this._initializationError = err.message;
            console.error('Error checking for language models:', err);
        }
    }
    
    /**
     * Initialize the selected model
     */
    private async initializeSelectedModel(providerId: string, modelId: string) {
        try {
            const models = await vscode.lm.selectChatModels({
                vendor: providerId
            });
            
            const selectedModel = models.find(m => m.vendor === providerId && m.id === modelId);
            if (selectedModel) {
                this._selectedModel = selectedModel;
                console.log(`Successfully initialized model: ${providerId}/${modelId}`);
            } else {
                console.warn(`Model ${modelId} from provider ${providerId} not found`);
            }
        } catch (err) {
            console.error(`Failed to initialize selected model (${providerId}/${modelId}):`, err);
        }
    }

    /**
     * Shows a quick pick to select an LLM provider
     */
    public async showProviderQuickPick(): Promise<string | undefined> {
        try {
            const availableModels = await vscode.lm.selectChatModels({});
            
            if (!availableModels || availableModels.length === 0) {
                vscode.window.showWarningMessage('No language models detected. Please ensure a provider like GitHub Copilot is active.');
                return undefined;
            }
            
            // Group models by provider for better display
            const providerMap = new Map<string, vscode.LanguageModelChat[]>();
            for (const model of availableModels) {
                if (!providerMap.has(model.vendor)) {
                    providerMap.set(model.vendor, []);
                }
                providerMap.get(model.vendor)!.push(model);
            }
            
            // Create quick pick items
            const quickPickItems = Array.from(providerMap.keys()).map(providerId => {
                const models = providerMap.get(providerId)!;
                return {
                    label: providerId,
                    description: `${models.length} model(s)`,
                    detail: models.map(m => m.id).join(', '),
                    providerId
                };
            });
            
            const selectedItem = await vscode.window.showQuickPick(quickPickItems, {
                placeHolder: 'Select an LLM provider',
                title: 'The New Fuse: Select Provider'
            });
            
            if (selectedItem) {
                const previousProviderId = this._activeProviderId;
                this._activeProviderId = selectedItem.providerId;
                await vscode.workspace.getConfiguration('theNewFuse').update('selectedProviderId', selectedItem.providerId, vscode.ConfigurationTarget.Global);
                
                // Notify listeners
                vscode.commands.executeCommand('the-new-fuse.notifyProviderSwitch', 
                    previousProviderId || 'none', 
                    selectedItem.providerId);
                    
                return selectedItem.providerId;
            }
            
            return undefined;
        } catch (error) {
            console.error('Error showing provider quick pick:', error);
            vscode.window.showErrorMessage(`Failed to show provider picker: ${error instanceof Error ? error.message : String(error)}`);
            return undefined;
        }
    }
    
    /**
     * Shows a quick pick to select a specific LLM model from a provider
     */
    public async showModelQuickPick(providerId?: string): Promise<{providerId: string, modelId: string} | undefined> {
        try {
            const provId = providerId || this._activeProviderId;
            if (!provId) {
                // If no provider selected, show provider selection first
                const selectedProvider = await this.showProviderQuickPick();
                if (!selectedProvider) {
                    return undefined;
                }
            }
            
            const availableModels = await vscode.lm.selectChatModels({
                vendor: provId
            });
            
            if (!availableModels || availableModels.length === 0) {
                vscode.window.showWarningMessage(`No models found for provider ${provId}`);
                return undefined;
            }
            
            // Create quick pick items for models
            const quickPickItems = availableModels.map(model => {
                return {
                    label: model.id,
                    description: `${model.vendor} - ${model.name}`,
                    model
                };
            });
            
            const selectedItem = await vscode.window.showQuickPick(quickPickItems, {
                placeHolder: 'Select an LLM model',
                title: 'The New Fuse: Select Model'
            });
            
            if (selectedItem) {
                const modelId = selectedItem.model.id;
                this._activeModelId = modelId;
                this._selectedModel = selectedItem.model;
                
                await vscode.workspace.getConfiguration('theNewFuse').update('selectedModelId', modelId, vscode.ConfigurationTarget.Global);
                
                return {
                    providerId: selectedItem.model.vendor,
                    modelId
                };
            }
            
            return undefined;
        } catch (error) {
            console.error('Error showing model quick pick:', error);
            vscode.window.showErrorMessage(`Failed to show model picker: ${error instanceof Error ? error.message : String(error)}`);
            return undefined;
        }
    }
    
    /**
     * Get the currently selected model
     */
    public getSelectedModel(): vscode.LanguageModelChat | undefined {
        return this._selectedModel;
    }
    
    /**
     * Set the selected model
     */
    public async setSelectedModel(providerId: string, modelId: string): Promise<boolean> {
        try {
            // Get available models
            const models = await vscode.lm.selectChatModels({
                vendor: providerId
            });
            
            // Find the selected model
            const selectedModel = models.find(m => m.vendor === providerId && m.id === modelId);

            if (selectedModel) {
                this._selectedModel = selectedModel;
                this._activeProviderId = providerId;
                this._activeModelId = modelId;
                
                // Update configuration
                await vscode.workspace.getConfiguration('theNewFuse').update('selectedProviderId', providerId, vscode.ConfigurationTarget.Global);
                await vscode.workspace.getConfiguration('theNewFuse').update('selectedModelId', modelId, vscode.ConfigurationTarget.Global);
                
                console.log(`Successfully set model: ${providerId}/${modelId}`);
                return true;
            } else {
                console.warn(`Model ${modelId} from provider ${providerId} not found`);
                return false;
            }
        } catch (error) {
            console.error(`Failed to set model (${providerId}/${modelId}):`, error);
            return false;
        }
    }
    
    /**
     * Get a model by provider ID and model ID
     */
    public async getModel(providerId: string, modelId: string): Promise<vscode.LanguageModelChat | undefined> {
        try {
            const models = await vscode.lm.selectChatModels({
                vendor: providerId
            });
            
            return models.find(m => m.vendor === providerId && m.id === modelId);
        } catch (error) {
            console.error(`Failed to get model (${providerId}/${modelId}):`, error);
            return undefined;
        }
    }
    
    /**
     * Send a query to the selected model
     */
    public async queryLanguageModel(messages: vscode.LanguageModelChatMessage[]): Promise<string> {
        if (!this._selectedModel) {
            throw new Error('No language model selected');
        }
        
        try {
            const request = await this._selectedModel.sendRequest(messages, {});
            let response = '';
            
            for await (const fragment of request.text) {
                response += fragment;
            }
            
            return response;
        } catch (error) {
            console.error('Error querying language model:', error);
            throw error;
        }
    }
    
    /**
     * Send a streaming query to the selected model
     */
    public async queryStream(messages: vscode.LanguageModelChatMessage[], onFragment: (fragment: string) => void): Promise<void> {
        if (!this._selectedModel) {
            throw new Error('No language model selected');
        }
        
        try {
            const request = await this._selectedModel.sendRequest(messages, {});
            
            for await (const fragment of request.text) {
                onFragment(fragment);
            }
        } catch (error) {
            console.error('Error streaming from language model:', error);
            throw error;
        }
    }

    /**
     * Legacy streamResponse method for backward compatibility
     */
    public async streamResponse(prompt: string, onFragment: (chunk: string) => Promise<void>): Promise<void> {
        if (!this._selectedModel) {
            throw new Error('No language model selected. Please select a model first.');
        }
        
        try {
            // Get system prompt from configuration
            const systemPrompt = vscode.workspace.getConfiguration('theNewFuse').get('systemPrompt') || 'You are a helpful AI assistant.';
            
            // Create messages for the model - VS Code LM API doesn't have System role, use User for instructions
            const systemMessage = new vscode.LanguageModelChatMessage(
                vscode.LanguageModelChatMessageRole.User,
                String(systemPrompt)
            );
            
            const userMessage = new vscode.LanguageModelChatMessage(
                vscode.LanguageModelChatMessageRole.User,
                prompt
            );
            
            // Send request to the model with streaming
            const request = await this._selectedModel.sendRequest(
                [systemMessage, userMessage],
                {}
            );
            
            // Stream the response chunks
            for await (const fragment of request.text) {
                await onFragment(fragment);
            }
        } catch (error) {
            console.error('Error streaming response:', error);
            throw error;
        }
    }

    /**
     * Check the health of the currently active provider
     */
    public async checkProviderHealth(): Promise<LLMProviderHealth> {
        const providerId = this._activeProviderId;
        
        if (!providerId) {
            return {
                status: 'unhealthy',
                message: 'No LLM provider is selected',
                timestamp: Date.now()
            };
        }
        
        if (this._failedProviders.has(providerId)) {
            return {
                status: 'unhealthy',
                message: `Provider ${providerId} has failed and is disabled until reset`,
                timestamp: Date.now()
            };
        }
        
        try {
            // Use a simple diagnostic check
            const availableModels = await vscode.lm.selectChatModels({
                vendor: providerId
            });
            
            const isHealthy = availableModels && availableModels.length > 0;
            
            const health: LLMProviderHealth = {
                status: isHealthy ? 'healthy' : 'unhealthy',
                message: isHealthy ? `Provider ${providerId} is healthy with ${availableModels.length} model(s)` : `Provider ${providerId} returned no models`,
                timestamp: Date.now(),
                details: { availableModels: availableModels?.length || 0 }
            };
            
            this._healthStatus.set(providerId, health);
            return health;
        } catch (error) {
            console.error(`Error checking health for provider ${providerId}:`, error);
            
            const health: LLMProviderHealth = {
                status: 'unhealthy',
                message: `Error checking ${providerId}: ${error instanceof Error ? error.message : String(error)}`,
                timestamp: Date.now(),
                details: { error: String(error) }
            };
            
            this._healthStatus.set(providerId, health);
            this._failedProviders.add(providerId);
            return health;
        }
    }
    
    /**
     * Reset failed providers to allow them to be used again
     */
    public resetFailedProviders(): void {
        this._failedProviders.clear();
        this._healthStatus.clear();
        console.log('Reset failed LLM providers');
    }
    
    /**
     * Get the active provider ID
     */
    public get activeProviderId(): string | undefined {
        return this._activeProviderId;
    }
    
    /**
     * Get the active model ID
     */
    public get activeModelId(): string | undefined {
        return this._activeModelId;
    }
    
    /**
     * For backward compatibility with old code
     */
    public getActiveProvider(): any {
        if (this._selectedModel) {
            return {
                id: this._selectedModel.vendor,
                name: this._selectedModel.name || this._selectedModel.vendor,
                isAvailable: async () => true,
                query: async (prompt: string) => {
                    const message = new vscode.LanguageModelChatMessage(
                        vscode.LanguageModelChatMessageRole.User,
                        prompt
                    );
                    return this.queryViaModel([message]);
                }
            };
        }
        return undefined;
    }
    
    /**
     * For backward compatibility with old code
     */
    public getCurrentProvider(): any {
        return this.getActiveProvider();
    }
    
    /**
     * Get initialization error
     */
    public getInitializationError(): string | undefined {
        return this._initializationError;
    }
    
    /**
     * Query the language model with messages
     * For backward compatibility
     */
    private async queryViaModel(messages: vscode.LanguageModelChatMessage[]): Promise<string> {
        if (!this._selectedModel) {
            throw new Error('No language model selected');
        }

        try {
            const response = await this._selectedModel.sendRequest(messages, {});
            let fullText = '';
            for await (const fragment of response.text) {
                fullText += fragment;
            }
            return fullText;
        } catch (error) {
            console.error('Error querying language model:', error);
            throw error;
        }
    }
}
