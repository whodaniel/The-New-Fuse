export enum ServiceStatus {
  RUNNING = "RUNNING",
  STOPPED = "STOPPED",
  ERROR = "ERROR",
  STARTING = "STARTING",
  STOPPING = "STOPPING"
}

export interface ServiceConfig {
  name: string;
  port?: number;
  host?: string;
  [key: string]: unknown;
}

export interface ServiceInfo {
  name: string;
  status: ServiceStatus;
  uptime?: number;
  config: ServiceConfig;
}