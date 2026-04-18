import { ResourceStrategy } from './resource-protocol.js';

export interface OrchestrationTask {
  id: string;
  type: 'question' | 'generation' | 'analysis' | 'review' | 'continuation';
  priority: 'low' | 'medium' | 'high' | 'critical';

  // Task definition
  title: string;
  description: string;
  instructions: string[];

  // Targeting
  targetAgents?: string[]; // Specific agents, or null for any
  requiredCapabilities?: string[];

  // Response handling
  requiresResponse: boolean;
  responseTimeout: number; // ms
  maxRetries: number;

  // Chaining
  dependencies?: string[]; // Task IDs that must complete first
  nextTasks?: string[]; // Tasks to trigger on completion

  // Resource Strategy
  resourceStrategy?: ResourceStrategy;

  // Metadata
  correlationId: string;
  parentTaskId?: string;
  createdAt: number;
  createdBy: string;
}

export interface TaskResult {
  taskId: string;
  status: 'completed' | 'failed' | 'timeout' | 'cancelled';
  result?: unknown;
  error?: string;
  completedBy: string;
  completedAt: number;
  duration: number;
}
