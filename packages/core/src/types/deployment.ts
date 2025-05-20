export type Environment = 'development' | 'staging' | 'production';

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

export interface DeploymentResult {
  success: boolean;
  environment: Environment;
  deploymentId?: string;
  errors?: string[];
  warnings?: string[];
}

export interface DeploymentHealth {
  healthy: boolean;
  reason?: string;
  metrics?: Record<string, number>;
}

export interface DeploymentMetrics {
  responseTime: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
  requestsPerSecond: number;
}

export enum DeploymentStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  ROLLED_BACK = 'ROLLED_BACK'
}

export interface DeploymentConfig {
  environment: Environment;
  version: string;
  replicas: number;
  resources: {
    requests: {
      cpu: string;
      memory: string;
    };
    limits: {
      cpu: string;
      memory: string;
    };
  };
  healthChecks: {
    minTestCoverage: number;
    maxErrorRate: number;
    maxResponseTime: number;
    requiredSecurityScans: boolean;
  };
}

export interface RollbackConfig {
  automatic: boolean;
  healthCheckTimeout: number;
  maxRetries: number;
  notificationChannels: string[];
}