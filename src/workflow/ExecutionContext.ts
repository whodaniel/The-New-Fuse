/**
 * ExecutionContext for workflow execution
 * Manages the runtime state and data flow during workflow execution
 */

export interface WorkflowMetadata {
  workflowId: string;
  startTime: Date;
  currentNodeId?: string;
  variables: Record<string, any>;
  executionHistory: ExecutionStep[];
}

export interface ExecutionStep {
  nodeId: string;
  timestamp: Date;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  status: "pending" | "running" | "completed" | "failed";
  error?: string;
}

export class ExecutionContext {
  private data: Map<string, any> = new Map();
  private nodeOutputs: Map<string, Record<string, any>> = new Map();

  constructor(
    public readonly workflowId: string,
    private metadata: WorkflowMetadata,
  ) {}

  /**
   * Get input value for a specific node and port
   */
  async getInputValue(nodeId: string, port: string): Promise<any> {
    // Check if there's a direct input mapping
    const key = `${nodeId}.${port}`;
    if (this.data.has(key)) {
      return this.data.get(key);
    }

    // Check if this port is connected to another node's output
    const connectionKey = `connection.${nodeId}.${port}`;
    if (this.data.has(connectionKey)) {
      const connection = this.data.get(connectionKey);
      return this.getOutputValue(
        connection.sourceNodeId,
        connection.sourcePort,
      );
    }

    return undefined;
  }

  /**
   * Get output value from a completed node
   */
  async getOutputValue(nodeId: string, port: string): Promise<any> {
    const outputs = this.nodeOutputs.get(nodeId);
    return outputs?.[port];
  }

  /**
   * Set output for a node
   */
  setNodeOutput(nodeId: string, outputs: Record<string, any>): void {
    this.nodeOutputs.set(nodeId, outputs);

    // Update execution history
    this.metadata.executionHistory.push({
      nodeId,
      timestamp: new Date(),
      inputs: {},
      outputs,
      status: "completed",
    });
  }

  /**
   * Set variable in the execution context
   */
  setVariable(key: string, value: any): void {
    this.data.set(key, value);
    this.metadata.variables[key] = value;
  }

  /**
   * Get variable from the execution context
   */
  getVariable(key: string): any {
    return this.data.get(key) || this.metadata.variables[key];
  }

  /**
   * Get workflow metadata
   */
  getMetadata(): WorkflowMetadata {
    return { ...this.metadata };
  }

  /**
   * Set connection between nodes
   */
  setConnection(
    targetNodeId: string,
    targetPort: string,
    sourceNodeId: string,
    sourcePort: string,
  ): void {
    const connectionKey = `connection.${targetNodeId}.${targetPort}`;
    this.data.set(connectionKey, { sourceNodeId, sourcePort });
  }
}
