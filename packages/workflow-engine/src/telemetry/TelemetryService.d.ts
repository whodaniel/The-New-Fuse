// @ts-nocheck
import { Span } from '@opentelemetry/api';
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
export declare class TelemetryService {
    private tracerName;
    constructor();
    getTracer(): import("@opentelemetry/api").Tracer;
    startActiveSpan<T>(name: string, callback: (span: Span) => Promise<T>): Promise<T>;
    extractContext(carrier: any): import("@opentelemetry/api").Context;
    injectContext(carrier: any): void;
    emitTaskExecutionLog(log: TaskExecutionTelemetryLog): void;
    emitAndPersistTaskExecutionLog(log: TaskExecutionTelemetryLog): Promise<void>;
    private persistTaskExecutionLog;
}
export declare const telemetry: TelemetryService;
//# sourceMappingURL=TelemetryService.d.ts.map