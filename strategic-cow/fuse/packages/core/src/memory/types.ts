export enum MemoryType {
  CONVERSATION = 'conversation',
  USER = 'user',
  SYSTEM = 'system',
  CONTEXT = 'context',
  KNOWLEDGE = 'knowledge',
  TEMP = 'temp'
}

export interface MemoryDistribution {
  typeDistribution: Record<MemoryType, number>;
  averageEmbeddingSize: number;
  totalMemoryUsage: number;
  cacheHitRatio: number;
}