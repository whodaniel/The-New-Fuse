// filepath: src/entities/workflow.entity.ts
import { BaseEntity } from './base.entity.js';

export interface WorkflowTemplate extends BaseEntity {
  name: string;
  description?: string;
  version: string;
  nodes: Record<string, WorkflowNode>;
  edges: WorkflowEdge[];
  metadata?: Record<string, any>;
  status: string;
}

export interface WorkflowNode {
  id: string;
  type: string;
  data: Record<string, any>;
  position: {
    x: number;
    y: number;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  data?: Record<string, any>;
}

export interface WorkflowExecution extends BaseEntity {
  templateId: string;
  name: string;
  status: string;
  startedAt: Date;
  completedAt?: Date;
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: Record<string, any>;
  currentNodeId?: string;
  executedNodes: Record<string, WorkflowNodeResult>;
  metadata?: Record<string, any>;
}

export interface WorkflowNodeResult {
  nodeId: string;
  status: string;
  startedAt: Date;
  completedAt?: Date;
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: Record<string, any>;
}
