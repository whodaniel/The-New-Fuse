exports.providerRegistry = exports.AuthProviderAIError = void 0;
class AuthProviderAIError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AuthProviderAIError';
    }
}
exports.AuthProviderAIError = AuthProviderAIError;
export const providerRegistry = {
    providers: new Map(),
    registerProvider: function (provider) {
        this.providers.set(provider.id, provider);
    },
    getProvider: function (id) {
        return this.providers.get(id);
    },
    getAllProviders: function () {
        return Array.from(this.providers.values());
    }
};
//# sourceMappingURL=ai-provider.js.map
//# sourceMappingURL=ai-provider.js.map