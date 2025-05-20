"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FuseMonitoringClient = void 0;
const logging_1 = require("../core/logging");
const error_handling_1 = require("../utils/error-handling");
class FuseMonitoringClient {
    constructor(config) {
        this.config = config;
        this.events = [];
        this.enabled = false;
        this.activeTraces = new Map();
        this.logger = logging_1.Logger.getInstance();
        this.enabled = !!config.publicKey && !!config.secretKey;
    }
    isEnabled() {
        return this.enabled;
    }
    startTrace(traceId) {
        if (!this.enabled)
            return;
        this.activeTraces.set(traceId, Date.now());
        this.logger.info(`Started trace: ${traceId}`);
    }
    endTrace(traceId) {
        if (!this.enabled)
            return;
        const startTime = this.activeTraces.get(traceId);
        if (startTime) {
            const duration = Date.now() - startTime;
            this.activeTraces.delete(traceId);
            this.logger.info(`Ended trace: ${traceId} (duration: ${duration}ms)`);
        }
    }
    scoreGeneration(data) {
        if (!this.enabled)
            return;
        this.events.push({
            type: 'score',
            ...data,
            timestamp: Date.now()
        });
    }
    async getSessionMetrics() {
        if (!this.enabled)
            return {};
        return {
            activeTraces: this.activeTraces.size,
            totalEvents: this.events.length,
            timestamp: Date.now()
        };
    }
    openDashboard() {
        if (!this.enabled) {
            this.logger.warn('Monitoring is not enabled');
            return;
        }
        const url = this.config.baseUrl || 'https://cloud.langfuse.com';
        // Implementation to open dashboard
        this.logger.info(`Opening dashboard at ${url}`);
    }
    async flush() {
        if (!this.enabled || this.events.length === 0)
            return;
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
        }
        catch (error) {
            this.logger.error(`Failed to flush events: ${(0, error_handling_1.getErrorMessage)(error)}`);
            throw error;
        }
    }
}
exports.FuseMonitoringClient = FuseMonitoringClient;
//# sourceMappingURL=FuseMonitoringClient.js.map