/**
 * N8N Workflow Types
 * Comprehensive type definitions for n8n workflow integration
 */

export interface WorkflowNode {
  id: string;
  name: string;
  type: string;
  typeVersion?: number;
  position: [number, number];
  parameters: Record<string, any>;
  credentials?: Record<string, any>;
  webhookId?: string;
  disabled?: boolean;
}

export interface WorkflowConnection {
  node: string;
  type: string;
  index: number;
}

export interface WorkflowConnections {
  [nodeName: string]: {
    [outputType: string]: WorkflowConnection[][];
  };
}

export interface TriggerNode extends WorkflowNode {
  type: 'trigger' | 'webhook' | 'schedule' | 'manual';
  webhookUrl?: string;
  scheduleExpression?: string;
}

export interface WorkflowSettings {
  saveDataErrorExecution?: string;
  saveDataSuccessExecution?: string;
  saveManualExecutions?: boolean;
  callerPolicy?: string;
  timezone?: string;
}

export interface WorkflowMetadata {
  id: string;
  name: string;
  description: string;
  tags: string[];
  category: WorkflowCategory;
  author?: string;
  createdAt?: Date;
  updatedAt?: Date;
  source: WorkflowSource;
  complexity?: 'simple' | 'medium' | 'complex';
  useCases?: string[];
  requiredCredentials?: string[];
}

export interface N8nWorkflow {
  id: string;
  name: string;
  description: string;
  category: WorkflowCategory;
  nodes: WorkflowNode[];
  connections: WorkflowConnections;
  triggers: TriggerNode[];
  source: WorkflowSource;
  tags: string[];
  jsonDefinition: any;
  metadata: WorkflowMetadata;
  settings?: WorkflowSettings;
  staticData?: any;
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type WorkflowCategory =
  | 'data-processing'
  | 'api-integrations'
  | 'automation'
  | 'ai-agents'
  | 'database-operations'
  | 'file-management'
  | 'notifications'
  | 'webhooks'
  | 'crm'
  | 'email'
  | 'social-media'
  | 'analytics'
  | 'DevOps'
  | 'security'
  | 'other';

export type WorkflowSource =
  | 'Zie619/n8n-workflows'
  | 'enescingoz/awesome-n8n-templates'
  | 'Danitilahun/n8n-workflow-templates'
  | 'custom';

export interface WorkflowSearchQuery {
  query?: string;
  category?: WorkflowCategory;
  tags?: string[];
  source?: WorkflowSource;
  complexity?: 'simple' | 'medium' | 'complex';
  limit?: number;
  offset?: number;
}

export interface WorkflowSearchResult {
  workflows: N8nWorkflow[];
  total: number;
  limit: number;
  offset: number;
  categories: { [key in WorkflowCategory]?: number };
}

export interface WorkflowImportRequest {
  workflowId: string;
  n8nInstanceUrl: string;
  apiKey?: string;
  activate?: boolean;
}

export interface WorkflowImportResponse {
  success: boolean;
  workflowId?: string;
  message?: string;
  error?: string;
}

export interface WorkflowStats {
  totalWorkflows: number;
  byCategory: { [key in WorkflowCategory]?: number };
  bySource: { [key in WorkflowSource]?: number };
  byComplexity: {
    simple: number;
    medium: number;
    complex: number;
  };
  mostPopularTags: Array<{ tag: string; count: number }>;
  lastSync: Date;
}

export interface WorkflowFetchResult {
  success: boolean;
  workflowsAdded: number;
  workflowsUpdated: number;
  errors: string[];
  source: WorkflowSource;
}

export interface NodeTypeInfo {
  type: string;
  displayName: string;
  description: string;
  category: string;
  credentials?: string[];
}

export interface WorkflowAnalysis {
  nodeCount: number;
  nodeTypes: NodeTypeInfo[];
  triggerTypes: string[];
  complexity: 'simple' | 'medium' | 'complex';
  estimatedExecutionTime?: number;
  requiredCredentials: string[];
  apiServices: string[];
}

export interface CategoryConfig {
  name: WorkflowCategory;
  displayName: string;
  description: string;
  keywords: string[];
  nodeTypes: string[];
  priority: number;
}
