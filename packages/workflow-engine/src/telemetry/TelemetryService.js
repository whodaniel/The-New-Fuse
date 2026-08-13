"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.telemetry = exports.TelemetryService = void 0;
const api_1 = require("@opentelemetry/api");
class TelemetryService {
    constructor() {
        this.tracerName = '@the-new-fuse/workflow-engine';
        // Initialization of SDK should happen at application entry point (e.g. main.ts)
        // This service provides helpers for creating spans.
    }
    getTracer() {
        return api_1.trace.getTracer(this.tracerName);
    }
    async startActiveSpan(name, callback) {
        const tracer = this.getTracer();
        return tracer.startActiveSpan(name, async (span) => {
            try {
                const result = await callback(span);
                span.setStatus({ code: api_1.SpanStatusCode.OK });
                return result;
            }
            catch (error) {
                span.setStatus({
                    code: api_1.SpanStatusCode.ERROR,
                    message: error.message,
                });
                span.recordException(error);
                throw error;
            }
            finally {
                span.end();
            }
        });
    }
    // Helper to extract context from job data
    extractContext(carrier) {
        return api_1.propagation.extract(api_1.context.active(), carrier);
    }
    // Helper to inject context into job data
    injectContext(carrier) {
        api_1.propagation.inject(api_1.context.active(), carrier);
    }
    emitTaskExecutionLog(log) {
        const tracer = this.getTracer();
        const span = tracer.startSpan('task.execution.log');
        span.setAttribute('task.id', log.taskId);
        span.setAttribute('task.log.level', log.level || 'info');
        span.setAttribute('task.log.message', log.message);
        span.setAttribute('task.log.actor', log.actor || 'workflow-engine');
        span.setAttribute('task.log.source', log.source || 'workflow-engine');
        if (log.stage) {
            span.setAttribute('task.log.stage', log.stage);
        }
        if (log.metadata) {
            span.setAttribute('task.log.metadata', JSON.stringify(log.metadata));
        }
        span.setStatus({ code: api_1.SpanStatusCode.OK });
        span.end();
    }
    async emitAndPersistTaskExecutionLog(log) {
        this.emitTaskExecutionLog(log);
        if (log.persist === false)
            return;
        await this.persistTaskExecutionLog(log);
    }
    async persistTaskExecutionLog(log) {
        const baseUrl = process.env.TNF_API_BASE_URL || process.env.API_BASE_URL;
        if (!baseUrl)
            return;
        const fetchFn = globalThis.fetch;
        if (typeof fetchFn !== 'function')
            return;
        const endpoint = `${String(baseUrl).replace(/\/$/, '')}/api/tasks/${encodeURIComponent(log.taskId)}/execution-logs`;
        try {
            const response = await fetchFn(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: log.message,
                    level: log.level || 'info',
                    actor: log.actor || 'workflow-engine',
                    source: log.source || 'workflow-engine',
                    stage: log.stage,
                    metadata: log.metadata || {},
                }),
            });
            if (!response.ok) {
                console.warn(`[Telemetry] Failed to persist task execution log for ${log.taskId}: ${response.status}`);
            }
        }
        catch (error) {
            console.warn(`[Telemetry] Error persisting task execution log for ${log.taskId}: ${error?.message || error}`);
        }
    }
}
exports.TelemetryService = TelemetryService;
exports.telemetry = new TelemetryService();
//# sourceMappingURL=TelemetryService.js.map