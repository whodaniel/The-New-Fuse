"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.llmRegistry = exports.LLMRegistry = void 0;
class LLMRegistry {
    providers = new Map();
    registerProvider(provider) {
        this.providers.set(provider.id, provider);
    }
    getProvider(id) {
        return this.providers.get(id) || null;
    }
    getAllProviders() {
        return Array.from(this.providers.values());
    }
    removeProvider(id) {
        return this.providers.delete(id);
    }
}
exports.LLMRegistry = LLMRegistry;
exports.llmRegistry = new LLMRegistry();
