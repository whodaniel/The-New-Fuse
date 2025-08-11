export enum MemoryType {
  // Implementation needed
}
  CONVERSATION = 'conversation',
  USER = 'user',
  SYSTEM = 'system',
  CONTEXT = 'context',
  KNOWLEDGE = 'knowledge',
  TEMP = 'temp'
}

export interface MemoryDistribution {
  // Implementation needed
}
  typeDistribution: Record<MemoryType, number>;
  averageEmbeddingSize: number;
  totalMemoryUsage: number;
  cacheHitRatio: number;
}