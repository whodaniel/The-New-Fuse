"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.telemetry = exports.TelemetryService = void 0;
const api_1 = require("@opentelemetry/api");
class TelemetryService {
    tracerName = '@the-new-fuse/workflow-engine';
    constructor() {
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
}
exports.TelemetryService = TelemetryService;
exports.telemetry = new TelemetryService();
//# sourceMappingURL=TelemetryService.js.map