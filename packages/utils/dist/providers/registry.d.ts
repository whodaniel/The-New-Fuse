export {};
export declare const providerRegistry: {
    apiKeys: Map<string, string>;
    registerApiKey(provider: string, apiKey: string): void;
    getApiKey(provider: string): string | undefined;
    hasApiKey(provider: string): boolean;
};
//# sourceMappingURL=registry.d.ts.map