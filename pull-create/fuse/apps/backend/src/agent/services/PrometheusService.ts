import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrometheusService {
  private metrics: Map<string, any> = new Map();

  constructor(private readonly configService: ConfigService) {}

  /**
   * Register a new metric
   */
  registerMetric(name: string, help: string, type: 'counter' | 'gauge' | 'histogram' = 'counter'): void {
    this.metrics.set(name, {
      name,
      help,
      type,
      value: type === 'counter' ? 0 : null,
      labels: new Map(),
    });
  }

  /**
   * Increment a counter metric
   */
  incrementCounter(name: string, value = 1, labels: Record<string, string> = {}): void {
    const metric = this.metrics.get(name);
    if (!metric || metric.type !== 'counter') {
      return;
    }

    metric.value += value;
    
    // Store labeled values
    const labelKey = this.getLabelKey(labels);
    if (labelKey) {
      if (!metric.labels.has(labelKey)) {
        metric.labels.set(labelKey, value);
      } else {
        metric.labels.set(labelKey, metric.labels.get(labelKey) + value);
      }
    }
  }

  /**
   * Set a gauge metric value
   */
  setGauge(name: string, value: number, labels: Record<string, string> = {}): void {
    const metric = this.metrics.get(name);
    if (!metric || metric.type !== 'gauge') {
      return;
    }

    metric.value = value;
    
    // Store labeled values
    const labelKey = this.getLabelKey(labels);
    if (labelKey) {
      metric.labels.set(labelKey, value);
    }
  }

  /**
   * Observe a value for a histogram metric
   */
  observeHistogram(name: string, value: number, labels: Record<string, string> = {}): void {
    const metric = this.metrics.get(name);
    if (!metric || metric.type !== 'histogram') {
      return;
    }

    // For simplicity, we're just storing the raw values
    // A real implementation would calculate buckets
    if (!metric.values) {
      metric.values = [];
    }
    metric.values.push(value);
    
    // Store labeled values
    const labelKey = this.getLabelKey(labels);
    if (labelKey) {
      if (!metric.labeledValues) {
        metric.labeledValues = new Map();
      }
      
      if (!metric.labeledValues.has(labelKey)) {
        metric.labeledValues.set(labelKey, []);
      }
      
      metric.labeledValues.get(labelKey).push(value);
    }
  }

  /**
   * Get all metrics in Prometheus format
   */
  getMetrics(): string {
    let output = '';
    
    for (const [name, metric] of this.metrics.entries()) {
      output += `# HELP ${name} ${metric.help}\n`;
      output += `# TYPE ${name} ${metric.type}\n`;
      
      if (metric.type === 'counter' || metric.type === 'gauge') {
        output += `${name} ${metric.value}\n`;
        
        // Add labeled metrics
        for (const [labelKey, labelValue] of metric.labels.entries()) {
          output += `${name}{${labelKey}} ${labelValue}\n`;
        }
      } else if (metric.type === 'histogram') {
        // Simplified histogram output
        if (metric.values && metric.values.length > 0) {
          const sum = metric.values.reduce((a: number, b: number) => a + b, 0);
          const count = metric.values.length;
          
          output += `${name}_sum ${sum}\n`;
          output += `${name}_count ${count}\n`;
        }
      }
      
      output += '\n';
    }
    
    return output;
  }

  /**
   * Reset all metrics
   */
  resetMetrics(): void {
    for (const metric of this.metrics.values()) {
      if (metric.type === 'counter') {
        metric.value = 0;
      } else if (metric.type === 'gauge') {
        metric.value = null;
      } else if (metric.type === 'histogram') {
        metric.values = [];
      }
      
      metric.labels = new Map();
      if (metric.labeledValues) {
        metric.labeledValues = new Map();
      }
    }
  }

  /**
   * Helper to create a string key from labels object
   */
  private getLabelKey(labels: Record<string, string>): string {
    if (Object.keys(labels).length === 0) {
      return '';
    }
    
    return Object.entries(labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
  }
}