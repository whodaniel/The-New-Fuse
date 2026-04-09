
export {}
exports.providerRegistry = exports.AuthProviderAIError = void 0;
class AuthProviderAIError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AuthProviderAIError';
    }
}
exports.AuthProviderAIError = AuthProviderAIError;
export const providerRegistry = {
    providers: new Map<string, any>(),
    registerProvider: function(provider: any) {
        this.providers.set(provider.id, provider);
    },
    getProvider: function(id: string) {
        return this.providers.get(id);
    },
    getAllProviders: function() {
        return Array.from(this.providers.values());
    }
};
//# sourceMappingURL=ai-provider.js.map
