import { MongoClient, Db, Collection } from 'mongodb';

/**
 * Database abstraction layer for MongoDB
 */
export class Database {
  private client: MongoClient;
  private db: Db;
  private collections: Map<string, Collection> = new Map();
  private connected: boolean = false;
  
  constructor(uri: string, dbName?: string) {
    this.client = new MongoClient(uri);
    this.db = null;
  }
  
  async connect(): Promise<void> {
    if (this.connected) return;
    
    try {
      await this.client.connect();
      this.db = this.client.db();
      this.connected = true;
      
    } catch (error) {
      console.error('Failed to connect to database:', error);
      throw error;
    }
  }
  
  async disconnect(): Promise<void> {
    if (!this.connected) return;
    
    try {
      await this.client.close();
      this.connected = false;
      
    } catch (error) {
      console.error('Failed to disconnect from database:', error);
      throw error;
    }
  }
  
  collection(name: string): Collection {
    if (!this.connected) {
      throw new Error('Database not connected');
    }
    
    if (!this.collections.has(name)) {
      this.collections.set(name, this.db.collection(name));
    }
    
    return this.collections.get(name);
  }
  
  async createIndexes(): Promise<void> {
    if (!this.connected) {
      await this.connect();
    }
    
    // Create indexes for workflows collection
    await this.collection('workflows').createIndexes([
      { key: { id: 1 }, unique: true },
      { key: { userId: 1 } },
      { key: { tags: 1 } }
    ]);
    
    // Create indexes for workflowExecutions collection
    await this.collection('workflowExecutions').createIndexes([
      { key: { id: 1 }, unique: true },
      { key: { workflowId: 1 } },
      { key: { userId: 1 } },
      { key: { startTime: -1 } }
    ]);
    
    // Create indexes for apiUsage collection
    await this.collection('apiUsage').createIndexes([
      { key: { userId: 1 } },
      { key: { endpoint: 1 } },
      { key: { timestamp: -1 } },
      { key: { nodeId: 1 } },
      { key: { workflowId: 1 } }
    ]);
    
    // Create indexes for webhooks collection
    await this.collection('webhooks').createIndexes([
      { key: { id: 1 }, unique: true },
      { key: { userId: 1 } },
      { key: { service: 1 } }
    ]);
    
    // Create indexes for users collection
    await this.collection('users').createIndexes([
      { key: { id: 1 }, unique: true },
      { key: { email: 1 }, unique: true }
    ]);

  }
}
