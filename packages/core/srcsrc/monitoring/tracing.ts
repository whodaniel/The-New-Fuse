import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

interface Span {
  id: string;
  traceId: string;
  parentId?: string;
  name: string;
  startTime: number;
  endTime?: number;
  attributes: Record<string, any>;
  events: { name: string; timestamp: number }[];
}

@Injectable()
export class TracingService {
  private readonly logger = new Logger(TracingService.name);
  private spans: Map<string, Span> = new Map();

  startTrace(name: string): Span {
    const traceId = uuidv4();
    const span = this.startSpan(name, traceId);
    this.logger.debug(`Trace started: ${name} (${traceId})`);
    return span;
  }

  startSpan(name: string, traceId: string, parentId?: string): Span {
    const spanId = uuidv4();
    const span: Span = {
      id: spanId,
      traceId,
      parentId,
      name,
      startTime: Date.now(),
      attributes: {},
      events: [],
    };
    this.spans.set(spanId, span);
    this.logger.debug(`Span started: ${name} (${spanId})`);
    return span;
  }

  endSpan(span: Span): void {
    span.endTime = Date.now();
    this.logger.debug(`Span ended: ${span.name} (${span.id})`);
    // In a real implementation, you would export the span to a collector (e.g., Jaeger, Zipkin)
  }

  addEvent(span: Span, name: string): void {
    span.events.push({ name, timestamp: Date.now() });
  }

  setAttribute(span: Span, key: string, value: any): void {
    span.attributes[key] = value;
  }
}
