import * as vscode from 'vscode';
import { LLMProviderManager } from '../../llm/LLMProviderManager';
import { ConfigurationService } from '../core/ConfigurationService';
import { NotificationService } from '../core/NotificationService';
import { LLMProvider, LLMProviderHealth } from '../../types/llm';

/**
 * Service to act as an intermediary for all LLM interactions.
 */
export class LLMService {
    private llmProviderManager: LLMProviderManager;
    private configurationService: ConfigurationService;
    private notificationService: NotificationService;

    constructor(
        llmProviderManager: LLMProviderManager,
        configurationService: ConfigurationService,
        notificationService: NotificationService
    ) {
        this.llmProviderManager = llmProviderManager;
        this.configurationService = configurationService;
        this.notificationService = notificationService;
    }

    /**
     * Sends a prompt to the currently selected LLM provider.
     * @param prompt The prompt to send.
     * @param options Additional options for the LLM request.
     * @returns A promise that resolves to the LLM's response string or null if an error occurs.
     */
    async generateResponse(prompt: string, options?: any): Promise<string | null> {
        try {
            const currentProvider = this.llmProviderManager.getCurrentProvider();
            if (!currentProvider) {
                this.notificationService.showErrorMessage('No LLM provider selected. Please select a provider.');
                return null;
            }

            const maxTokens = await this.configurationService.get<number>('llm.maxTokens', 2048);
            const temperature = await this.configurationService.get<number>('llm.temperature', 0.7);

            const requestOptions = {
                ...options,
                maxTokens,
                temperature,
            };

            // Assuming the provider has a 'generateResponse' or similar method
            // This might need adjustment based on the actual LLMProvider interface
            if (typeof (currentProvider as any).generateResponse === 'function') {
                return await (currentProvider as any).generateResponse(prompt, requestOptions);
            } else if (typeof (currentProvider as any).chat === 'function') { // Fallback for providers with a 'chat' method
                 const messages = [{ role: 'user', content: prompt }];
                 const response = await (currentProvider as any).chat(messages, requestOptions);
                 return response?.content ?? null;
            } else {
                this.notificationService.showErrorMessage(`The selected LLM provider (${currentProvider.name}) does not support direct response generation or chat.`);
                console.error(`Provider ${currentProvider.name} does not have a compatible generation method.`);
                return null;
            }
        } catch (error: any) {
            this.notificationService.showErrorMessage(`Error generating response: ${error.message}`);
            console.error('Error in LLMService.generateResponse:', error);
            return null;
        }
    }

    /**
     * Gets the list of available LLM providers.
     * @returns An array of LLMProvider objects.
     */
    getAvailableProviders(): LLMProvider[] {
        return this.llmProviderManager.getProviders();
    }

    /**
     * Selects an LLM provider by its ID.
     * @param providerId The ID of the provider to select.
     * @returns True if the provider was selected successfully, false otherwise.
     */
    async selectProvider(providerId: string): Promise<boolean> {
        try {
            await this.llmProviderManager.selectProvider(providerId);
            const provider = this.llmProviderManager.getProviderById(providerId);
            if (provider) {
                this.notificationService.showInformationMessage(`LLM Provider set to: ${provider.name}`);
                return true;
            }
            return false;
        } catch (error: any) {
            this.notificationService.showErrorMessage(`Error selecting provider: ${error.message}`);
            return false;
        }
    }

    /**
     * Gets the currently selected LLM provider.
     * @returns The current LLMProvider or undefined if none is selected.
     */
    getCurrentProvider(): LLMProvider | undefined {
        return this.llmProviderManager.getCurrentProvider();
    }

    /**
     * Selects an LLM model for the current provider.
     * @param modelId The ID of the model to select.
     * @returns True if the model was selected successfully, false otherwise.
     */
    async selectModel(modelId: string): Promise<boolean> {
        const currentProvider = this.llmProviderManager.getCurrentProvider();
        if (!currentProvider) {
            this.notificationService.showErrorMessage('No LLM provider selected. Cannot select a model.');
            return false;
        }
        try {
            // Assuming LLMProviderManager has a method to set the model for the current provider
            // This might involve updating configuration or an internal state in LLMProviderManager
            await this.llmProviderManager.setCurrentProviderModel(modelId);
            this.notificationService.showInformationMessage(`Model set to: ${modelId} for provider ${currentProvider.name}`);
            return true;
        } catch (error: any) {
            this.notificationService.showErrorMessage(`Error selecting model: ${error.message}`);
            return false;
        }
    }

    /**
     * Checks the health of the current LLM provider.
     * @returns A promise that resolves to the health status of the provider.
     */
    async checkProviderHealth(): Promise<LLMProviderHealth | null> {
        const currentProvider = this.llmProviderManager.getCurrentProvider();
        if (!currentProvider) {
            this.notificationService.showErrorMessage('No LLM provider selected to check health.');
            return null;
        }
        try {
            return await this.llmProviderManager.checkProviderHealth(currentProvider.id);
        } catch (error: any) {
            this.notificationService.showErrorMessage(`Error checking provider health: ${error.message}`);
            return {
                providerId: currentProvider.id,
                isHealthy: false,
                details: `Error: ${error.message}`,
                timestamp: new Date().toISOString(),
            };
        }
    }

    /**
     * Gets the available models for the current provider.
     * @returns A promise that resolves to an array of model IDs or an empty array if an error occurs or no provider is selected.
     */
    async getAvailableModels(): Promise<string[]> {
        const currentProvider = this.llmProviderManager.getCurrentProvider();
        if (!currentProvider) {
            this.notificationService.showInformationMessage('No LLM provider selected to fetch models.');
            return [];
        }
        try {
            // Assuming LLMProviderManager or the provider itself has a method to list models
            if (typeof currentProvider.getModels === 'function') {
                return await currentProvider.getModels();
            }
            // Fallback if getModels is not directly on provider, but on manager
            const models = await this.llmProviderManager.getProviderModels(currentProvider.id);
            return models.map(m => typeof m === 'string' ? m : m.id); // Adjust based on actual model structure
        } catch (error: any) {
            this.notificationService.showErrorMessage(`Error fetching models for ${currentProvider.name}: ${error.message}`);
            return [];
        }
    }
}