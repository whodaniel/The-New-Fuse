import { generateId, generateTimestamp, pickRandom } from './utils.js';
import type { GeneratedUser } from './userGenerator.js';

export interface GenerateWorkflowOptions {
  nodeCount?: number;
  edgeCount?: number;
  withMetadata?: boolean;
  withVariables?: boolean;
  creator?: GeneratedUser;
}

export interface WorkflowNode {
  id: string;
  type: string;
  position: {
    x: number;
    y: number;
  };
  data: {
    label: string;
    inputs?: string[];
    outputs?: string[];
    config?: Record<string, any>;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  animated?: boolean;
  label?: string;
}

export interface GeneratedWorkflow {
  id: string;
  name: string;
  description?: string;
  creator?: GeneratedUser;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  metadata: Record<string, any>;
  isActive: boolean;
  variables: Record<string, any>;
  triggers: Record<string, any>[];
  createdAt: Date;
  updatedAt: Date;
  lastExecutedAt?: Date;
  executionCount: number;
  statistics: {
    averageExecutionTime?: number;
    successRate?: number;
    lastExecutionStatus?: string;
  };
}

const NODE_TYPES = ['task', 'decision', 'api', 'transform', 'notification'];
const EDGE_TYPES = ['default', 'success', 'failure', 'conditional'];

const DEFAULT_OPTIONS: GenerateWorkflowOptions = {
  nodeCount: 5,
  edgeCount: 4,
  withMetadata: true,
  withVariables: false
};

export const generateWorkflow = (options: GenerateWorkflowOptions = {}): GeneratedWorkflow => {
  const finalOptions = { ...DEFAULT_OPTIONS, ...options };
  const nodes = generateNodes(finalOptions.nodeCount || 0);
  const edges = generateEdges(nodes, finalOptions.edgeCount || 0);

  const workflow: GeneratedWorkflow = {
    id: generateId(),
    name: `Test Workflow ${generateId().slice(0, 8)}`,
    description: 'A test workflow generated for testing purposes',
    creator: finalOptions.creator,
    nodes,
    edges,
    metadata: finalOptions.withMetadata ? generateWorkflowMetadata() : {},
    isActive: true,
    variables: finalOptions.withVariables ? generateWorkflowVariables() : {},
    triggers: generateTriggers(),
    createdAt: generateTimestamp({ past: true }),
    updatedAt: generateTimestamp({ past: true }),
    lastExecutedAt: generateTimestamp({ past: true }),
    executionCount: Math.floor(Math.random() * 100),
    statistics: generateWorkflowStatistics()
  };

  return workflow;
};

export const generateWorkflows = (count: number, options: GenerateWorkflowOptions = {}): GeneratedWorkflow[] => {
  return Array.from({ length: count }, () => generateWorkflow(options));
};

const generateNodes = (count: number): WorkflowNode[] => {
  return Array.from({ length: count }, (_, index) => ({
    id: generateId(),
    type: pickRandom(NODE_TYPES),
    position: {
      x: Math.random() * 800,
      y: Math.random() * 600
    },
    data: {
      label: `Node ${index + 1}`,
      inputs: ['input1', 'input2'],
      outputs: ['output1', 'output2'],
      config: {
        timeout: Math.random() * 5000,
        retries: Math.floor(Math.random() * 3)
      }
    }
  }));
};

const generateEdges = (nodes: WorkflowNode[], count: number): WorkflowEdge[] => {
  const edges: WorkflowEdge[] = [];
  for (let i = 0; i < count && i < nodes.length - 1; i++) {
    edges.push({
      id: generateId(),
      source: nodes[i].id,
      target: nodes[i + 1].id,
      type: pickRandom(EDGE_TYPES),
      animated: Math.random() > 0.5,
      label: Math.random() > 0.7 ? `Connection ${i + 1}` : undefined
    });
  }
  return edges;
};

const generateWorkflowMetadata = (): Record<string, any> => ({
  version: '1.0.0',
  tags: ['test', 'generated'],
  category: pickRandom(['automation', 'integration', 'processing']),
  priority: pickRandom(['low', 'medium', 'high'])
});

const generateWorkflowVariables = (): Record<string, any> => ({
  apiKey: 'test-api-key',
  baseUrl: 'https://api.example.com',
  timeout: 5000,
  retryCount: 3
});

const generateTriggers = (): Record<string, any>[] => ([{
  type: 'schedule',
  config: {
    cron: '0 * * * *'
  }
}]);

const generateWorkflowStatistics = (): any => ({
  averageExecutionTime: Math.random() * 1000,
  successRate: Math.random() * 100,
  lastExecutionStatus: pickRandom(['success', 'failed', 'partial'])
});