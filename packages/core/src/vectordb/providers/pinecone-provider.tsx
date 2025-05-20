import { PineconeClient, Vector } from '@pinecone-database/pinecone';
import { VectorStoreProvider, VectorDocument, VectorQuery, SearchResult } from '../types.js';

export class PineconeProvider implements VectorStoreProvider {
  private client: PineconeClient;
  private indexName: string;
  public readonly name = 'pinecone';
  
  constructor(apiKey: string, environment: string, indexName: string) {
    this.client = new PineconeClient();
    this.indexName = indexName;
    this.initialize(apiKey, environment);
  }
  
  private async initialize(apiKey: string, environment: string): Promise<void> {
    await this.client.init({
      apiKey,
      environment
    });
  }
  
  async storeVectors(documents: VectorDocument[], namespace: string): Promise<string[]> {
    const index = this.client.Index(this.indexName);
    
    const vectors: Vector[] = documents.map(doc => ({
      id: doc.id || crypto.randomUUID(),
      values: doc.embedding,
      metadata: {
        content: doc.content,
        ...doc.metadata
      }
    }));
    
    await index.upsert({
      upsertRequest: {
        vectors,
        namespace
      }
    });
    
    return vectors.map(v => v.id);
  }
  
  async search(queryEmbedding: number[], options: VectorQuery): Promise<SearchResult[]> {
    const index = this.client.Index(this.indexName);
    
    const results = await index.query({
      queryRequest: {
        namespace: options.namespace,
        topK: options.limit || 10,
        vector: queryEmbedding,
        includeMetadata: true,
        includeValues: options.includeVectors || false
      }
    });
    
    return (results.matches || []).map(match => ({
      id: match.id,
      score: match.score || 0,
      content: match.metadata?.content || '',
      metadata: match.metadata || {},
      embedding: match.values
    }));
  }
  
  async deleteVectors(ids: string[], namespace: string): Promise<boolean> {
    const index = this.client.Index(this.indexName);
    
    await index.delete1({
      ids,
      namespace
    });
    
    return true;
  }
  
  async clearNamespace(namespace: string): Promise<boolean> {
    const index = this.client.Index(this.indexName);
    
    await index.delete1({
      deleteAll: true,
      namespace
    });
    
    return true;
  }
}
