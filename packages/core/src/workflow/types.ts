/**
 * Workflow Types
 * Core types for workflow definition and execution
 */

export interface WorkflowNodePort {
  // Implementation needed
}
  name: string;
  type: 'input' | 'output';
  dataType: string;
  required?: boolean;
}

export interface WorkflowStepConfig {
  // Implementation needed
}
  [key: string]: any;
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  transform?: string;
  condition?: string;
  iterationPath?: string;
  maxIterations?: number;
  parallel?: boolean;
  timeout?: number;
  retry?: {
  // Implementation needed
}
    attempts: number;
    delay: number;
  };
}

export interface WorkflowStep {
  // Implementation needed
}
  id: string;
  name: string;
  type: WorkflowStepType;
  description?: string;
  config: WorkflowStepConfig;
  dependencies?: string[];
  retryPolicy?: {
  // Implementation needed
}
    maxAttempts: number;
    backoff: 'linear' | 'exponential';
  };
  timeout?: number;
  metadata?: Record<string, any>;
}

export interface WorkflowTemplate {
  // Implementation needed
}
  id: string;
  name: string;
  version: string;
  description?: string;
  tags?: string[];
  steps: WorkflowStep[];
  metadata?: {
  // Implementation needed
}
    author?: string;
    createdAt?: string;
    updatedAt?: string;
    category?: string;
    icon?: string;
  };
  variables?: Record<string, any>;
  triggers?: {
  // Implementation needed
}
    type: 'manual' | 'scheduled' | 'webhook' | 'event';
    config?: any;
  }[];
}

export interface WorkflowExecution {
  // Implementation needed
}
  id: string;
  templateId: string;
  templateVersion: string;
  status: WorkflowStatus;
  context: Record<string, any>;
  steps: {
  // Implementation needed
}
    [stepId: string]: {
  // Implementation needed
}
      status: WorkflowStatus;
      output?: any;
      error?: string;
      startedAt?: string;
      completedAt?: string;
      attempts?: number;
    };
  };
  startedAt: string;
  completedAt?: string;
  createdBy: string;
  metadata?: Record<string, any>;
}

export enum WorkflowStatus {
  // Implementation needed
}
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  PAUSED = 'paused',
  STOPPED = 'stopped',
  DRAFT = 'draft',
}

export enum WorkflowStepType {
  // Implementation needed
}
  API_CALL = 'API_CALL',
  DATA_TRANSFORM = 'DATA_TRANSFORM',
  CONDITION = 'CONDITION',
  LOOP = 'LOOP',
  AGENT = 'AGENT',
  TASK = 'TASK',
  PARALLEL = 'PARALLEL',
  SEQUENCE = 'SEQUENCE',
  SUB_WORKFLOW = 'SUB_WORKFLOW',
}

export enum WorkflowCategory {
  // Implementation needed
}
  ACCESSIBILITY = 'ACCESSIBILITY',
  I18N = 'I18N',
  SECURITY = 'SECURITY',
  PERFORMANCE = 'PERFORMANCE',
  DOCUMENTATION = 'DOCUMENTATION',
}

export interface WorkflowExecutionContext {
  // Implementation needed
}
  template: WorkflowTemplate;
  execution: WorkflowExecution;
  variables: Record<string, any>;
  globalContext: Record<string, any>;
}

export interface WorkflowExecutionResult {
  // Implementation needed
}
  success: boolean;
  output?: any;
  error?: string;
  steps: {
  // Implementation needed
}
    [stepId: string]: {
  // Implementation needed
}
      success: boolean;
      output?: any;
      error?: string;
      duration: number;
    };
  };
  totalDuration: number;
}

export interface WorkflowValidationResult {
  // Implementation needed
}
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface WorkflowMigration {
  // Implementation needed
}
  fromVersion: string;
  toVersion: string;
  migrate(template: WorkflowTemplate) => WorkflowTemplate;
}