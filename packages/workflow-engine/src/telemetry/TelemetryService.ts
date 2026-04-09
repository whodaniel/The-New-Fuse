import { trace, context, propagation, Span, SpanStatusCode } from '@opentelemetry/api';

export type TaskExecutionTelemetryLog = {
  taskId: string;
  message: string;
  level?: 'info' | 'warn' | 'error';
  actor?: string;
  source?: string;
  stage?: string;
  metadata?: Record<string, unknown>;
  persist?: boolean;
};

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

  emitTaskExecutionLog(log: TaskExecutionTelemetryLog): void {
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
    span.setStatus({ code: SpanStatusCode.OK });
    span.end();
  }

  async emitAndPersistTaskExecutionLog(log: TaskExecutionTelemetryLog): Promise<void> {
    this.emitTaskExecutionLog(log);
    if (log.persist === false) return;
    await this.persistTaskExecutionLog(log);
  }

  private async persistTaskExecutionLog(log: TaskExecutionTelemetryLog): Promise<void> {
    const baseUrl = process.env.TNF_API_BASE_URL || process.env.API_BASE_URL;
    if (!baseUrl) return;
    const fetchFn = (globalThis as any).fetch;
    if (typeof fetchFn !== 'function') return;

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
        console.warn(
          `[Telemetry] Failed to persist task execution log for ${log.taskId}: ${response.status}`
        );
      }
    } catch (error: any) {
      console.warn(
        `[Telemetry] Error persisting task execution log for ${log.taskId}: ${error?.message || error}`
      );
    }
  }
}

export const telemetry = new TelemetryService();
