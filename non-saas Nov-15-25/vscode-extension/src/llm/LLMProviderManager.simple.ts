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
 * LLM Provider Manager
 * Enhanced provider management that extends VS Code's built-in LLM support
 * This is the simple, working version adapted from ai-chat-extension
 */
export class LLMProviderManager {
    private _activeProviderId: string | undefined;
    private _failedProviders: Set<string> = new Set();
    private _healthStatus: Map<string, LLMProviderHealth> = new Map();
    
    constructor(
        private readonly _context: vscode.ExtensionContext
    ) {
        // Load the last selected provider from configuration (using theNewFuse config)
        this._activeProviderId = vscode.workspace.getConfiguration('theNewFuse').get<string>('selectedProviderId');
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
            
            // Group models by provider for better display (use vendor instead of providerId)
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
                    detail: models.map(m => m.id).join(', '), // use id instead of modelId
                    providerId
                };
            });
            
            const selectedItem = await vscode.window.showQuickPick(quickPickItems, {
                placeHolder: 'Select an LLM provider',
                title: 'The New Fuse: Select Provider'
            });
            
            if (selectedItem) {
                this._activeProviderId = selectedItem.providerId;
                await vscode.workspace.getConfiguration('theNewFuse').update('selectedProviderId', selectedItem.providerId, vscode.ConfigurationTarget.Global);
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
                vendor: provId // use vendor instead of providerId
            });
            
            if (!availableModels || availableModels.length === 0) {
                vscode.window.showWarningMessage(`No models found for provider ${provId}`);
                return undefined;
            }
            
            // Create quick pick items for models
            const quickPickItems = availableModels.map(model => {
                return {
                    label: model.id, // use id instead of modelId
                    description: `${model.vendor} - ${model.name}`, // use name instead of label
                    model
                };
            });
            
            const selectedItem = await vscode.window.showQuickPick(quickPickItems, {
                placeHolder: 'Select an LLM model',
                title: 'The New Fuse: Select Model'
            });
            
            if (selectedItem) {
                const modelId = selectedItem.model.id;
                await vscode.workspace.getConfiguration('theNewFuse').update('selectedModelId', modelId, vscode.ConfigurationTarget.Global);
                return {
                    providerId: selectedItem.model.vendor, // use vendor instead of providerId
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
            // Use a simple diagnostic check (use vendor instead of providerId)
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
     * Set the active provider ID
     */
    public set activeProviderId(id: string | undefined) {
        this._activeProviderId = id;
        if (id) {
            vscode.workspace.getConfiguration('theNewFuse').update('selectedProviderId', id, vscode.ConfigurationTarget.Global);
        }
    }

    // Additional methods needed for backward compatibility with the complex version
    
    /**
     * Get the currently selected model
     */
    public async getSelectedModel(): Promise<vscode.LanguageModelChat | undefined> {
        if (!this._activeProviderId) {
            return undefined;
        }
        
        try {
            const models = await vscode.lm.selectChatModels({
                vendor: this._activeProviderId
            });
            
            const modelId = vscode.workspace.getConfiguration('theNewFuse').get<string>('selectedModelId');
            if (modelId) {
                return models.find(m => m.id === modelId);
            }
            
            // Return first available model if no specific model selected
            return models[0];
        } catch (error) {
            console.error('Error getting selected model:', error);
            return undefined;
        }
    }

    /**
     * Legacy streamResponse method for backward compatibility
     */
    public async streamResponse(prompt: string, onFragment: (chunk: string) => Promise<void>): Promise<void> {
        const selectedModel = await this.getSelectedModel();
        
        if (!selectedModel) {
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
            const request = await selectedModel.sendRequest(
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
     * For backward compatibility - get active provider object
     */
    public async getActiveProvider(): Promise<any> {
        const selectedModel = await this.getSelectedModel();
        if (selectedModel) {
            return {
                id: selectedModel.vendor,
                name: selectedModel.name || selectedModel.vendor,
                isAvailable: async () => true
            };
        }
        return undefined;
    }
}
