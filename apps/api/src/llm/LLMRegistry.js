export class LLMRegistry {
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
export const llmRegistry = new LLMRegistry();
//# sourceMappingURL=LLMRegistry.js.map