export enum MemoryType {
  CONVERSATION = 'conversation',
  TASK = 'task',
  LEARNING = 'learning',
  SYSTEM = 'system',
  USER = 'user',
  AGENT = 'agent',
}

export interface Memory {
  id: string;
  content: string;
  type: MemoryType;
  timestamp: Date;
  metadata: Record<string, unknown>;
  embedding?: number[];
  tags?: string[];
  source?: string;
  ttl?: number;
}

export interface MemoryQuery {
  type?: MemoryType;
  tags?: string[];
  source?: string;
  startTime?: Date;
  endTime?: Date;
  metadata?: Record<string, unknown>;
}

export interface MemoryStats {
  totalCount: number;
  typeDistribution: Record<MemoryType, number>;
  averageEmbeddingSize: number;
  oldestMemory: Date;
  newestMemory: Date;
}
