import { createClient, RedisClientType } from 'redis';
import { VectorStoreProvider, VectorDocument, VectorQuery, SearchResult } from '../types.js';

export class RedisProvider implements VectorStoreProvider {
  public readonly name = 'redis';
  private client: RedisClientType;
  private prefix: string;

  constructor(endpoint: string, apiKey: string, namespace: string) {
    this.client = createClient({ url: endpoint, password: apiKey });
    this.client.connect();
    this.prefix = namespace;
  }

  async storeVectors(documents: VectorDocument[], namespace: string): Promise<string[]> {
    const ids: string[] = [];
    for (const doc of documents) {
      const id = doc.id ?? crypto.randomUUID();
      const key = `${this.prefix}:${id}`;
      // store as JSON string
      await this.client.set(key, JSON.stringify({ embedding: doc.embedding, content: doc.content, metadata: doc.metadata }));
      ids.push(id);
    }
    return ids;
  }

  async search(queryEmbedding: number[], options: VectorQuery): Promise<SearchResult[]> {
    // Stub: Redis JSON-vector search not implemented
    return [];
  }

  async deleteVectors(ids: string[], namespace: string): Promise<boolean> {
    for (const id of ids) {
      const key = `${this.prefix}:${id}`;
      await this.client.del(key);
    }
    return true;
  }

  async clearNamespace(namespace: string): Promise<boolean> {
    // Warning: flushes all keys with prefix
    const pattern = `${this.prefix}:*`;
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(keys);
    }
    return true;
  }
}