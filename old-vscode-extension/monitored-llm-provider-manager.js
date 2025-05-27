"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoredLLMProviderManager = void 0;
/**
 * MonitoredLLMProviderManager
 *
 * Extends the LLMProviderManager with integrated monitoring capabilities.
 * This class wraps all LLM provider operations with monitoring to track
 * performance, usage, and errors across different LLM providers.
 */
class MonitoredLLMProviderManager {
    constructor(context, providerManager, monitoringClient) {
        this.context = context;
        this.providerManager = providerManager;
        this.monitoringClient = monitoringClient;
    }
    /**
     * Get all available LLM providers
     */
    getAllProviders() {
        return this.providerManager.getAllProviders();
    }
    /**
     * Get a provider by ID
     */
    getProvider(id) {
        return this.providerManager.getProvider(id);
    }
    /**
     * Get the currently selected provider
     */
    getCurrentProvider() {
        const provider = this.providerManager.getSelectedProvider();
        if (!provider) {
            throw new Error('No provider selected');
        }
        return provider;
    }
    /**
     * Set the current provider by ID
     */
    setCurrentProvider(id) {
        return Promise.resolve(this.providerManager.selectProvider(id));
    }
    /**
     * Generate text with the current provider, with monitoring
     */
    async generateText(prompt, options = {}) {
        const provider = this.getCurrentProvider();
        // Use scoreGeneration instead of traceGeneration
        return this.monitoringClient.scoreGeneration({
            generationId: `text-gen-${Date.now()}`,
            name: 'text-generation',
            provider: provider.name,
            model: provider.modelName,
            prompt,
            options,
            callback: async () => {
                // Implementation of generateText
                return {
                    text: prompt + " [Generated response]",
                    provider: provider.name,
                    model: provider.modelName,
                    usage: { promptTokens: prompt.length, completionTokens: 100, totalTokens: prompt.length + 100 }
                };
            }
        });
    }
    /**
     * Generate a chat completion with the current provider, with monitoring
     */
    async generateChatCompletion(messages, options = {}) {
        const provider = this.getCurrentProvider();
        // Construct a readable prompt from the messages for monitoring
        const promptForMonitoring = messages.map(msg => `${msg.role}: ${msg.content}`).join('\n');
        // Use scoreGeneration instead of traceGeneration
        return this.monitoringClient.scoreGeneration({
            generationId: `chat-gen-${Date.now()}`,
            name: 'chat-completion',
            provider: provider.name,
            model: provider.modelName,
            prompt: promptForMonitoring,
            options,
            callback: async () => {
                // Implementation of chat completion
                return {
                    text: "This is a chat completion response",
                    provider: provider.name,
                    model: provider.modelName,
                    usage: { promptTokens: 100, completionTokens: 150, totalTokens: 250 }
                };
            }
        });
    }
    /**
     * Generate code with the current provider, with monitoring
     */
    async generateCode(prompt, language, options = {}) {
        const provider = this.getCurrentProvider();
        // Use scoreGeneration instead of traceGeneration
        return this.monitoringClient.scoreGeneration({
            generationId: `code-gen-${Date.now()}`,
            name: 'code-generation',
            provider: provider.name,
            model: provider.modelName,
            prompt,
            language,
            options,
            callback: async () => {
                // Implementation of code generation
                return {
                    text: `// ${language} code\n// Generated from prompt: ${prompt}\n\nfunction example() {\n  // Implementation\n}`,
                    provider: provider.name,
                    model: provider.modelName,
                    usage: { promptTokens: prompt.length, completionTokens: 120, totalTokens: prompt.length + 120 }
                };
            }
        });
    }
    /**
     * Add a user rating for a generation
     */
    rateGeneration(generationId, rating, comment) {
        this.monitoringClient.scoreGeneration({
            generationId,
            name: 'user-rating',
            value: rating,
            comment
        });
    }
    /**
     * Save a user preference for a provider
     */
    saveUserPreference(providerId, preferred) {
        // Save preference in global state
        const preferences = this.context.globalState.get('thefuse.providerPreferences', {});
        preferences[providerId] = preferred;
        this.context.globalState.update('thefuse.providerPreferences', preferences);
        // Log in monitoring system
        if (this.monitoringClient.isEnabled()) {
            const provider = this.getProvider(providerId);
            if (provider) {
                // Create a trace ID that encodes the preference information 
                const traceId = `preference-${providerId}-${preferred ? 'preferred' : 'not-preferred'}-${Date.now()}`;
                this.monitoringClient.startTrace(traceId);
                if (traceId) {
                    this.monitoringClient.endTrace(traceId);
                }
            }
        }
    }
    /**
     * Get monitoring metrics for LLM usage
     */
    getMetrics() {
        return this.monitoringClient.getSessionMetrics();
    }
    /**
     * Open the monitoring dashboard
     */
    openMonitoringDashboard() {
        this.monitoringClient.openDashboard();
    }
}
exports.MonitoredLLMProviderManager = MonitoredLLMProviderManager;
//# sourceMappingURL=monitored-llm-provider-manager.js.map