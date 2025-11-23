exports.providerRegistry = void 0;
export const providerRegistry = {
    apiKeys: new Map(),
    registerApiKey(provider, apiKey) {
        this.apiKeys.set(provider, apiKey);
    },
    getApiKey(provider) {
        return this.apiKeys.get(provider);
    },
    hasApiKey(provider) {
        return this.apiKeys.has(provider);
    }
};
//# sourceMappingURL=registry.js.map