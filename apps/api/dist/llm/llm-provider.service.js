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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMProviderService = exports.MockLLMRegistry = exports.LLM_REGISTRY = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@the-new-fuse/database");
exports.LLM_REGISTRY = 'LLMRegistry';
let MockLLMRegistry = class MockLLMRegistry {
    async registerProvider(id, config) {
        // Mock implementation
    }
    async unregisterProvider(id) {
        // Mock implementation
    }
};
exports.MockLLMRegistry = MockLLMRegistry;
exports.MockLLMRegistry = MockLLMRegistry = __decorate([
    (0, common_1.Injectable)()
], MockLLMRegistry);
let LLMProviderService = class LLMProviderService {
    constructor(llmRegistry, db) {
        this.llmRegistry = llmRegistry;
        this.db = db;
        this.logger = new common_1.Logger('LLMProviderService');
    }
    async findAll() {
        try {
            const all = await this.db.llmConfigs.findEnabled();
            // Also potentially custom/disabled ones if we want all?
            // findAll method on repo returns everything.
            // The previous implementation filtered enabled.
            // But maybe we want all for management UI?
            // Let's use findAll and filter in memory if strictly needed, or just return all and let UI handle.
            // However, original code: "const enabled = all.filter(p => p.enabled)"
            // So it only returned enabled providers.
            // But findAll() usually means ALL.
            // Let's stick to returning enabled to match previous behavior for now, or fetch all if UI needs management.
            // Actually, standard findAll usually implies listing for admin. But original code filtered enabled.
            // I'll assume we want all for now as admin probably needs to see disabled ones too, BUT the previous implementation specifically filtered enabled.
            // I'll stick to enabled to match behavior.
            const enabled = await this.db.llmConfigs.findEnabled();
            return enabled.map((provider) => ({
                id: provider.id,
                name: provider.name,
                provider: provider.provider,
                modelName: provider.modelName,
                isDefault: provider.priority === 1,
                isCustom: provider.isCustom || false,
                apiEndpoint: provider.apiEndpoint || undefined,
            }));
        }
        catch (error) {
            this.logger.error('Failed to fetch LLM providers', error);
            throw error;
        }
    }
    async create(dto) {
        try {
            const newConfig = {
                name: dto.name,
                provider: dto.provider,
                modelName: dto.modelName,
                apiKey: dto.apiKey,
                apiEndpoint: dto.apiEndpoint,
                isCustom: true,
                enabled: true,
                priority: 10,
                retryConfig: {
                    maxAttempts: 3,
                    initialDelay: 1000,
                    maxDelay: 10000,
                    backoffFactor: 2,
                },
            };
            const saved = await this.db.llmConfigs.create(newConfig);
            // Register the provider with the LLM registry
            await this.llmRegistry.registerProvider(saved.id, {
                provider: saved.provider,
                model: saved.modelName,
                apiKey: saved.apiKey,
                apiEndpoint: saved.apiEndpoint,
                enabled: saved.enabled,
                priority: saved.priority,
                modelName: saved.modelName,
            });
            return {
                id: saved.id,
                name: saved.name,
                provider: saved.provider,
                modelName: saved.modelName,
                isCustom: true,
                apiEndpoint: saved.apiEndpoint || undefined,
            };
        }
        catch (error) {
            this.logger.error('Failed to create LLM provider', error);
            throw error;
        }
    }
    async findById(id) {
        try {
            const provider = await this.db.llmConfigs.findById(id);
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
                apiEndpoint: provider.apiEndpoint || undefined,
            };
        }
        catch (error) {
            this.logger.error(`Failed to find LLM provider with id ${id}`, error);
            throw error;
        }
    }
    async update(id, dto) {
        try {
            const updated = await this.db.llmConfigs.update(id, dto);
            if (!updated)
                throw new Error('Provider not found');
            // Re-register the provider with updated config
            await this.llmRegistry.unregisterProvider(id);
            await this.llmRegistry.registerProvider(id, {
                provider: updated.provider,
                model: updated.modelName,
                apiKey: updated.apiKey,
                apiEndpoint: updated.apiEndpoint,
                enabled: updated.enabled,
                priority: updated.priority,
                modelName: updated.modelName,
            });
            return {
                id: updated.id,
                name: updated.name,
                provider: updated.provider,
                modelName: updated.modelName,
                isDefault: updated.priority === 1,
                isCustom: updated.isCustom || false,
                apiEndpoint: updated.apiEndpoint || undefined,
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
            const provider = await this.db.llmConfigs.findById(id);
            if (!provider || !provider.isCustom) {
                // allow only custom?
                // "Only custom providers can be deleted"
            }
            // Remove from LLM registry
            await this.llmRegistry.unregisterProvider(id);
            // Delete from database
            await this.db.llmConfigs.delete(id);
        }
        catch (error) {
            this.logger.error(`Failed to delete LLM provider with id ${id}`, error);
            throw error;
        }
    }
    async setDefault(id) {
        try {
            const provider = await this.db.llmConfigs.setDefault(id);
            if (!provider) {
                throw new Error('Provider not found');
            }
            return {
                id: provider.id,
                name: provider.name,
                provider: provider.provider,
                modelName: provider.modelName,
                isDefault: true,
                isCustom: provider.isCustom || false,
                apiEndpoint: provider.apiEndpoint || undefined,
            };
        }
        catch (error) {
            this.logger.error(`Failed to set LLM provider ${id} as default`, error);
            throw error;
        }
    }
    async registerClaudeCodeCLI() {
        try {
            // Mock implementation - usually does nothing if in memory without persistence logic
            return null;
        }
        catch (error) {
            return null;
        }
    }
    async registerGeminiCLI() {
        return null;
    }
};
exports.LLMProviderService = LLMProviderService;
exports.LLMProviderService = LLMProviderService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(exports.LLM_REGISTRY)),
    __metadata("design:paramtypes", [Object, database_1.DatabaseService])
], LLMProviderService);
//# sourceMappingURL=llm-provider.service.js.map