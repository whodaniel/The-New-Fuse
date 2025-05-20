export interface LogEntity {
  id: string;
  level: string;
  message: string;
  timestamp: Date;
  context?: string;
  trace?: string;
  metadata?: Record<string, any>;
}
