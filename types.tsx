export interface User {
  id: string;
  email: string;
  name: string;
  plan?: 'free' | 'basic' | 'premium' | 'enterprise';
  createdAt: Date;
  updatedAt: Date;
}

export interface NodeConfig {
  [key: string]: any;
}

export interface NodeInput {
  userId: string;
  workflowId?: string;
  data?: any;
  [key: string]: any;
}

export interface NodeOutput {
  success: boolean;
  data?: any;
  error?: string;
  warnings?: string[];
}

export type NodeType = 'api' | 'vectorStore' | 'documentProcessing' | 'webhook' | 'ai' | 'code' | 'text' | 'filter' | 'zapier';

export interface Node {
  id: string;
  type: string;
  name: string;
  config: NodeConfig;
  execute(input: NodeInput): Promise<NodeOutput>;
}

export interface NodeConnection {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  condition?: string;
}

export interface Workflow {
  id: string;
  userId: string;
  name: string;
  description?: string;
  nodes: Node[];
  connections: NodeConnection[];
  createdAt: Date;
  updatedAt: Date;
  published?: boolean;
  schedule?: WorkflowSchedule;
  version: number;
  tags?: string[];
}

export interface WorkflowExecutionOptions {
  debugMode?: boolean;
  timeout?: number;
  customInput?: Record<string, any>;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'success' | 'failed' | 'timeout';
  results?: Record<string, any>;
  error?: string;
  logs?: string[];
  metrics?: {
    totalDuration: number;
    nodeExecutions: {
      nodeId: string;
      duration: number;
      status: 'success' | 'failed';
    }[];
  };
}

export interface WorkflowSchedule {
  enabled: boolean;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';
  time?: string;
  days?: string[];
  dayOfMonth?: number;
  cronExpression?: string;
  startDate: string;
  endDate?: string;
}

export interface WorkflowEditor {
  addNode(node: Node): void;
  removeNode(nodeId: string): void;
  updateNodeConfig(nodeId: string, config: NodeConfig): void;
  connectNodes(sourceNodeId: string, targetNodeId: string, sourceHandle?: string, targetHandle?: string): void;
  removeConnection(connectionId: string): void;
  getWorkflowState(): Workflow;
}

export interface AIAgentMessage<T> {
  originExtension: string;
  targetExtensions: string[];
  cryptographicSignature: string;
  protocolVersion: number;
  sequenceNumber: number;
  headers: {
    jwt?: string;
    interExtensionNonce: string;
    timestamp: string;
  };
  messageId: string;
  source: string;
  destination: string;
  timestamp: string;
  headers: AuthHeaders;
  payload: T;
  error?: ErrorPayload;
}

interface AuthHeaders {
  authToken: string;
  signature: string;
  sequenceNumber: number;
}

interface ErrorPayload {
  code: string;
  message: string;
  retryable: boolean;
  stackTrace?: string[];
}
