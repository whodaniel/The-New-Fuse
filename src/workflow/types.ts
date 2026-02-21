/**
 * Workflow Types
 * Core types for workflow definition and execution
 */

export interface WorkflowNodePort {
  name: string;
  type: "input" | "output";
  dataType: string;
  required?: boolean;
  defaultValue?: any;
}

export interface WorkflowNodeConfig {
  [key: string]: any;
}

export interface WorkflowNode {
  id: string;
  type: string;
  name: string;
  description?: string;
  config: WorkflowNodeConfig;

  /**
   * Get input port names
   */
  getInputPorts(): string[];

  /**
   * Get output port names
   */
  getOutputPorts(): string[];

  /**
   * Process inputs and return outputs
   */
  process(inputs: any): Promise<any>;

  /**
   * Validate the node configuration
   */
  validate(): boolean;
}

export abstract class BaseWorkflowNode implements WorkflowNode {
  constructor(
    public readonly id: string,
    public readonly type: string,
    public readonly name: string,
    public readonly config: WorkflowNodeConfig,
    public readonly description?: string,
  ) {}

  abstract getInputPorts(): string[];
  abstract getOutputPorts(): string[];
  abstract process(inputs: any): Promise<any>;

  validate(): boolean {
    return true; // Override in specific node types
  }
}

/**
 * A2A Agent Node - represents an agent in the workflow
 */
export class A2AAgentNode extends BaseWorkflowNode {
  constructor(
    id: string,
    name: string,
    config: WorkflowNodeConfig & {
      agentId: string;
      endpoint?: string;
      capabilities?: string[];
    },
    description?: string,
  ) {
    super(id, "A2A_AGENT", name, config, description);
  }

  getInputPorts(): string[] {
    return ["message", "context"];
  }

  getOutputPorts(): string[] {
    return ["response", "error"];
  }

  async process(inputs: any): Promise<any> {
    // This will be handled by the A2AWorkflowExecutor
    // with proper encryption and messaging
    throw new Error(
      "A2A Agent nodes should be processed by A2AWorkflowExecutor",
    );
  }
}

/**
 * Workflow Status
 */
export enum WorkflowStatus {
  PENDING = "pending",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

/**
 * Workflow Definition
 */
export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  version: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  variables?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Connection between workflow nodes
 */
export interface WorkflowConnection {
  id: string;
  sourceNodeId: string;
  sourcePort: string;
  targetNodeId: string;
  targetPort: string;
}

/**
 * Workflow Instance
 */
export interface WorkflowInstance {
  id: string;
  definitionId: string;
  status: WorkflowStatus;
  startTime: Date;
  endTime?: Date;
  currentNodeId?: string;
  variables: Record<string, any>;
  error?: string;
  metadata?: Record<string, any>;
}
