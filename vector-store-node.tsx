import { Node, NodeConfig, NodeInput, NodeOutput } from './types.js';
import { VectorDatabase } from './vector-database.js';
import { ApiUsageTracker } from './api-usage-tracker.js';

export interface VectorStoreNodeConfig extends NodeConfig {
  operation: 'store' | 'retrieve' | 'update' | 'delete' | 'similarity' | 'cluster';
  collectionName: string;
  embeddingModel?: string;
  searchTopK?: number;
  searchThreshold?: number;
  metadata?: Record<string, string>;
  idField?: string;
  clusterCount?: number;
  similarityMetric?: 'cosine' | 'euclidean' | 'dot';
}

export class VectorStoreNode implements Node {
  id: string;
  type: string = 'vectorStore';
  name: string;
  config: VectorStoreNodeConfig;
  private vectorDb: VectorDatabase;
  private apiUsageTracker?: ApiUsageTracker;
  
  constructor(
    id: string, 
    name: string, 
    config: VectorStoreNodeConfig, 
    vectorDb: VectorDatabase,
    apiUsageTracker?: ApiUsageTracker
  ) {
    this.id = id;
    this.name = name;
    this.config = config;
    this.vectorDb = vectorDb;
    this.apiUsageTracker = apiUsageTracker;
  }
  
  async execute(inputs: NodeInput): Promise<NodeOutput> {
    try {
      let result;
      
      switch (this.config.operation) {
        case 'store':
          result = await this.storeOperation(inputs);
          break;
        case 'retrieve':
          result = await this.retrieveOperation(inputs);
          break;
        case 'update':
          result = await this.updateOperation(inputs);
          break;
        case 'delete':
          result = await this.deleteOperation(inputs);
          break;
        case 'similarity':
          result = await this.similarityOperation(inputs);
          break;
        case 'cluster':
          result = await this.clusterOperation(inputs);
          break;
        default:
          return {
            success: false,
            error: `Unsupported operation: ${this.config.operation}`
          };
      }
      
      // Track API usage if tracker is provided
      if (this.apiUsageTracker) {
        await this.apiUsageTracker.trackUsage({
          userId: inputs.userId,
          endpoint: `vectorstore/${this.config.operation}`,
          timestamp: new Date(),
          success: result.success,
          nodeId: this.id,
          workflowId: inputs.workflowId,
          serviceProvider: 'vectorstore'
        });
      }
      
      return result;
    } catch (error) {
      // Track error if tracker is provided
      if (this.apiUsageTracker) {
        await this.apiUsageTracker.trackUsage({
          userId: inputs.userId,
          endpoint: `vectorstore/${this.config.operation}`,
          timestamp: new Date(),
          success: false,
          nodeId: this.id,
          workflowId: inputs.workflowId,
          serviceProvider: 'vectorstore'
        });
      }
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  private async storeOperation(inputs: NodeInput): Promise<NodeOutput> {
    if (!inputs.data?.text) {
      return { 
        success: false, 
        error: 'No text provided for vectorization' 
      };
    }
    
    const metadata = {
      ...this.config.metadata,
      userId: inputs.userId,
      timestamp: new Date().toISOString(),
      ...inputs.data.metadata
    };
    
    const id = await this.vectorDb.storeVector(
      this.config.collectionName,
      inputs.data.text,
      metadata,
      this.config.embeddingModel || 'default'
    );
    
    return {
      success: true,
      data: { id }
    };
  }
  
  private async retrieveOperation(inputs: NodeInput): Promise<NodeOutput> {
    if (!inputs.data?.query) {
      return { 
        success: false, 
        error: 'No query provided for retrieval' 
      };
    }
    
    const results = await this.vectorDb.search(
      this.config.collectionName,
      inputs.data.query,
      this.config.searchTopK || 5,
      this.config.searchThreshold || 0.7,
      inputs.data.filter || { userId: inputs.userId },
      this.config.embeddingModel || 'default'
    );
    
    return {
      success: true,
      data: { results }
    };
  }
  
  private async updateOperation(inputs: NodeInput): Promise<NodeOutput> {
    if (!inputs.data?.id) {
      return { 
        success: false, 
        error: 'No ID provided for update' 
      };
    }
    
    const success = await this.vectorDb.updateVector(
      this.config.collectionName,
      inputs.data.id,
      inputs.data.text,
      inputs.data.metadata,
      this.config.embeddingModel || 'default'
    );
    
    return { success };
  }
  
  private async deleteOperation(inputs: NodeInput): Promise<NodeOutput> {
    if (!inputs.data?.id) {
      return { 
        success: false, 
        error: 'No ID provided for deletion' 
      };
    }
    
    const success = await this.vectorDb.deleteVector(
      this.config.collectionName,
      inputs.data.id
    );
    
    return { success };
  }
  
  private async similarityOperation(inputs: NodeInput): Promise<NodeOutput> {
    if (!inputs.data?.texts || !Array.isArray(inputs.data.texts) || inputs.data.texts.length < 2) {
      return { 
        success: false, 
        error: 'At least two texts are required for similarity comparison' 
      };
    }
    
    const similarities = await this.vectorDb.calculateSimilarities(
      inputs.data.texts,
      this.config.similarityMetric || 'cosine',
      this.config.embeddingModel || 'default'
    );
    
    return {
      success: true,
      data: { similarities }
    };
  }
  
  private async clusterOperation(inputs: NodeInput): Promise<NodeOutput> {
    if (!inputs.data?.texts || !Array.isArray(inputs.data.texts)) {
      return { 
        success: false, 
        error: 'An array of texts is required for clustering' 
      };
    }
    
    const clusters = await this.vectorDb.clusterTexts(
      inputs.data.texts,
      this.config.clusterCount || 3,
      this.config.embeddingModel || 'default'
    );
    
    return {
      success: true,
      data: { clusters }
    };
  }
}
