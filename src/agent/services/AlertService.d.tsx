export type AlertSeverity = "info" | "warning" | "error" | "critical";
export interface Alert {
  id: string;
  severity: AlertSeverity;
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  acknowledged: boolean;
}
export declare class AlertService {
  private eventEmitter;
  private readonly logger;
  private readonly alerts;
  constructor(eventEmitter: EventEmitter2);
  createAlert(
    severity: AlertSeverity,
    message: string,
    metadata?: Record<string, any>,
  ): Promise<Alert>;
  acknowledgeAlert(alertId: string): Promise<void>;
  getActiveAlerts(): Promise<Alert[]>;
  private cleanupOldAlerts;
}
