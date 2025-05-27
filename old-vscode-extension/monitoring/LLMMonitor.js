"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMMonitor = void 0;
class LLMMonitor {
    constructor(monitoringClient) {
        this.monitoringClient = monitoringClient;
    }
    trackGeneration(provider, prompt, response) {
        this.monitoringClient.trackEvent('llm.generation', {
            provider,
            promptLength: prompt.length,
            responseLength: response.length,
            timestamp: Date.now()
        });
    }
    trackError(provider, error) {
        this.monitoringClient.trackError(error, { provider });
    }
}
exports.LLMMonitor = LLMMonitor;
//# sourceMappingURL=LLMMonitor.js.map