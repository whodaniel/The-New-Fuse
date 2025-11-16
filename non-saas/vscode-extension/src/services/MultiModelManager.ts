import * as vscode from 'vscode';
import { ApiClient } from './ApiClient';
import { ConfigurationManager } from '../config/ConfigurationManager';

export interface ModelProvider {
    id: string;
    name: string;
    type: 'openai' | 'anthropic' | 'google' | 'local' | 'custom';
    baseUrl?: string;
    apiKey?: string;
    models: ModelInfo[];
    capabilities: ModelCapability[];
    status: 'active' | 'inactive' | 'error';
    priority: number;
}

export interface ModelInfo {
    id: string;
    name: string;
    provider: string;
    contextWindow: number;
    maxTokens: number;
    capabilities: string[];
    costPerToken?: number;
    latency?: number;
    status: 'available' | 'busy' | 'offline';
}

export interface ModelCapability {
    type: 'text' | 'code' | 'analysis' | 'vision' | 'audio';
    strength: 'low' | 'medium' | 'high' | 'expert';
    specializations: string[];
}

export interface ModelResponse {
    content: string;
    model: string;
    provider: string;
    tokensUsed: number;
    responseTime: number;
    confidence?: number;
    metadata?: Record<string, any>;
}

export class MultiModelManager {
    private apiClient: ApiClient;
    private configManager: ConfigurationManager;
    private providers = new Map<string, ModelProvider>();
    private currentProvider: string;
    private modelPerformance = new Map<string, ModelPerformance>();

    constructor(apiClient: ApiClient, configManager: ConfigurationManager) {
        this.apiClient = apiClient;
        this.configManager = configManager;
        this.currentProvider = this.configManager.getLLMProvider();
        this.initializeProviders();
    }

    /**
     * Initialize available model providers
     */
    private async initializeProviders(): Promise<void> {
        try {
            // Load providers from TNF backend
            const backendProviders = await this.loadProvidersFromBackend();

            for (const provider of backendProviders) {
                this.providers.set(provider.id, provider);
            }

            // Add default providers if none available
            if (this.providers.size === 0) {
                await this.createDefaultProviders();
            }

            console.log(`Initialized ${this.providers.size} model providers`);
        } catch (error) {
            console.error('Error initializing providers:', error);
            await this.createDefaultProviders();
        }
    }

    /**
     * Load providers from TNF backend
     */
    private async loadProvidersFromBackend(): Promise<ModelProvider[]> {
        try {
            const response = await this.apiClient.axiosInstance.get('/providers/models');
            return response.data.providers || [];
        } catch (error) {
            console.error('Error loading providers from backend:', error);
            return [];
        }
    }

    /**
     * Create default providers as fallback
     */
    private async createDefaultProviders(): Promise<void> {
        const defaultProviders: ModelProvider[] = [
            {
                id: 'vscode',
                name: 'VSCode Local',
                type: 'local',
                models: [
                    {
                        id: 'vscode-default',
                        name: 'VSCode Assistant',
                        provider: 'vscode',
                        contextWindow: 4000,
                        maxTokens: 2000,
                        capabilities: ['text', 'code'],
                        status: 'available'
                    }
                ],
                capabilities: [
                    {
                        type: 'text',
                        strength: 'medium',
                        specializations: ['general', 'coding']
                    }
                ],
                status: 'active',
                priority: 1
            },
            {
                id: 'openai',
                name: 'OpenAI',
                type: 'openai',
                models: [
                    {
                        id: 'gpt-4',
                        name: 'GPT-4',
                        provider: 'openai',
                        contextWindow: 8192,
                        maxTokens: 4096,
                        capabilities: ['text', 'code', 'analysis'],
                        status: 'available'
                    },
                    {
                        id: 'gpt-3.5-turbo',
                        name: 'GPT-3.5 Turbo',
                        provider: 'openai',
                        contextWindow: 4096,
                        maxTokens: 2048,
                        capabilities: ['text', 'code'],
                        status: 'available'
                    }
                ],
                capabilities: [
                    {
                        type: 'text',
                        strength: 'high',
                        specializations: ['creative', 'analysis', 'coding']
                    }
                ],
                status: 'active',
                priority: 2
            }
        ];

        for (const provider of defaultProviders) {
            this.providers.set(provider.id, provider);
        }
    }

    /**
     * Get all available providers
     */
    getProviders(): ModelProvider[] {
        return Array.from(this.providers.values())
            .filter(p => p.status === 'active')
            .sort((a, b) => b.priority - a.priority);
    }

    /**
     * Get current provider
     */
    getCurrentProvider(): ModelProvider | undefined {
        return this.providers.get(this.currentProvider);
    }

    /**
     * Switch to a different provider
     */
    async switchProvider(providerId: string): Promise<boolean> {
        const provider = this.providers.get(providerId);
        if (!provider || provider.status !== 'active') {
            throw new Error(`Provider ${providerId} is not available`);
        }

        try {
            // Test provider connectivity
            await this.testProvider(provider);

            // Update current provider
            this.currentProvider = providerId;
            await this.configManager.updateConfig('llmProvider', providerId);

            // Notify about provider switch
            vscode.window.showInformationMessage(`Switched to ${provider.name}`);

            return true;
        } catch (error) {
            console.error('Error switching provider:', error);
            vscode.window.showErrorMessage(`Failed to switch provider: ${error}`);
            return false;
        }
    }

    /**
     * Get best model for a specific task
     */
    async getBestModelForTask(taskType: string, content?: string): Promise<ModelInfo | null> {
        const availableProviders = this.getProviders();

        for (const provider of availableProviders) {
            const suitableModel = provider.models.find(model => {
                const hasCapability = model.capabilities.includes(taskType);
                const hasCapacity = model.status === 'available';

                // Check if model can handle content size
                if (content && content.length > model.contextWindow) {
                    return null;
                }

                return hasCapability && hasCapacity;
            });

            if (suitableModel) {
                return suitableModel;
            }
        }

        return null;
    }

    /**
     * Send request to specific model
     */
    async sendToModel(modelId: string, messages: any[], options?: any): Promise<ModelResponse> {
        const startTime = Date.now();

        try {
            // Find the model
            let targetModel: ModelInfo | null = null;
            for (const provider of this.providers.values()) {
                targetModel = provider.models.find(m => m.id === modelId) || null;
                if (targetModel) break;
            }

            if (!targetModel) {
                throw new Error(`Model ${modelId} not found`);
            }

            // Send request to backend
            const response = await this.apiClient.axiosInstance.post('/models/request', {
                modelId,
                messages,
                options: options || {},
                provider: targetModel.provider
            });

            const responseTime = Date.now() - startTime;

            // Track performance
            this.trackModelPerformance(modelId, responseTime, true);

            return {
                content: response.data.content,
                model: modelId,
                provider: targetModel.provider,
                tokensUsed: response.data.tokensUsed || 0,
                responseTime,
                confidence: response.data.confidence,
                metadata: response.data.metadata
            };

        } catch (error) {
            const responseTime = Date.now() - startTime;
            this.trackModelPerformance(modelId, responseTime, false);

            console.error('Error sending to model:', error);
            throw error;
        }
    }

    /**
     * Compare responses from multiple models
     */
    async compareModels(messages: any[], modelIds: string[]): Promise<ModelResponse[]> {
        const promises = modelIds.map(modelId =>
            this.sendToModel(modelId, messages).catch(error => ({
                content: `Error: ${error.message}`,
                model: modelId,
                provider: 'unknown',
                tokensUsed: 0,
                responseTime: 0,
                error: true
            }))
        );

        return Promise.all(promises);
    }

    /**
     * Get model performance statistics
     */
    getModelPerformance(modelId: string): ModelPerformance | undefined {
        return this.modelPerformance.get(modelId);
    }

    /**
     * Get all model performance data
     */
    getAllPerformanceData(): Map<string, ModelPerformance> {
        return new Map(this.modelPerformance);
    }

    /**
     * Test provider connectivity
     */
    private async testProvider(provider: ModelProvider): Promise<void> {
        try {
            const response = await this.apiClient.axiosInstance.post('/providers/test', {
                providerId: provider.id,
                type: provider.type
            });

            if (!response.data.success) {
                throw new Error(response.data.error || 'Provider test failed');
            }
        } catch (error) {
            throw new Error(`Provider ${provider.name} is not accessible: ${error}`);
        }
    }

    /**
     * Track model performance
     */
    private trackModelPerformance(modelId: string, responseTime: number, success: boolean): void {
        const current = this.modelPerformance.get(modelId) || {
            modelId,
            totalRequests: 0,
            successfulRequests: 0,
            averageResponseTime: 0,
            lastUsed: new Date()
        };

        current.totalRequests++;
        if (success) {
            current.successfulRequests++;
        }

        // Update average response time
        current.averageResponseTime = (
            current.averageResponseTime * (current.totalRequests - 1) + responseTime
        ) / current.totalRequests;

        current.lastUsed = new Date();

        this.modelPerformance.set(modelId, current);
    }

    /**
     * Add custom provider
     */
    async addCustomProvider(provider: Omit<ModelProvider, 'status' | 'priority'>): Promise<void> {
        const newProvider: ModelProvider = {
            ...provider,
            status: 'active',
            priority: Math.max(...Array.from(this.providers.values()).map(p => p.priority)) + 1
        };

        this.providers.set(provider.id, newProvider);

        // Save to backend
        try {
            await this.apiClient.axiosInstance.post('/providers/custom', newProvider);
        } catch (error) {
            console.error('Error saving custom provider to backend:', error);
        }
    }

    /**
     * Remove provider
     */
    async removeProvider(providerId: string): Promise<void> {
        if (this.currentProvider === providerId) {
            // Switch to default provider
            const defaultProvider = this.providers.get('vscode');
            if (defaultProvider) {
                await this.switchProvider('vscode');
            }
        }

        this.providers.delete(providerId);

        // Remove from backend
        try {
            await this.apiClient.axiosInstance.delete(`/providers/${providerId}`);
        } catch (error) {
            console.error('Error removing provider from backend:', error);
        }
    }

    /**
     * Update provider configuration
     */
    async updateProvider(providerId: string, updates: Partial<ModelProvider>): Promise<void> {
        const provider = this.providers.get(providerId);
        if (!provider) {
            throw new Error(`Provider ${providerId} not found`);
        }

        const updatedProvider = { ...provider, ...updates };
        this.providers.set(providerId, updatedProvider);

        // Update in backend
        try {
            await this.apiClient.axiosInstance.put(`/providers/${providerId}`, updatedProvider);
        } catch (error) {
            console.error('Error updating provider in backend:', error);
        }
    }

    /**
     * Get provider recommendations for task
     */
    async getProviderRecommendations(taskType: string, content?: string): Promise<ModelProvider[]> {
        const providers = this.getProviders();
        const recommendations: ModelProvider[] = [];

        for (const provider of providers) {
            const hasCapability = provider.capabilities.some(cap =>
                cap.type === taskType || cap.specializations.includes(taskType)
            );

            if (hasCapability) {
                recommendations.push(provider);
            }
        }

        return recommendations.sort((a, b) => {
            // Sort by capability strength and priority
            const aStrength = a.capabilities.find(c => c.type === taskType)?.strength || 'low';
            const bStrength = b.capabilities.find(c => c.type === taskType)?.strength || 'low';

            const strengthOrder = { 'expert': 4, 'high': 3, 'medium': 2, 'low': 1 };

            if (strengthOrder[aStrength] !== strengthOrder[bStrength]) {
                return strengthOrder[bStrength] - strengthOrder[aStrength];
            }

            return b.priority - a.priority;
        });
    }
}

interface ModelPerformance {
    modelId: string;
    totalRequests: number;
    successfulRequests: number;
    averageResponseTime: number;
    lastUsed: Date;
}