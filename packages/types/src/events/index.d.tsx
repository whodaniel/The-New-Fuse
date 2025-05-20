/**
 * Event types for the application
 */

export declare const EventTypes: {
  SYSTEM: string;
  USER: string;
  AGENT: string;
  TASK: string;
  WORKFLOW: string;
  NOTIFICATION: string;
};

export declare const EventPriority: {
  LOW: string;
  MEDIUM: string;
  HIGH: string;
  CRITICAL: string;
};

export interface BaseEvent {
  id: string;
  type: string;
  timestamp: Date;
  source: string;
  priority: string;
  payload?: Record<string, unknown>;
}
