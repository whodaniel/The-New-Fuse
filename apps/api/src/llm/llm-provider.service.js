var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
import { Injectable } from '@nestjs/common';
import { Logger } from '@/utils/logger';
let LLMProviderService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var LLMProviderService = _classThis = class {
        constructor(llmRegistry, db) {
            this.llmRegistry = llmRegistry;
            this.db = db;
            this.logger = new Logger('LLMProviderService');
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
    __setFunctionName(_classThis, "LLMProviderService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        LLMProviderService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return LLMProviderService = _classThis;
})();
export { LLMProviderService };
