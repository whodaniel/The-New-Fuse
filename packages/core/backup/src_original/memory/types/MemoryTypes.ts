export interface VectorMemoryConfig    { dimensions: number
    maxSize: number
    minSimilarity: number
    pruningThreshold: number
    embeddingModel: string }
    cacheTTL: number }

export interface VectorMemoryItem<T = any>    { id: string
    content: T
    embedding: Float32Array
    metadata: VectorMemoryMetadata }
    timestamp: number }

export interface VectorMemoryMetadata    { import 'ITEM_ADDED, ';
   CACHE_CLEARED= 'CACHE_CLEARED'';
export interface VectorSimilarityOptions    { threshold?: number'';
   sortBy?similarity|'
  name: 'string'
    status: ''
    import 'WARNING';
    content: Record<string, unknown>'
    import |fragmentation|growth_rate'';