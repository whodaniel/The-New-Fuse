"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMProviderService = void 0;
const common_1 = require("@nestjs/common");
const LLMRegistry_1 = require("@/llm/LLMRegistry");
const database_1 = require("@/services/database");
const logger_1 = require("@/utils/logger");
let LLMProviderService = class LLMProviderService {
    llmRegistry;
    db;
    logger = new logger_1.Logger('LLMProviderService');
    constructor(llmRegistry, db) {
        this.llmRegistry = llmRegistry;
        this.db = db;
    }
    async findAll() {
        try {
            // Get providers from database
            const providers = await this.db.llmConfigs.findMany({
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
                apiEndpoint: provider.apiEndpoint
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
            const newProvider = await this.db.llmConfigs.create({
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
                apiEndpoint: newProvider.apiEndpoint,
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
                apiEndpoint: newProvider.apiEndpoint
            };
        }
        catch (error) {
            this.logger.error('Failed to create LLM provider', error);
            throw error;
        }
    }
    async findById(id) {
        try {
            const provider = await this.db.llmConfigs.findUnique({
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
                apiEndpoint: provider.apiEndpoint
            };
        }
        catch (error) {
            this.logger.error(`Failed to find LLM provider with id ${id}`, error);
            throw error;
        }
    }
    async update(id, dto) {
        try {
            const provider = await this.db.llmConfigs.update({
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
                apiEndpoint: provider.apiEndpoint,
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
                apiEndpoint: provider.apiEndpoint
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
            const provider = await this.db.llmConfigs.findUnique({
                where: { id }
            });
            if (!provider || !provider.isCustom) {
                throw new Error('Only custom providers can be deleted');
            }
            // Remove from LLM registry
            await this.llmRegistry.unregisterProvider(id);
            // Delete from database
            await this.db.llmConfigs.delete({
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
            await this.db.llmConfigs.updateMany({
                data: {
                    priority: 10
                }
            });
            // Set the selected provider as default
            const provider = await this.db.llmConfigs.update({
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
                apiEndpoint: provider.apiEndpoint
            };
        }
        catch (error) {
            this.logger.error(`Failed to set LLM provider ${id} as default`, error);
            throw error;
        }
    }
};
exports.LLMProviderService = LLMProviderService;
exports.LLMProviderService = LLMProviderService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof LLMRegistry_1.LLMRegistry !== "undefined" && LLMRegistry_1.LLMRegistry) === "function" ? _a : Object, typeof (_b = typeof database_1.DatabaseService !== "undefined" && database_1.DatabaseService) === "function" ? _b : Object])
], LLMProviderService);
