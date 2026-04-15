import { trace, context, propagation, Span, SpanStatusCode } from '@opentelemetry/api';

export class TelemetryService {
  private tracerName = '@the-new-fuse/workflow-engine';

  constructor() {
    // Initialization of SDK should happen at application entry point (e.g. main.ts)
    // This service provides helpers for creating spans.
  }

  getTracer() {
    return trace.getTracer(this.tracerName);
  }

  async startActiveSpan<T>(name: string, callback: (span: Span) => Promise<T>): Promise<T> {
    const tracer = this.getTracer();
    return tracer.startActiveSpan(name, async (span) => {
      try {
        const result = await callback(span);
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error: any) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error.message,
        });
        span.recordException(error);
        throw error;
      } finally {
        span.end();
      }
    });
  }

  // Helper to extract context from job data
  extractContext(carrier: any) {
    return propagation.extract(context.active(), carrier);
  }

  // Helper to inject context into job data
  injectContext(carrier: any) {
    propagation.inject(context.active(), carrier);
  }
}

export const telemetry = new TelemetryService();
