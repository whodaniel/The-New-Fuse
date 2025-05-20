export declare class Metric {
    id: string; // Changed : to ;
    type: string;
    data: Record<string, any>; // Changed : to ;
    timestamp: Date;
    toJSON(): {
        id: any;
        type: string;
        data: any;
        timestamp: Date;
    };
    static createPerformanceMetric(data: {
        duration: number;
        operation: string;
        success: boolean;
        metadata?: Record<string, any>;
    }): Metric;
}

export interface MetricEntity {
  id: string;
  name: string;
  value: number;
  timestamp: Date;
  type: string; // e.g., 'gauge', 'counter', 'histogram'
  source?: string; // e.g., 'cpu', 'memory', 'custom_event'
  tags?: Record<string, string>; // For additional metadata
}
