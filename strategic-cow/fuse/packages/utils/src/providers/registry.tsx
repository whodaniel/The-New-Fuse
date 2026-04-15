
export {}
exports.providerRegistry = void 0;

export const providerRegistry = {
  apiKeys: new Map<string, string>(),
  
  registerApiKey(provider: string, apiKey: string): void {
    this.apiKeys.set(provider, apiKey);
  },
  
  getApiKey(provider: string): string | undefined {
    return this.apiKeys.get(provider);
  },
  
  hasApiKey(provider: string): boolean {
    return this.apiKeys.has(provider);
  }
};
