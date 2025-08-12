/**
 * Workflow Node Handlers
 * Export all workflow node handlers
 */

export * from './llm-node';
export * from './tool-node';
export * from './condition-node';
export * from './transform-node';
export * from './data-node';
export * from './api-node';
export * from './webhook-node';
export * from './notification-node';
export * from './vector-store-node';
export * from './document-processing-node';
export * from './storage-node';
// Node type definitions
export enum WorkflowNodeType {
  LLM = 'llm',
  TOOL = 'tool',
  CONDITION = 'condition',
  TRANSFORM = 'transform',
  DATA = 'data',
  API = 'api',
  WEBHOOK = 'webhook',
  NOTIFICATION = 'notification',
  VECTOR_STORE = 'vectorStore',
  DOCUMENT_PROCESSING = 'documentProcessing',
  STORAGE = 'storage',
}

// Node handler registry
export interface WorkflowNodeHandler {
  type: WorkflowNodeType;
  execute(config: any, context: any): Promise<any>;
  validate(config: any): boolean;
}