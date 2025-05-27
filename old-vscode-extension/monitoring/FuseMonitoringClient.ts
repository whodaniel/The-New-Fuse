import { getLogger, Logger } from '../src/core/logging.js';
import { getErrorMessage } from '../utils/error-handling.js';

interface LangfuseConfig {
    publicKey: string;
    secretKey: string;
    baseUrl?: string;
}

export class FuseMonitoringClient {
    private logger: Logger;
    private events: any[] = [];
    private enabled: boolean = false;
    private activeTraces: Map<string, number> = new Map();

    constructor(private config: LangfuseConfig) {
        this.logger = Logger.getInstance();
        this.enabled = !!config.publicKey && !!config.secretKey;
    }

    isEnabled(): boolean {
        return this.enabled;
    }

    startTrace(traceId: string): void {
        if (!this.enabled) return;
        this.activeTraces.set(traceId, Date.now());
        this.logger.info(`Started trace: ${traceId}`);
    }

    endTrace(traceId: string): void {
        if (!this.enabled) return;
        const startTime = this.activeTraces.get(traceId);
        if (startTime) {
            const duration = Date.now() - startTime;
            this.activeTraces.delete(traceId);
            this.logger.info(`Ended trace: ${traceId} (duration: ${duration}ms)`);
        }
    }

    scoreGeneration(data: {
        generationId: string;
        name: string;
        value: number;
        comment?: string;
        provider?: string;
    }): void {
        if (!this.enabled) return;
        this.events.push({
            type: 'score',
            ...data,
            timestamp: Date.now()
        });
    }

    async getSessionMetrics(): Promise<any> {
        if (!this.enabled) return {};
        return {
            activeTraces: this.activeTraces.size,
            totalEvents: this.events.length,
            timestamp: Date.now()
        };
    }

    openDashboard(): void {
        if (!this.enabled) {
            this.logger.warn('Monitoring is not enabled');
            return;
        }
        const url = this.config.baseUrl || 'https://cloud.langfuse.com';
        // Implementation to open dashboard
        this.logger.info(`Opening dashboard at ${url}`);
    }

    async flush(): Promise<void> {
        if (!this.enabled || this.events.length === 0) return;

        try {
            const url = `${this.config.baseUrl || 'https://cloud.langfuse.com'}/api/public/ingestion`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': this.config.publicKey,
                },
                body: JSON.stringify(this.events)
            });

            if (!response.ok) {
                throw new Error(`Failed to flush events: ${response.statusText}`);
            }

            this.events = [];
            this.logger.info('Successfully flushed monitoring events');
        } catch (error) {
            this.logger.error(`Failed to flush events: ${getErrorMessage(error)}`);
            throw error;
        }
    }
}