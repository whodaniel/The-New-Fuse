import { MonitoringClient } from './MonitoringClient.js';

export class LLMMonitor {
    constructor(private monitoringClient: MonitoringClient) {}

    trackGeneration(provider: string, prompt: string, response: string): void {
        this.monitoringClient.trackEvent('llm.generation', {
            provider,
            promptLength: prompt.length,
            responseLength: response.length,
            timestamp: Date.now()
        });
    }

    trackError(provider: string, error: Error): void {
        this.monitoringClient.trackError(error, { provider });
    }
}