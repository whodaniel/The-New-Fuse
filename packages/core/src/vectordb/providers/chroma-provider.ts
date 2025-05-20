import { ChromaClient } from 'chromadb';
import { VectorStoreProvider, VectorDocument, VectorQuery, SearchResult } from '../types.js';

export class ChromaProvider implements VectorStoreProvider {
  public readonly name = 'chroma';
  private client: ChromaClient;
  private collectionName: string;

  constructor(endpoint: string, apiKey: string, collectionName: string) {
    // Initialize Chroma client
    this.client = new ChromaClient({ url: endpoint, apiKey });
    this.collectionName = collectionName;
  }

  async storeVectors(documents: VectorDocument[], namespace: string): Promise<string[]> {
    const collection = await this.client.getOrCreateCollection({ name: this.collectionName });
    const embeddings = documents.map(doc => doc.embedding!);
    const metadatas = documents.map(doc => ({ content: doc.content, ...doc.metadata }));
    const ids = documents.map(doc => doc.id ?? crypto.randomUUID());
    await collection.add({ ids, embeddings, metadatas, namespace });
    return ids;
  }

  async search(queryEmbedding: number[], options: VectorQuery): Promise<SearchResult[]> {
    const collection = await this.client.getOrCreateCollection({ name: this.collectionName });
    const result = await collection.query({ queryEmbeddings: [queryEmbedding], topK: options.limit || 10, namespace: options.namespace });
    return result[0].map(r => ({ id: r.id, score: 1 - r.distance, content: r.metadata.content, metadata: r.metadata, embedding: r.embedding }));
  }

  async deleteVectors(ids: string[], namespace: string): Promise<boolean> {
    const collection = await this.client.getOrCreateCollection({ name: this.collectionName });
    await collection.delete({ ids, namespace });
    return true;
  }

  async clearNamespace(namespace: string): Promise<boolean> {
    const collection = await this.client.getOrCreateCollection({ name: this.collectionName });
    await collection.delete({ namespace });
    return true;
  }
}