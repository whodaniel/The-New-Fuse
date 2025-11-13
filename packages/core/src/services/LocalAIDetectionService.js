/**
 * @fileoverview Production-ready local AI detection and management service
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { ServiceState } from '../constants/types';
import { logger } from '../utils/logger';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);
let LocalAIDetectionService = class LocalAIDetectionService {
    state = ServiceState.UNINITIALIZED;
    providers = new Map();
    detectionInterval;
    detectionIntervalMs = 60000; // Check every minute
    constructor() {
        logger.setContext('LocalAIDetectionService');
        this.initializeDefaultProviders();
    }
    async start() {
        if (this.state === ServiceState.RUNNING) {
            logger.warn('LocalAIDetectionService is already running');
            return;
        }
        try {
            this.state = ServiceState.INITIALIZING;
            logger.info('Starting LocalAIDetectionService');
            // Initial detection
            await this.detectAllProviders();
            // Start periodic detection
            this.detectionInterval = setInterval(() => {
                this.detectAllProviders().catch(error => {
                    logger.error('Error during periodic AI detection', error);
                });
            }, this.detectionIntervalMs);
            this.state = ServiceState.RUNNING;
            logger.info('LocalAIDetectionService started successfully');
        }
        catch (error) {
            this.state = ServiceState.ERROR;
            logger.error('Failed to start LocalAIDetectionService', error);
            throw error;
        }
    }
    async stop() {
        if (this.state === ServiceState.STOPPED) {
            logger.warn('LocalAIDetectionService is already stopped');
            return;
        }
        try {
            this.state = ServiceState.STOPPING;
            logger.info('Stopping LocalAIDetectionService');
            if (this.detectionInterval) {
                clearInterval(this.detectionInterval);
                this.detectionInterval = undefined;
            }
            this.state = ServiceState.STOPPED;
            logger.info('LocalAIDetectionService stopped successfully');
        }
        catch (error) {
            this.state = ServiceState.ERROR;
            logger.error('Failed to stop LocalAIDetectionService', error);
            throw error;
        }
    }
    getState() {
        return this.state;
    }
    async detect() {
        await this.detectAllProviders();
        return this.detectAvailableAIs();
    }
    detectAvailableAIs() {
        return Array.from(this.providers.values()).filter(provider => provider.isAvailable);
    }
    getAllProviders() {
        return Array.from(this.providers.values());
    }
    getProvider(name) {
        return this.providers.get(name);
    }
    addProvider(provider) {
        this.providers.set(provider.name, {
            ...provider,
            isAvailable: false,
            lastChecked: new Date(),
        });
        logger.info('Added AI provider', { name: provider.name, type: provider.type });
        // Check availability immediately
        this.checkProviderAvailability(provider).then(isAvailable => {
            const updatedProvider = this.providers.get(provider.name);
            if (updatedProvider) {
                updatedProvider.isAvailable = isAvailable;
                updatedProvider.lastChecked = new Date();
            }
        }).catch(error => {
            logger.error('Failed to check provider availability', error, { provider: provider.name });
        });
    }
    removeProvider(name) {
        const removed = this.providers.delete(name);
        if (removed) {
            logger.info('Removed AI provider', { name });
        }
        return removed;
    }
    async checkProviderAvailability(provider) {
        try {
            logger.debug('Checking provider availability', { name: provider.name, type: provider.type });
            switch (provider.type) {
                case 'ollama':
                    return await this.checkOllamaAvailability(provider);
                case 'lmstudio':
                    return await this.checkLMStudioAvailability(provider);
                case 'localai':
                    return await this.checkLocalAIAvailability(provider);
                case 'custom':
                    return await this.checkCustomProviderAvailability(provider);
                default:
                    logger.warn('Unknown provider type', { name: provider.name, type: provider.type });
                    return false;
            }
        }
        catch (error) {
            logger.debug('Provider availability check failed', { error: error, provider: provider.name });
            return false;
        }
    }
    async getProviderModels(providerName) {
        const provider = this.providers.get(providerName);
        if (!provider || !provider.isAvailable) {
            return [];
        }
        try {
            switch (provider.type) {
                case 'ollama':
                    return await this.getOllamaModels(provider);
                case 'lmstudio':
                    return await this.getLMStudioModels(provider);
                case 'localai':
                    return await this.getLocalAIModels(provider);
                default:
                    return provider.models || [];
            }
        }
        catch (error) {
            logger.error('Failed to get provider models', error, { provider: providerName });
            return [];
        }
    }
    initializeDefaultProviders() {
        const defaultProviders = [
            {
                name: 'ollama',
                type: 'ollama',
                endpoint: 'http://localhost:11434',
                command: 'ollama',
                checkCommand: 'ollama list',
                models: [],
            },
            {
                name: 'lmstudio',
                type: 'lmstudio',
                endpoint: 'http://localhost:1234',
                command: 'lms',
                checkCommand: 'curl -s http://localhost:1234/v1/models',
                models: [],
            },
            {
                name: 'localai',
                type: 'localai',
                endpoint: 'http://localhost:8080',
                command: 'local-ai',
                checkCommand: 'curl -s http://localhost:8080/v1/models',
                models: [],
            },
        ];
        defaultProviders.forEach(provider => {
            this.providers.set(provider.name, {
                ...provider,
                isAvailable: false,
                lastChecked: new Date(),
            });
        });
        logger.info('Initialized default AI providers', { count: defaultProviders.length });
    }
    async detectAllProviders() {
        const providers = Array.from(this.providers.values());
        const checkPromises = providers.map(async (provider) => {
            try {
                const isAvailable = await this.checkProviderAvailability(provider);
                provider.isAvailable = isAvailable;
                provider.lastChecked = new Date();
                if (isAvailable) {
                    // Update models list
                    const models = await this.getProviderModels(provider.name);
                    provider.models = models;
                }
            }
            catch (error) {
                logger.debug('Provider detection failed', { error: error, provider: provider.name });
                provider.isAvailable = false;
                provider.lastChecked = new Date();
            }
        });
        await Promise.allSettled(checkPromises);
        const availableCount = providers.filter(p => p.isAvailable).length;
        logger.debug('AI provider detection completed', {
            total: providers.length,
            available: availableCount
        });
    }
    async checkOllamaAvailability(provider) {
        try {
            // Try to execute ollama list command
            if (provider.checkCommand) {
                await execAsync(provider.checkCommand, { timeout: 5000 });
                return true;
            }
            // Fallback to HTTP check
            const response = await this.makeHttpRequest(`${provider.endpoint}/api/tags`);
            return response.ok;
        }
        catch (error) {
            return false;
        }
    }
    async checkLMStudioAvailability(provider) {
        try {
            const response = await this.makeHttpRequest(`${provider.endpoint}/v1/models`);
            return response.ok;
        }
        catch (error) {
            return false;
        }
    }
    async checkLocalAIAvailability(provider) {
        try {
            const response = await this.makeHttpRequest(`${provider.endpoint}/v1/models`);
            return response.ok;
        }
        catch (error) {
            return false;
        }
    }
    async checkCustomProviderAvailability(provider) {
        try {
            if (provider.checkCommand) {
                await execAsync(provider.checkCommand, { timeout: 5000 });
                return true;
            }
            if (provider.endpoint) {
                const response = await this.makeHttpRequest(provider.endpoint);
                return response.ok;
            }
            return false;
        }
        catch (error) {
            return false;
        }
    }
    async getOllamaModels(provider) {
        try {
            const response = await this.makeHttpRequest(`${provider.endpoint}/api/tags`);
            if (!response.ok)
                return [];
            const data = await response.json();
            return data.models?.map((model) => model.name) || [];
        }
        catch (error) {
            return [];
        }
    }
    async getLMStudioModels(provider) {
        try {
            const response = await this.makeHttpRequest(`${provider.endpoint}/v1/models`);
            if (!response.ok)
                return [];
            const data = await response.json();
            return data.data?.map((model) => model.id) || [];
        }
        catch (error) {
            return [];
        }
    }
    async getLocalAIModels(provider) {
        try {
            const response = await this.makeHttpRequest(`${provider.endpoint}/v1/models`);
            if (!response.ok)
                return [];
            const data = await response.json();
            return data.data?.map((model) => model.id) || [];
        }
        catch (error) {
            return [];
        }
    }
    async makeHttpRequest(url, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
            });
            clearTimeout(timeoutId);
            return response;
        }
        catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }
    // Utility methods for external use
    async testProvider(providerName) {
        const provider = this.providers.get(providerName);
        if (!provider) {
            return {
                available: false,
                models: [],
                responseTime: 0,
                error: 'Provider not found',
            };
        }
        const startTime = Date.now();
        try {
            const available = await this.checkProviderAvailability(provider);
            const models = available ? await this.getProviderModels(providerName) : [];
            const responseTime = Date.now() - startTime;
            return {
                available,
                models,
                responseTime,
            };
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            return {
                available: false,
                models: [],
                responseTime,
                error: error.message,
            };
        }
    }
    getProviderStats() {
        const providers = Array.from(this.providers.values());
        const available = providers.filter(p => p.isAvailable);
        const byType = providers.reduce((acc, p) => {
            acc[p.type] = (acc[p.type] || 0) + 1;
            return acc;
        }, {});
        return {
            total: providers.length,
            available: available.length,
            unavailable: providers.length - available.length,
            byType,
            lastCheck: Math.min(...providers.map(p => p.lastChecked?.getTime() || 0)),
        };
    }
    /**
     * Detect and create agent DTOs from available local AI providers
     */
    async detectAndCreateAgents(userId) {
        logger.info('Detecting and creating agents for user', { userId });
        const availableProviders = this.detectAvailableAIs();
        const agents = [];
        for (const provider of availableProviders) {
            try {
                const models = await this.getProviderModels(provider.name);
                const agentDto = {
                    name: `${provider.name.charAt(0).toUpperCase() + provider.name.slice(1)} Agent`,
                    type: provider.type,
                    provider: provider.name,
                    endpoint: provider.endpoint,
                    capabilities: this.getCapabilitiesForProvider(provider),
                    models: models,
                    metadata: {
                        localAI: true,
                        detectedAt: new Date().toISOString(),
                        providerType: provider.type,
                    },
                    configuration: {
                        provider: provider.name,
                        endpoint: provider.endpoint,
                        localAI: true,
                        models: models,
                    }
                };
                agents.push(agentDto);
            }
            catch (error) {
                logger.error('Failed to create agent DTO for provider', error, { providerName: provider.name });
            }
        }
        return agents;
    }
    /**
     * Create default system agents for all detected local AI providers
     */
    async createDefaultSystemAgents() {
        logger.info('Creating default system agents for all detected local AIs');
        const availableProviders = this.detectAvailableAIs();
        const systemAgents = [];
        for (const provider of availableProviders) {
            try {
                const models = await this.getProviderModels(provider.name);
                const systemAgentDto = {
                    name: `System ${provider.name.charAt(0).toUpperCase() + provider.name.slice(1)} Agent`,
                    type: provider.type,
                    provider: provider.name,
                    endpoint: provider.endpoint,
                    capabilities: this.getSystemCapabilitiesForProvider(provider),
                    models: models,
                    metadata: {
                        localAI: true,
                        system: true,
                        detectedAt: new Date().toISOString(),
                        providerType: provider.type,
                    },
                    configuration: {
                        provider: provider.name,
                        endpoint: provider.endpoint,
                        localAI: true,
                        system: true,
                        models: models,
                    }
                };
                systemAgents.push(systemAgentDto);
            }
            catch (error) {
                logger.error('Failed to create system agent DTO for provider', error, { providerName: provider.name });
            }
        }
        return systemAgents;
    }
    /**
     * Get capabilities for a specific provider type
     */
    getCapabilitiesForProvider(provider) {
        const baseCapabilities = ['chat', 'code_generation', 'analysis'];
        switch (provider.type) {
            case 'ollama':
                return [...baseCapabilities, 'code_review', 'documentation'];
            case 'lmstudio':
                return [...baseCapabilities, 'code_completion', 'debugging'];
            case 'localai':
                return [...baseCapabilities, 'integration', 'automation'];
            case 'custom':
                return baseCapabilities;
            default:
                return baseCapabilities;
        }
    }
    /**
     * Get system-level capabilities for a specific provider type
     */
    getSystemCapabilitiesForProvider(provider) {
        const systemCapabilities = ['task_execution', 'workflow', 'automation'];
        const providerCapabilities = this.getCapabilitiesForProvider(provider);
        return [...systemCapabilities, ...providerCapabilities];
    }
};
LocalAIDetectionService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], LocalAIDetectionService);
export { LocalAIDetectionService };
//# sourceMappingURL=LocalAIDetectionService.js.map