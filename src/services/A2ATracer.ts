import { Injectable } from '@nestjs/common';
import { trace, context, SpanKind, Tracer } from '@opentelemetry/api';
import { A2ALogger } from './A2ALogger.js';

@Injectable()
export class A2ATracer {
    private tracer: Tracer;

    constructor(private logger: A2ALogger) {
        this.tracer = trace.getTracer('a2a-protocol');
    }

    async traceOperation<T>(
        operationName: string,
        metadata: Record<string, any>,
        operation: () => Promise<T>
    ): Promise<T> {
        const span = this.tracer.startSpan(operationName, {
            kind: SpanKind.INTERNAL,
            attributes: metadata
        });

        return context.with(trace.setSpan(context.active(), span), async () => {
            try {
                const result = await operation();
                span.end();
                return result;
            } catch (error) {
                span.recordException(error);
                span.setStatus({ code: 2, message: error.message });
                span.end();
                throw error;
            }
        });
    }

    async traceMessage(message: any, context: any) {
        return this.traceOperation('a2a.message', {
            messageId: message.metadata?.id,
            messageType: message.type,
            sender: message.metadata?.sender,
            ...context
        }, async () => {
            this.logger.logProtocolMessage(message, context);
            return message;
        });
    }
}