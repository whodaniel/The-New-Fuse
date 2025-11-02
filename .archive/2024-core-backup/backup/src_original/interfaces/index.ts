/**
 * Base interface for system events
 */
export interface SystemEvent {
  type: string;
  timestamp: Date;
  data: any;
}

/**
 * Interface for monitoring metrics
 */
export interface MonitoringMetrics {
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
  operation: string;
  timeMs: number;
  timestamp: Date;
}

/**
 * Interface for agent communication
 */
export interface AgentMessage {
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
  endpoint: string;
  method: string;
  responseTime: number;
  status: number;
  timestamp: Date;
}