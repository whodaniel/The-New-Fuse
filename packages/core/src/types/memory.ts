/**
 * @fileoverview Memory system type definitions
 */

// Memory Content Types
export interface MemoryContent {
  id: string;
  content: string;
  type: MemoryContentType;
  metadata: MemoryMetadata;
  embedding?: number[];
  createdAt: Date;
  updatedAt: Date;
  accessCount: number;
  lastAccessed: Date;
}

export enum MemoryContentType {
  TEXT = 'TEXT',
  CODE = 'CODE',
  CONVERSATION = 'CONVERSATION',
  TASK_RESULT = 'TASK_RESULT',
  KNOWLEDGE = 'KNOWLEDGE',
  CONTEXT = 'CONTEXT',
  INSTRUCTION = 'INSTRUCTION',
}

export interface MemoryMetadata {
  source: string;
  agentId?: string;
  taskId?: string;
  workflowId?: string;
  tags: string[];
  importance: number; // 0-1 scale
  relevanceScore?: number;
  expiresAt?: Date;
  isPrivate: boolean;
  path?: string; // For documents
  classification?: 'TOP_SECRET' | 'CONFIDENTIAL' | 'INTERNAL' | 'PUBLIC';
}

// Memory Query Types
export interface MemoryQuery {
  query: string;
  type?: MemoryContentType;
  agentId?: string;
  tags?: string[];
  limit?: number;
  minRelevance?: number;
  timeRange?: {
    start: Date;
    end: Date;
  };
  includeMetadata?: boolean;
  // Security context
  userRole?: string;
  subscriptionTier?: string;
}

export interface MemorySearchResult {
  content: MemoryContent;
  relevanceScore: number;
  matchedTerms: string[];
}

export interface MemoryQueryResult {
  results: MemorySearchResult[];
  totalCount: number;
  queryTime: number;
  suggestions?: string[];
}

// Memory Storage Configuration
export interface MemoryStorageConfig {
  provider: 'redis' | 'chromadb' | 'pinecone' | 'local';
  connectionString: string;
  maxMemorySize: number; // MB
  retentionPolicy: MemoryRetentionPolicy;
  embeddingModel?: string;
  indexingStrategy: 'immediate' | 'batch' | 'lazy';
}

export interface MemoryRetentionPolicy {
  defaultTTL: number; // seconds
  maxAge: number; // seconds
  maxItems: number;
  cleanupInterval: number; // seconds
  priorityBased: boolean;
}

// Memory Operations
export interface MemoryOperation {
  type: 'store' | 'retrieve' | 'update' | 'delete' | 'search';
  contentId?: string;
  query?: MemoryQuery;
  content?: Partial<MemoryContent>;
  timestamp: Date;
  agentId: string;
  success: boolean;
  duration: number;
  error?: string;
}

// Memory Statistics
export interface MemoryStats {
  totalItems: number;
  totalSize: number; // bytes
  averageRelevance: number;
  mostAccessedItems: MemoryContent[];
  recentOperations: MemoryOperation[];
  storageUtilization: number; // percentage
  indexingStatus: 'up-to-date' | 'indexing' | 'stale';
}