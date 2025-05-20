import { Injectable } from '@nestjs/common';
import { Logger } from '../utils/logger.js';
import { ConfigService } from '@nestjs/config';

/**
 * Vector database provider types
 */
export enum VectorDatabaseProvider {
  PINECONE = 'pinecone',
  CHROMA = 'chroma',
  REDIS = 'redis',
  SUPABASE = 'supabase',
  WEAVIATE = 'weaviate',
  MILVUS = 'milvus',
  QDRANT = 'qdrant',
  IN_MEMORY = 'in_memory' // For development/testing
}

/**
 * Document to be stored in vector database
 */
export interface VectorDocument {
  id?: string;
  content: string;
  metadata: Record<string, any>;
  embedding?: number[];
}

/**
 * Search query options
 */
export interface SearchOptions {
  namespace?: string;
  filter?: Record<string, any>;
  limit?: number;
  includeMetadata?: boolean;
  includeContent?: boolean;
  includeEmbedding?: boolean;
  minScore?: number;
}

/**
 * Search result
 */
export interface SearchResult {
  id: string;
  score: number;
  content?: string;
  metadata?: Record<string, any>;
  embedding?: number[];
}

/**
 * Vector database service for RAG capabilities
 */
@Injectable()
export class VectorDatabaseService {
  private readonly logger = new Logger(VectorDatabaseService.name);
  private provider: VectorDatabaseProvider;
  private client: any;
  private embeddingModel: string;
  private namespace: string;
  private dimensions: number;

  constructor(private configService: ConfigService) {
    this.provider = this.configService.get<VectorDatabaseProvider>('VECTOR_DB_PROVIDER', VectorDatabaseProvider.IN_MEMORY);
    this.embeddingModel = this.configService.get<string>('EMBEDDING_MODEL', 'text-embedding-3-small');
    this.namespace = this.configService.get<string>('VECTOR_DB_NAMESPACE', 'the-new-fuse');
    this.dimensions = this.configService.get<number>('VECTOR_DB_DIMENSIONS', 1536);
    
    this.initializeClient();
  }

  /**
   * Initialize the vector database client based on the configured provider
   */
  private async initializeClient(): Promise<void> {
    try {
      switch (this.provider) {
        case VectorDatabaseProvider.PINECONE:
          await this.initializePinecone();
          break;
        case VectorDatabaseProvider.CHROMA:
          await this.initializeChroma();
          break;
        case VectorDatabaseProvider.REDIS:
          await this.initializeRedis();
          break;
        case VectorDatabaseProvider.SUPABASE:
          await this.initializeSupabase();
          break;
        case VectorDatabaseProvider.IN_MEMORY:
          await this.initializeInMemory();
          break;
        default:
          this.logger.warn(`Unsupported vector database provider: ${this.provider}. Falling back to in-memory.`);
          await this.initializeInMemory();
      }
      
      this.logger.log(`Vector database initialized with provider: ${this.provider}`);
    } catch (error) {
      this.logger.error(`Failed to initialize vector database: ${error.message}`, error.stack);
      this.logger.warn('Falling back to in-memory vector database');
      await this.initializeInMemory();
    }
  }

  /**
   * Initialize Pinecone vector database
   */
  private async initializePinecone(): Promise<void> {
    try {
      const { PineconeClient } = await import('@pinecone-database/pinecone');
      
      const pinecone = new PineconeClient();
      await pinecone.init({
        apiKey: this.configService.get<string>('PINECONE_API_KEY'),
        environment: this.configService.get<string>('PINECONE_ENVIRONMENT')
      });
      
      const indexName = this.configService.get<string>('PINECONE_INDEX');
      
      // Check if index exists, create if not
      const indexes = await pinecone.listIndexes();
      if (!indexes.includes(indexName)) {
        this.logger.log(`Creating Pinecone index: ${indexName}`);
        await pinecone.createIndex({
          name: indexName,
          dimension: this.dimensions,
          metric: 'cosine'
        });
      }
      
      this.client = pinecone.Index(indexName);
    } catch (error) {
      this.logger.error(`Failed to initialize Pinecone: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Initialize Chroma vector database
   */
  private async initializeChroma(): Promise<void> {
    try {
      const { ChromaClient } = await import('chromadb');
      
      this.client = new ChromaClient({
        path: this.configService.get<string>('CHROMA_URL')
      });
      
      const collectionName = this.configService.get<string>('CHROMA_COLLECTION', 'the-new-fuse');
      
      // Get or create collection
      try {
        await this.client.getCollection({ name: collectionName });
      } catch (error) {
        await this.client.createCollection({ name: collectionName });
      }
    } catch (error) {
      this.logger.error(`Failed to initialize Chroma: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Initialize Redis vector database
   */
  private async initializeRedis(): Promise<void> {
    try {
      const { createClient } = await import('redis');
      
      this.client = createClient({
        url: this.configService.get<string>('REDIS_URL'),
        password: this.configService.get<string>('REDIS_PASSWORD')
      });
      
      await this.client.connect();
    } catch (error) {
      this.logger.error(`Failed to initialize Redis: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Initialize Supabase vector database
   */
  private async initializeSupabase(): Promise<void> {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      
      this.client = createClient(
        this.configService.get<string>('SUPABASE_URL'),
        this.configService.get<string>('SUPABASE_KEY')
      );
    } catch (error) {
      this.logger.error(`Failed to initialize Supabase: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Initialize in-memory vector database (for development/testing)
   */
  private async initializeInMemory(): Promise<void> {
    // Simple in-memory vector database implementation
    this.client = {
      documents: [] as Array<VectorDocument & { id: string }>,
      
      // Add documents to in-memory store
      async addDocuments(documents: VectorDocument[]): Promise<string[]> {
        const ids = documents.map(doc => {
          const id = doc.id || crypto.randomUUID();
          this.documents.push({ ...doc, id });
          return id;
        });
        return ids;
      },
      
      // Search for similar documents
      async search(embedding: number[], options: SearchOptions = {}): Promise<SearchResult[]> {
        const { limit = 5, minScore = 0.7 } = options;
        
        // Simple cosine similarity calculation
        const results = this.documents.map(doc => {
          const score = this.cosineSimilarity(embedding, doc.embedding || []);
          return { id: doc.id, score, content: doc.content, metadata: doc.metadata };
        });
        
        // Sort by score and filter by minimum score
        return results
          .filter(result => result.score >= minScore)
          .sort((a, b) => b.score - a.score)
          .slice(0, limit);
      },
      
      // Calculate cosine similarity between two vectors
      cosineSimilarity(a: number[], b: number[]): number {
        if (a.length !== b.length) {
          throw new Error('Vectors must have the same length');
        }
        
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        
        for (let i = 0; i < a.length; i++) {
          dotProduct += a[i] * b[i];
          normA += a[i] * a[i];
          normB += b[i] * b[i];
        }
        
        normA = Math.sqrt(normA);
        normB = Math.sqrt(normB);
        
        if (normA === 0 || normB === 0) {
          return 0;
        }
        
        return dotProduct / (normA * normB);
      }
    };
  }

  /**
   * Generate embeddings for text
   * @param text Text to generate embeddings for
   * @returns Embedding vector
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Use OpenAI embeddings API
      const { OpenAI } = await import('openai');
      
      const openai = new OpenAI({
        apiKey: this.configService.get<string>('OPENAI_API_KEY')
      });
      
      const response = await openai.embeddings.create({
        model: this.embeddingModel,
        input: text
      });
      
      return response.data[0].embedding;
    } catch (error) {
      this.logger.error(`Failed to generate embedding: ${error.message}`, error.stack);
      
      // Return a random embedding for development/testing
      if (this.provider === VectorDatabaseProvider.IN_MEMORY) {
        return Array.from({ length: this.dimensions }, () => Math.random() * 2 - 1);
      }
      
      throw error;
    }
  }

  /**
   * Store documents in the vector database
   * @param documents Documents to store
   * @param generateEmbeddings Whether to generate embeddings for documents
   * @returns IDs of stored documents
   */
  async storeDocuments(documents: VectorDocument[], generateEmbeddings = true): Promise<string[]> {
    try {
      // Generate embeddings if needed
      const docsWithEmbeddings = await Promise.all(
        documents.map(async (doc) => {
          if (!doc.embedding && generateEmbeddings) {
            const embedding = await this.generateEmbedding(doc.content);
            return { ...doc, embedding };
          }
          return doc;
        })
      );
      
      // Store documents based on provider
      switch (this.provider) {
        case VectorDatabaseProvider.PINECONE:
          return this.storePineconeDocuments(docsWithEmbeddings);
        case VectorDatabaseProvider.CHROMA:
          return this.storeChromaDocuments(docsWithEmbeddings);
        case VectorDatabaseProvider.REDIS:
          return this.storeRedisDocuments(docsWithEmbeddings);
        case VectorDatabaseProvider.SUPABASE:
          return this.storeSupabaseDocuments(docsWithEmbeddings);
        case VectorDatabaseProvider.IN_MEMORY:
          return this.client.addDocuments(docsWithEmbeddings);
        default:
          throw new Error(`Unsupported vector database provider: ${this.provider}`);
      }
    } catch (error) {
      this.logger.error(`Failed to store documents: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Store documents in Pinecone
   */
  private async storePineconeDocuments(documents: VectorDocument[]): Promise<string[]> {
    const vectors = documents.map(doc => ({
      id: doc.id || crypto.randomUUID(),
      values: doc.embedding,
      metadata: {
        content: doc.content,
        ...doc.metadata
      }
    }));
    
    await this.client.upsert({
      upsertRequest: {
        vectors,
        namespace: this.namespace
      }
    });
    
    return vectors.map(v => v.id);
  }

  /**
   * Store documents in Chroma
   */
  private async storeChromaDocuments(documents: VectorDocument[]): Promise<string[]> {
    const collection = await this.client.getCollection({ 
      name: this.configService.get<string>('CHROMA_COLLECTION', 'the-new-fuse') 
    });
    
    const ids = documents.map(doc => doc.id || crypto.randomUUID());
    const embeddings = documents.map(doc => doc.embedding);
    const metadatas = documents.map(doc => ({ content: doc.content, ...doc.metadata }));
    
    await collection.add({
      ids,
      embeddings,
      metadatas
    });
    
    return ids;
  }

  /**
   * Store documents in Redis
   */
  private async storeRedisDocuments(documents: VectorDocument[]): Promise<string[]> {
    const ids: string[] = [];
    
    for (const doc of documents) {
      const id = doc.id || crypto.randomUUID();
      const key = `${this.namespace}:${id}`;
      
      await this.client.json.set(key, '$', {
        embedding: doc.embedding,
        content: doc.content,
        metadata: doc.metadata
      });
      
      ids.push(id);
    }
    
    return ids;
  }

  /**
   * Store documents in Supabase
   */
  private async storeSupabaseDocuments(documents: VectorDocument[]): Promise<string[]> {
    const ids: string[] = [];
    
    for (const doc of documents) {
      const id = doc.id || crypto.randomUUID();
      
      const { error } = await this.client
        .from('documents')
        .insert({
          id,
          content: doc.content,
          metadata: doc.metadata,
          embedding: doc.embedding
        });
      
      if (error) {
        throw error;
      }
      
      ids.push(id);
    }
    
    return ids;
  }

  /**
   * Search for similar documents
   * @param query Query text or embedding
   * @param options Search options
   * @returns Search results
   */
  async search(query: string | number[], options: SearchOptions = {}): Promise<SearchResult[]> {
    try {
      // Generate embedding if query is text
      const embedding = typeof query === 'string' 
        ? await this.generateEmbedding(query)
        : query;
      
      // Search based on provider
      switch (this.provider) {
        case VectorDatabaseProvider.PINECONE:
          return this.searchPinecone(embedding, options);
        case VectorDatabaseProvider.CHROMA:
          return this.searchChroma(embedding, options);
        case VectorDatabaseProvider.REDIS:
          return this.searchRedis(embedding, options);
        case VectorDatabaseProvider.SUPABASE:
          return this.searchSupabase(embedding, options);
        case VectorDatabaseProvider.IN_MEMORY:
          return this.client.search(embedding, options);
        default:
          throw new Error(`Unsupported vector database provider: ${this.provider}`);
      }
    } catch (error) {
      this.logger.error(`Failed to search: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Search in Pinecone
   */
  private async searchPinecone(embedding: number[], options: SearchOptions): Promise<SearchResult[]> {
    const { namespace = this.namespace, limit = 5, includeMetadata = true } = options;
    
    const response = await this.client.query({
      queryRequest: {
        vector: embedding,
        topK: limit,
        namespace,
        includeMetadata
      }
    });
    
    return response.matches.map(match => ({
      id: match.id,
      score: match.score,
      content: match.metadata?.content,
      metadata: match.metadata
    }));
  }

  /**
   * Search in Chroma
   */
  private async searchChroma(embedding: number[], options: SearchOptions): Promise<SearchResult[]> {
    const { limit = 5 } = options;
    
    const collection = await this.client.getCollection({ 
      name: this.configService.get<string>('CHROMA_COLLECTION', 'the-new-fuse') 
    });
    
    const response = await collection.query({
      queryEmbeddings: [embedding],
      nResults: limit,
      includeMetadata: true
    });
    
    return response.ids[0].map((id, i) => ({
      id,
      score: response.distances[0][i],
      content: response.metadatas[0][i].content,
      metadata: response.metadatas[0][i]
    }));
  }

  /**
   * Search in Redis
   */
  private async searchRedis(embedding: number[], options: SearchOptions): Promise<SearchResult[]> {
    // This is a simplified implementation
    // In a real implementation, you would use Redis' vector search capabilities
    
    // For now, we'll retrieve all documents and perform an in-memory search
    const keys = await this.client.keys(`${this.namespace}:*`);
    const documents = [];
    
    for (const key of keys) {
      const doc = await this.client.json.get(key);
      documents.push({
        id: key.split(':')[1],
        content: doc.content,
        metadata: doc.metadata,
        embedding: doc.embedding
      });
    }
    
    // Calculate cosine similarity
    const results = documents.map(doc => {
      const score = this.calculateCosineSimilarity(embedding, doc.embedding);
      return {
        id: doc.id,
        score,
        content: doc.content,
        metadata: doc.metadata
      };
    });
    
    // Sort by score and limit results
    const { limit = 5, minScore = 0.7 } = options;
    return results
      .filter(result => result.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Search in Supabase
   */
  private async searchSupabase(embedding: number[], options: SearchOptions): Promise<SearchResult[]> {
    const { limit = 5 } = options;
    
    // This assumes you have a function set up in Supabase to perform vector similarity search
    const { data, error } = await this.client.rpc('match_documents', {
      query_embedding: embedding,
      match_threshold: options.minScore || 0.7,
      match_count: limit
    });
    
    if (error) {
      throw error;
    }
    
    return data.map(item => ({
      id: item.id,
      score: item.similarity,
      content: item.content,
      metadata: item.metadata
    }));
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private calculateCosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);
    
    if (normA === 0 || normB === 0) {
      return 0;
    }
    
    return dotProduct / (normA * normB);
  }
}
