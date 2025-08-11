/**
 * Base interface for system events
 */
export interface SystemEvent {
  // Implementation needed
}
  type: string;
  timestamp: Date;
  data: any;
}

/**
 * Interface for monitoring metrics
 */
export interface MonitoringMetrics {
  // Implementation needed
}
  connections: number;
  messages: number;
  errors: number;
  latency: LatencyRecord[];
  events?: SystemEvent[];
  [key: string]: any;
}

/**
 * Interface for latency records
 */
export interface LatencyRecord {
  // Implementation needed
}
  operation: string;
  timeMs: number;
  timestamp: Date;
}

/**
 * Interface for agent communication
 */
export interface AgentMessage {
  // Implementation needed
}
  from: string;
  to: string;
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Interface for API metrics
 */
export interface ApiMetrics {
  // Implementation needed
}
  endpoint: string;
  method: string;
  responseTime: number;
  status: number;
  timestamp: Date;
}