import { MonitoringClient } from './MonitoringClient.js';
export declare class LLMMonitor {
    private monitoringClient;
    constructor(monitoringClient: MonitoringClient);
    trackGeneration(provider: string, prompt: string, response: string): void;
    trackError(provider: string, error: Error): void;
}
//# sourceMappingURL=LLMMonitor.d.ts.map