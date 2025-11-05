var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@the-new-fuse/database';
import { Logger } from '@nestjs/common';
let LLMProviderService = class LLMProviderService {
    llmRegistry;
    prisma;
    logger = new Logger('LLMProviderService');
    constructor(llmRegistry, prisma) {
        this.llmRegistry = llmRegistry;
        this.prisma = prisma;
    }
    async findAll() {
        try {
            // Get providers from database
            const providers = await this.prisma.lLMConfig.findMany({
                where: { enabled: true },
                orderBy: { priority: 'desc' },
                select: {
                    id: true,
                    name: true,
                    provider: true,
                    modelName: true,
                    priority: true,
                    apiEndpoint: true,
                    isCustom: true
                }
            });
            return providers.map(provider => ({
                id: provider.id,
                name: provider.name,
                provider: provider.provider,
                modelName: provider.modelName,
                isDefault: provider.priority === 1,
                isCustom: provider.isCustom || false,
                apiEndpoint: provider.apiEndpoint ?? undefined
            }));
        }
        catch (error) {
            this.logger.error('Failed to fetch LLM providers', error);
            throw error;
        }
    }
    async create(dto) {
        try {
            // Create new provider configuration in database
            const newProvider = await this.prisma.lLMConfig.create({
                data: {
                    name: dto.name,
                    provider: dto.provider,
                    modelName: dto.modelName,
                    apiKey: dto.apiKey, // Encrypt in actual implementation
                    apiEndpoint: dto.apiEndpoint,
                    isCustom: true,
                    enabled: true,
                    priority: 10, // Lower priority than default providers
                    retryConfig: {
                        maxAttempts: 3,
                        initialDelay: 1000,
                        maxDelay: 10000,
                        backoffFactor: 2
                    }
                }
            });
            // Register the provider with the LLM registry
            await this.llmRegistry.registerProvider(newProvider.id, {
                provider: newProvider.provider,
                model: newProvider.modelName,
                apiKey: newProvider.apiKey,
                apiEndpoint: newProvider.apiEndpoint ?? undefined,
                enabled: true,
                priority: newProvider.priority,
                modelName: newProvider.modelName
            });
            return {
                id: newProvider.id,
                name: newProvider.name,
                provider: newProvider.provider,
                modelName: newProvider.modelName,
                isCustom: true,
                apiEndpoint: newProvider.apiEndpoint ?? undefined
            };
        }
        catch (error) {
            this.logger.error('Failed to create LLM provider', error);
            throw error;
        }
    }
    async findById(id) {
        try {
            const provider = await this.prisma.lLMConfig.findUnique({
                where: { id }
            });
            if (!provider) {
                throw new Error(`Provider with id ${id} not found`);
            }
            return {
                id: provider.id,
                name: provider.name,
                provider: provider.provider,
                modelName: provider.modelName,
                isDefault: provider.priority === 1,
                isCustom: provider.isCustom || false,
                apiEndpoint: provider.apiEndpoint ?? undefined
            };
        }
        catch (error) {
            this.logger.error(`Failed to find LLM provider with id ${id}`, error);
            throw error;
        }
    }
    async update(id, dto) {
        try {
            const provider = await this.prisma.lLMConfig.update({
                where: { id },
                data: {
                    name: dto.name,
                    provider: dto.provider,
                    modelName: dto.modelName,
                    apiKey: dto.apiKey, // Encrypt in actual implementation
                    apiEndpoint: dto.apiEndpoint
                }
            });
            // Re-register the provider with updated config
            await this.llmRegistry.unregisterProvider(id);
            await this.llmRegistry.registerProvider(id, {
                provider: provider.provider,
                model: provider.modelName,
                apiKey: provider.apiKey,
                apiEndpoint: provider.apiEndpoint ?? undefined,
                enabled: provider.enabled,
                priority: provider.priority,
                modelName: provider.modelName
            });
            return {
                id: provider.id,
                name: provider.name,
                provider: provider.provider,
                modelName: provider.modelName,
                isDefault: provider.priority === 1,
                isCustom: provider.isCustom || false,
                apiEndpoint: provider.apiEndpoint ?? undefined
            };
        }
        catch (error) {
            this.logger.error(`Failed to update LLM provider with id ${id}`, error);
            throw error;
        }
    }
    async delete(id) {
        try {
            // Check if it's a custom provider
            const provider = await this.prisma.lLMConfig.findUnique({
                where: { id }
            });
            if (!provider || !provider.isCustom) {
                throw new Error('Only custom providers can be deleted');
            }
            // Remove from LLM registry
            await this.llmRegistry.unregisterProvider(id);
            // Delete from database
            await this.prisma.lLMConfig.delete({
                where: { id }
            });
        }
        catch (error) {
            this.logger.error(`Failed to delete LLM provider with id ${id}`, error);
            throw error;
        }
    }
    async setDefault(id) {
        try {
            // Reset all providers to non-default
            await this.prisma.lLMConfig.updateMany({
                data: {
                    priority: 10
                }
            });
            // Set the selected provider as default
            const provider = await this.prisma.lLMConfig.update({
                where: { id },
                data: {
                    priority: 1
                }
            });
            return {
                id: provider.id,
                name: provider.name,
                provider: provider.provider,
                modelName: provider.modelName,
                isDefault: true,
                isCustom: provider.isCustom || false,
                apiEndpoint: provider.apiEndpoint ?? undefined
            };
        }
        catch (error) {
            this.logger.error(`Failed to set LLM provider ${id} as default`, error);
            throw error;
        }
    }
    async registerClaudeCodeCLI() {
        try {
            // Check if Claude Code CLI is available
            const isAvailable = true; // Mock implementation
            if (!isAvailable) {
                this.logger.warn('Claude Code CLI is not available on this system');
                return null;
            }
            // Check if already registered
            const existingProvider = await this.prisma.lLMConfig.findFirst({
                where: {
                    provider: 'local',
                    name: 'Claude Code CLI'
                }
            });
            if (existingProvider) {
                this.logger.log('Claude Code CLI provider already registered');
                return {
                    id: existingProvider.id,
                    name: existingProvider.name,
                    provider: existingProvider.provider,
                    modelName: existingProvider.modelName,
                    isDefault: existingProvider.priority === 1,
                    isCustom: false,
                    apiEndpoint: existingProvider.apiEndpoint || undefined
                };
            }
            // Register new provider
            const newProvider = await this.prisma.lLMConfig.create({
                data: {
                    name: 'Claude Code CLI',
                    provider: 'local',
                    modelName: 'claude-sonnet-4',
                    apiKey: 'local://claude-code-cli', // Special identifier
                    apiEndpoint: 'local://claude-code-cli',
                    isCustom: false,
                    enabled: true,
                    priority: 5, // Medium priority
                    retryConfig: {
                        maxAttempts: 2,
                        initialDelay: 1000,
                        maxDelay: 5000,
                        backoffFactor: 2
                    }
                }
            });
            // Register with LLM registry
            await this.llmRegistry.registerProvider(newProvider.id, {
                provider: newProvider.provider,
                model: newProvider.modelName,
                apiKey: newProvider.apiKey,
                apiEndpoint: newProvider.apiEndpoint ?? undefined,
                enabled: true,
                priority: newProvider.priority,
                modelName: newProvider.modelName
            });
            this.logger.log('Claude Code CLI provider registered successfully');
            return {
                id: newProvider.id,
                name: newProvider.name,
                provider: newProvider.provider,
                modelName: newProvider.modelName,
                isDefault: false,
                isCustom: false,
                apiEndpoint: newProvider.apiEndpoint ?? undefined
            };
        }
        catch (error) {
            this.logger.error('Failed to register Claude Code CLI provider', error);
            throw error;
        }
    }
    async registerGeminiCLI() {
        try {
            // Check if Gemini CLI is available
            const isAvailable = true; // Mock implementation
            if (!isAvailable) {
                this.logger.warn('Gemini CLI is not available on this system');
                return null;
            }
            // Check if already registered
            const existingProvider = await this.prisma.lLMConfig.findFirst({
                where: {
                    provider: 'local',
                    name: 'Gemini CLI'
                }
            });
            if (existingProvider) {
                this.logger.log('Gemini CLI provider already registered');
                return {
                    id: existingProvider.id,
                    name: existingProvider.name,
                    provider: existingProvider.provider,
                    modelName: existingProvider.modelName,
                    isDefault: existingProvider.priority === 1,
                    isCustom: false,
                    apiEndpoint: existingProvider.apiEndpoint || undefined
                };
            }
            // Register new provider
            const newProvider = await this.prisma.lLMConfig.create({
                data: {
                    name: 'Gemini CLI',
                    provider: 'local',
                    modelName: 'gemini-pro',
                    apiKey: 'local://gemini-cli', // Special identifier
                    apiEndpoint: 'local://gemini-cli',
                    isCustom: false,
                    enabled: true,
                    priority: 5, // Medium priority
                    retryConfig: {
                        maxAttempts: 2,
                        initialDelay: 1000,
                        maxDelay: 5000,
                        backoffFactor: 2
                    }
                }
            });
            // Register with LLM registry
            await this.llmRegistry.registerProvider(newProvider.id, {
                provider: newProvider.provider,
                model: newProvider.modelName,
                apiKey: newProvider.apiKey,
                apiEndpoint: newProvider.apiEndpoint ?? undefined,
                enabled: true,
                priority: newProvider.priority,
                modelName: newProvider.modelName
            });
            this.logger.log('Gemini CLI provider registered successfully');
            return {
                id: newProvider.id,
                name: newProvider.name,
                provider: newProvider.provider,
                modelName: newProvider.modelName,
                isDefault: false,
                isCustom: false,
                apiEndpoint: newProvider.apiEndpoint ?? undefined
            };
        }
        catch (error) {
            this.logger.error('Failed to register Gemini CLI provider', error);
            throw error;
        }
    }
    async registerOllama() {
        try {
            // Check if Ollama local server is expected to be available
            const existingProvider = await this.prisma.lLMConfig.findFirst({
                where: {
                    provider: 'local',
                    name: 'Ollama (Local)'
                }
            });
            if (existingProvider) {
                this.logger.log('Ollama provider already registered');
                return {
                    id: existingProvider.id,
                    name: existingProvider.name,
                    provider: existingProvider.provider,
                    modelName: existingProvider.modelName,
                    isDefault: existingProvider.priority === 1,
                    isCustom: false,
                    apiEndpoint: existingProvider.apiEndpoint || undefined
                };
            }
            // Create registration entry for Ollama local server
            const newProvider = await this.prisma.lLMConfig.create({
                data: {
                    name: 'Ollama (Local)',
                    provider: 'local',
                    modelName: 'ollama-default',
                    apiKey: 'local://ollama',
                    apiEndpoint: 'http://localhost:11434',
                    isCustom: false,
                    enabled: true,
                    priority: 5,
                    retryConfig: {
                        maxAttempts: 2,
                        initialDelay: 1000,
                        maxDelay: 5000,
                        backoffFactor: 2
                    }
                }
            });
            // Register with LLM registry
            await this.llmRegistry.registerProvider(newProvider.id, {
                provider: newProvider.provider,
                model: newProvider.modelName,
                apiKey: newProvider.apiKey,
                apiEndpoint: newProvider.apiEndpoint ?? undefined,
                enabled: true,
                priority: newProvider.priority,
                modelName: newProvider.modelName
            });
            this.logger.log('Ollama provider registered successfully');
            return {
                id: newProvider.id,
                name: newProvider.name,
                provider: newProvider.provider,
                modelName: newProvider.modelName,
                isDefault: false,
                isCustom: false,
                apiEndpoint: newProvider.apiEndpoint ?? undefined
            };
        }
        catch (error) {
            this.logger.error('Failed to register Ollama provider', error);
            throw error;
        }
    }
};
LLMProviderService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [Object, typeof (_a = typeof PrismaService !== "undefined" && PrismaService) === "function" ? _a : Object])
], LLMProviderService);
export { LLMProviderService };
//# sourceMappingURL=llm-provider.service.js.map