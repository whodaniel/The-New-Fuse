import { Injectable } from '@nestjs/common';

/**
 * Unified monitoring service for tracking system metrics and events
 */
@Injectable()
export class UnifiedMonitorService {
  private metrics: Map<string, any> = new Map();
  
  constructor() {
    // Initialize default metrics
    this.metrics.set('connections', 0);
    this.metrics.set('messages', 0);
    this.metrics.set('errors', 0);
    this.metrics.set('latency', []);
  }
  
  /**
   * Increment a numeric metric
   */
  incrementMetric(name: string, value: number = 1): void {
    const current = this.metrics.get(name) || 0;
    this.metrics.set(name, current + value);
  }
  
  /**
   * Record a latency value
   */
  recordLatency(operation: string, timeMs: number): void {
    const latencies = this.metrics.get('latency') || [];
    latencies.push({ operation, timeMs, timestamp: new Date() });
    
    // Keep only the last 1000 latency records
    if (latencies.length > 1000) {
      latencies.shift();
    }
    
    this.metrics.set('latency', latencies);
  }
  
  /**
   * Log a system event
   */
  logEvent(eventType: string, data: any): void {
    console.log(`[${eventType}]`, JSON.stringify(data));
    
    // Store event in metrics
    const events = this.metrics.get('events') || [];
    events.push({
      type: eventType,
      data,
      timestamp: new Date()
    });
    
    // Keep only the last 1000 events
    if (events.length > 1000) {
      events.shift();
    }
    
    this.metrics.set('events', events);
  }
  
  /**
   * Get all metrics
   */
  getMetrics(): Record<string, any> {
    const result: Record<string, any> = {};
    
    this.metrics.forEach((value, key) => {
      result[key] = value;
    });
    
    return result;
  }
  
  /**
   * Get a specific metric
   */
  getMetric(name: string): any {
    return this.metrics.get(name);
  }
  
  /**
   * Reset all metrics
   */
  resetMetrics(): void {
    this.metrics.clear();
    this.metrics.set('connections', 0);
    this.metrics.set('messages', 0);
    this.metrics.set('errors', 0);
    this.metrics.set('latency', []);
    this.metrics.set('events', []);
  }
}