import { v4 as uuidv4 } from 'uuid';
import { Node, NodeType } from './types.js';
import { ApiNode, ApiNodeConfig } from './api-node.js';
import { VectorStoreNode, VectorStoreNodeConfig } from './vector-store-node.js';
import { DocumentProcessingNode, DocumentProcessingNodeConfig } from './document-processing-node.js';
import { WebhookNode, WebhookNodeConfig } from './webhook-node.js';
import { ApiUsageTracker } from './api-usage-tracker.js';
import { ZapierWebhook } from './zapier-webhook.js';
import { VectorDatabase } from './vector-database.js';
import { DocumentProcessor } from './document-processor.js';

// Define node type categories for UI organization
export interface NodeTypeInfo {
  id: string;
  name: string;
  description: string;
  category: string;
  defaultConfig: any;
}

// Node factory to create different types of nodes
export class NodeFactory {
  private apiUsageTracker: ApiUsageTracker;
  private zapierWebhook: ZapierWebhook;
  private vectorDb: VectorDatabase;
  private documentProcessor: DocumentProcessor;
  
  // Registry of available node types
  private nodeTypes: NodeTypeInfo[] = [
    {
      id: 'api',
      name: 'API',
      description: 'Make HTTP requests to external APIs',
      category: 'Data Sources',
      defaultConfig: { method: 'GET' }
    },
    {
      id: 'vectorStore',
      name: 'Vector Store',
      description: 'Store and retrieve vector embeddings',
      category: 'Data Sources',
      defaultConfig: { operation: 'store', collectionName: 'default' }
    },
    {
      id: 'documentProcessing',
      name: 'Document Processing',
      description: 'Process documents and extract information',
      category: 'Processing',
      defaultConfig: { operation: 'parse', outputFormat: 'text' }
    },
    {
      id: 'webhook',
      name: 'Webhook',
      description: 'Send and receive data via webhooks',
      category: 'Integrations',
      defaultConfig: { operation: 'trigger', method: 'POST' }
    },
    {
      id: 'ai',
      name: 'AI',
      description: 'Use AI models for text generation, classification, etc.',
      category: 'Processing',
      defaultConfig: { model: 'gpt-3.5-turbo' }
    },
    {
      id: 'code',
      name: 'Code',
      description: 'Run custom JavaScript code',
      category: 'Utilities',
      defaultConfig: { language: 'javascript' }
    },
    {
      id: 'text',
      name: 'Text',
      description: 'Create and manipulate text content',
      category: 'Utilities',
      defaultConfig: { operation: 'transform' }
    },
    {
      id: 'filter',
      name: 'Filter',
      description: 'Filter data based on conditions',
      category: 'Utilities',
      defaultConfig: { condition: 'equals' }
    },
    {
      id: 'zapier',
      name: 'Zapier',
      description: 'Integrate with Zapier automations',
      category: 'Integrations',
      defaultConfig: { service: 'zapier' }
    }
  ];
  
  constructor(
    apiUsageTracker: ApiUsageTracker,
    zapierWebhook: ZapierWebhook,
    vectorDb: VectorDatabase,
    documentProcessor: DocumentProcessor
  ) {
    this.apiUsageTracker = apiUsageTracker;
    this.zapierWebhook = zapierWebhook;
    this.vectorDb = vectorDb;
    this.documentProcessor = documentProcessor;
  }
  
  // Get available node types grouped by category
  getAvailableNodeTypes() {
    const categories = {};
    
    // Group node types by category
    this.nodeTypes.forEach(nodeType => {
      if (!categories[nodeType.category]) {
        categories[nodeType.category] = {
          name: nodeType.category,
          types: []
        };
      }
      
      categories[nodeType.category].types.push({
        id: nodeType.id,
        name: nodeType.name,
        description: nodeType.description,
        defaultConfig: nodeType.defaultConfig
      });
    });
    
    return Object.values(categories);
  }
  
  // Create a node instance based on type and configuration
  createNode(type: NodeType, name: string, config: any): Node {
    const nodeId = uuidv4();
    
    switch (type) {
      case 'api':
        return new ApiNode(nodeId, name, config as ApiNodeConfig, this.apiUsageTracker);
        
      case 'vectorStore':
        return new VectorStoreNode(
          nodeId, 
          name, 
          config as VectorStoreNodeConfig, 
          this.vectorDb,
          this.apiUsageTracker
        );
        
      case 'documentProcessing':
        return new DocumentProcessingNode(
          nodeId,
          name,
          config as DocumentProcessingNodeConfig,
          this.documentProcessor,
          this.apiUsageTracker
        );
        
      case 'webhook':
        return new WebhookNode(
          nodeId,
          name,
          config as WebhookNodeConfig,
          this.zapierWebhook,
          this.apiUsageTracker
        );
        
      // Additional node types would be implemented here
        
      default:
        throw new Error(`Unsupported node type: ${type}`);
    }
  }
  
  // Register a new node type
  registerNodeType(nodeType: NodeTypeInfo) {
    // Check if node type with this ID already exists
    const existingIndex = this.nodeTypes.findIndex(nt => nt.id === nodeType.id);
    
    if (existingIndex >= 0) {
      // Update existing node type
      this.nodeTypes[existingIndex] = nodeType;
    } else {
      // Add new node type
      this.nodeTypes.push(nodeType);
    }
  }
  
  // Remove a node type from registry
  unregisterNodeType(nodeTypeId: string) {
    this.nodeTypes = this.nodeTypes.filter(nt => nt.id !== nodeTypeId);
  }
}
