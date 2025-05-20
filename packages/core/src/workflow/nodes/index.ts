import { LLMNodeHandler } from './llm-node.js';
import { ToolNodeHandler } from './tool-node.js';
import { ConditionNodeHandler } from './condition-node.js';
import { TransformNodeHandler } from './transform-node.js';
import { DataNodeHandler } from './data-node.js';
import { APINodeHandler } from './api-node.js';
import { WebhookNodeHandler } from './webhook-node.js';
import { NotificationNodeHandler } from './notification-node.js';
import { VectorStoreNodeHandler } from './vector-store-node.js';
import { DocumentProcessingNodeHandler } from './document-processing-node.js';
import { StorageNodeHandler } from './storage-node.js';

export {
  LLMNodeHandler,
  ToolNodeHandler,
  ConditionNodeHandler,
  TransformNodeHandler,
  DataNodeHandler,
  APINodeHandler,
  WebhookNodeHandler,
  NotificationNodeHandler,
  VectorStoreNodeHandler,
  DocumentProcessingNodeHandler,
  StorageNodeHandler
};

// Node type constants
export const NODE_TYPES = {
  LLM: 'llm',
  TOOL: 'tool',
  CONDITION: 'condition',
  TRANSFORM: 'transform',
  DATA: 'data',
  API: 'api',
  WEBHOOK: 'webhook',
  NOTIFICATION: 'notification',
  VECTOR_STORE: 'vectorStore',
  DOCUMENT_PROCESSING: 'documentProcessing',
  STORAGE: 'storage'
};

// Factory function to get all node handlers
export function createNodeHandlers(dependencies: any): any {
  return {
    [NODE_TYPES.LLM]: new LLMNodeHandler(dependencies),
    [NODE_TYPES.TOOL]: new ToolNodeHandler(dependencies),
    [NODE_TYPES.CONDITION]: new ConditionNodeHandler(dependencies),
    [NODE_TYPES.TRANSFORM]: new TransformNodeHandler(dependencies),
    [NODE_TYPES.DATA]: new DataNodeHandler(dependencies),
    [NODE_TYPES.API]: new APINodeHandler(dependencies),
    [NODE_TYPES.WEBHOOK]: new WebhookNodeHandler(dependencies),
    [NODE_TYPES.NOTIFICATION]: new NotificationNodeHandler(dependencies),
    [NODE_TYPES.VECTOR_STORE]: new VectorStoreNodeHandler(dependencies),
    [NODE_TYPES.DOCUMENT_PROCESSING]: new DocumentProcessingNodeHandler(dependencies),
    [NODE_TYPES.STORAGE]: new StorageNodeHandler(dependencies)
  };
}
