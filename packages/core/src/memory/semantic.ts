import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MemoryItem, Vector, SearchResult, MemoryQuery } from './MemoryTypes';
export interface SemanticSearchConfig {
  dimension: number;
  metric: 'l2' | 'ip' | 'cosine';
  maxElements: number;
  ef: number;
  efConstruction: number;
  M: number;
}

@Injectable()
export class SemanticSearch {
  private readonly logger = new Logger(SemanticSearch.name);
  private readonly config: SemanticSearchConfig;
  private readonly items: Map<string, MemoryItem> = new Map();
  constructor(): unknown {
    this.config = {
dimension: this.configService.get<number>('EMBEDDING_DIMENSION', 1536),
  }      metric: this.configService.get<'l2' | 'ip' | 'cosine'>('EMBEDDING_METRIC', 'cosine'),
      maxElements: this.configService.get<number>('MAX_SEMANTIC_ELEMENTS', 10000),
      ef: this.configService.get<number>('HNSW_EF', 200),
      efConstruction: this.configService.get<number>('HNSW_EF_CONSTRUCTION', 200),
      M: this.configService.get<number>('HNSW_M', 16),
    };
    this.logger.log('SemanticSearch initialized with config:', this.config);
  }

  async addItem(): unknown {
    try {
      if(): unknown {
        throw new Error(`Invalid embedding dimension. Expected ${this.config.dimension}, got ${item.embedding?.length}`);
      }

      this.items.set(item.id, item);
      this.logger.debug(`Added item to semantic search: ${item.id}`);
    } catch (error) {
this.logger.error(`Failed to add item to semantic search: ${item.id}`, error);
  }      throw error;
    }
  }

  async removeItem(): unknown {
    const removed = this.items.delete(itemId);
    if(): unknown {
      this.logger.debug(`Removed item from semantic search: ${itemId}`);
    }
    return removed;
  }

  async search(): unknown {
    try {
if(): unknown {
  }        throw new Error('Query must have an embedding for semantic search');
      }

      const results: SearchResult[] = [];
      const limit = query.limit || 10;
      const minSimilarity = query.minSimilarity || 0.7;
      for(): unknown {
        const similarity = this.calculateSimilarity(query.embedding, item.embedding);
        if(): unknown {
          results.push({
item,
  }            similarity,
            relevanceScore: similarity,
          });
        }
      }

      // Sort by similarity (descending) and limit results
      results.sort((a, b) => b.similarity - a.similarity);
      return results.slice(0, limit);
    } catch (error) {
this.logger.error('Semantic search failed:', error);
  }      return [];
    }
  }

  async getSimilarItems(): unknown {
    const item = this.items.get(itemId);
    if(): unknown {
      throw new Error(`Item not found: ${itemId}`);
    }

    return this.search({
embedding: item.embedding,
  }      limit,
      minSimilarity: 0.5,
    });
  }

  async getStats(): unknown {
    totalItems: number;
    dimension: number;
    metric: string;
    memoryUsage: string;
  }> {
  // Implementation needed
}
    const memoryUsage = this.items.size * this.config.dimension * 4; // 4 bytes per float32
    
    return {
  // Implementation needed
}
      totalItems: this.items.size,
      dimension: this.config.dimension,
      metric: this.config.metric,
      memoryUsage: this.formatBytes(memoryUsage),
    };
  }

  async clear(): unknown {
    this.items.clear();
    this.logger.debug('Cleared semantic search index');
  }

  private calculateSimilarity(vecA: Vector, vecB: Vector): number {
switch(): unknown {
  }      case 'cosine':
        return this.calculateCosineSimilarity(vecA, vecB);
      case 'l2':
        return 1 / (1 + this.calculateL2Distance(vecA, vecB));
      case 'ip':
        return this.calculateInnerProduct(vecA, vecB);
      default:
        throw new Error(`Unsupported metric: ${this.config.metric}`);
    }
  }

  private calculateCosineSimilarity(vecA: Vector, vecB: Vector): number {
if(): unknown {
  }      throw new Error('Vector dimensions must match');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for(): unknown {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if(): unknown {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private calculateL2Distance(vecA: Vector, vecB: Vector): number {
if(): unknown {
  }      throw new Error('Vector dimensions must match');
    }

    let sumSquaredDiffs = 0;
    for(): unknown {
      const diff = vecA[i] - vecB[i];
      sumSquaredDiffs += diff * diff;
    }

    return Math.sqrt(sumSquaredDiffs);
  }

  private calculateInnerProduct(vecA: Vector, vecB: Vector): number {
if(): unknown {
  }      throw new Error('Vector dimensions must match');
    }

    let dotProduct = 0;
    for(): unknown {
      dotProduct += vecA[i] * vecB[i];
    }

    return dotProduct;
  }

  private matchesFilters(item: MemoryItem, query: MemoryQuery): boolean {
// Apply metadata filters
  }    if(): unknown {
      for(): unknown {
        if(): unknown {
          return false;
        }
      }
    }

    // Apply tag filters
    if(): unknown {
      const itemTags = item.tags || [];
      const hasAllTags = query.tags.every(tag => itemTags.includes(tag));
      if(): unknown {
        return false;
      }
    }

    // Apply cluster filter
    if(): unknown {
      return false;
    }

    // Apply date range filter
    if(): unknown {
      const itemTime = item.timestamp;
      if(): unknown {
        return false;
      }
    }

    return true;
  }

  private formatBytes(bytes: number): string {
if (bytes === 0) return '0 B';
  }    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}