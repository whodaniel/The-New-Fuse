declare module '@the-new-fuse/database' {
  export class RedisService {
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttl?: number): Promise<void>;
    del(key: string): Promise<void>;
  }
}

declare module '@the-new-fuse/types' {
  export interface Workflow {
    id: string;
    name: string;
    description?: string;
    status: string;
    steps: WorkflowStep[];
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
  }

  export interface WorkflowExecution {
    id: string;
    workflowId: string;
    status: string;
    startedAt: Date;
    completedAt?: Date;
    result?: any;
    error?: string;
    stepResults: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
  }

  export interface WorkflowStep {
    id: string;
    workflowId: string;
    name: string;
    type: string;
    config: any;
    position: any;
    connections: any;
    createdAt: Date;
    updatedAt: Date;
  }

  export interface CreateWorkflowDto {
    name: string;
    description?: string;
    status?: string;
    steps?: Partial<WorkflowStep>[];
  }

  export interface UpdateWorkflowDto {
    name?: string;
    description?: string;
    status?: string;
    steps?: Partial<WorkflowStep>[];
  }
}

declare module '@nestjs/terminus' {
  export class HealthCheckService {
    check(indicators: Array<() => Promise<any>>): Promise<any>;
  }

  export class DrizzleHealthIndicator {
    pingCheck(name: string, options: any): Promise<any>;
  }

  export function HealthCheck(): MethodDecorator;

  export interface HealthIndicatorResult {
    status: string;
    [key: string]: any;
  }
}
