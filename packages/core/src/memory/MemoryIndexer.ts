import { Injectable, Logger } from '@nestjs/common';
import { MemoryItem, MemoryQuery, SearchResult } from './MemoryTypes';
import { createHash } from 'crypto';

export interface IndexEntry {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  tags: string[];
  timestamp: number;
  embedding: Float32Array;
  importance: number;
}

export interface SearchOptions {
  limit?: number;
  offset?: number;
  sortBy?: 'relevance' | 'timestamp' | 'importance';
  filters?: Record<string, unknown>;
}

@Injectable()
export class MemoryIndexer {
  private readonly logger = new Logger(MemoryIndexer.name);
  private readonly textIndex: Map<string, Set<string>> = new Map();
  private readonly metadataIndex: Map<string, Set<string>> = new Map();
  private readonly tagIndex: Map<string, Set<string>> = new Map();
  private readonly timestampIndex: Map<string, string> = new Map();
  private readonly similarityThreshold: number;

  constructor() {
    this.logger.log('Initializing MemoryIndexer');
    this.similarityThreshold = parseFloat(process.env.SIMILARITY_THRESHOLD || '0.8');
  }

  async indexMemoryItem(item: MemoryItem): Promise<void> {
    try {
      this.logger.debug(`Indexing memory item: ${item.id}`);

      const indexEntry: IndexEntry = {
        id: item.id,
        content: item.content,
        metadata: item.metadata,
        tags: item.tags || [],
        timestamp: item.timestamp,
        embedding: item.embedding,
        importance: item.importance,
      };

      // Index text content
      await this.indexText(indexEntry);

      // Index metadata
      await this.indexMetadata(indexEntry);

      // Index tags
      await this.indexTags(indexEntry);

      // Index timestamp
      this.timestampIndex.set(indexEntry.id, indexEntry.timestamp.toString());

      this.logger.debug(`Successfully indexed memory item: ${item.id}`);
    } catch (error) {
      this.logger.error(`Failed to index memory item ${item.id}:`, error);
      throw error;
    }
  }

  async removeFromIndex(itemId: string): Promise<void> {
    try {
      this.logger.debug(`Removing item from index: ${itemId}`);

      // Remove from text index
      for (const [term, itemIds] of this.textIndex.entries()) {
        itemIds.delete(itemId);
        if (itemIds.size === 0) {
          this.textIndex.delete(term);
        }
      }

      // Remove from metadata index
      for (const [key, itemIds] of this.metadataIndex.entries()) {
        itemIds.delete(itemId);
        if (itemIds.size === 0) {
          this.metadataIndex.delete(key);
        }
      }

      // Remove from tag index
      for (const [tag, itemIds] of this.tagIndex.entries()) {
        itemIds.delete(itemId);
        if (itemIds.size === 0) {
          this.tagIndex.delete(tag);
        }
      }

      // Remove from timestamp index
      this.timestampIndex.delete(itemId);

      this.logger.debug(`Successfully removed item from index: ${itemId}`);
    } catch (error) {
      this.logger.error(`Failed to remove item from index ${itemId}:`, error);
      throw error;
    }
  }

  async search(query: MemoryQuery, options: SearchOptions = {}): Promise<string[]> {
    try {
      this.logger.debug('Executing search query');

      let candidateIds = new Set<string>();
      let isFirstConstraint = true;

      // Text search
      if (query.text) {
        const textCandidates = await this.searchText(query.text);
        candidateIds = isFirstConstraint ? textCandidates : this.intersectSets(candidateIds, textCandidates);
        isFirstConstraint = false;
      }

      // Tag search
      if (query.tags && query.tags.length > 0) {
        const tagCandidates = await this.searchTags(query.tags);
        candidateIds = isFirstConstraint ? tagCandidates : this.intersectSets(candidateIds, tagCandidates);
        isFirstConstraint = false;
      }

      // Metadata filters
      if (query.filters) {
        const metadataCandidates = await this.searchMetadata(query.filters);
        candidateIds = isFirstConstraint ? metadataCandidates : this.intersectSets(candidateIds, metadataCandidates);
        isFirstConstraint = false;
      }

      // Cluster filter
      if (query.clusterId) {
        const clusterCandidates = await this.searchByCluster(query.clusterId);
        candidateIds = isFirstConstraint ? clusterCandidates : this.intersectSets(candidateIds, clusterCandidates);
        isFirstConstraint = false;
      }

      // Date range filter
      if (query.dateRange) {
        const dateCandidates = await this.searchByDateRange(query.dateRange.start, query.dateRange.end);
        candidateIds = isFirstConstraint ? dateCandidates : this.intersectSets(candidateIds, dateCandidates);
        isFirstConstraint = false;
      }

      // Convert to array and apply pagination
      const resultIds = Array.from(candidateIds);
      const start = options.offset || 0;
      const limit = options.limit || 100;

      this.logger.debug(`Found ${resultIds.length} candidates, returning ${Math.min(limit, resultIds.length - start)}`);

      return resultIds.slice(start, start + limit);
    } catch (error) {
      this.logger.error('Search failed:', error);
      throw error;
    }
  }

  async reindex(items: MemoryItem[]): Promise<void> {
    try {
      this.logger.log(`Reindexing ${items.length} memory items`);

      // Clear existing indices
      this.textIndex.clear();
      this.metadataIndex.clear();
      this.tagIndex.clear();
      this.timestampIndex.clear();

      // Reindex all items
      for (const item of items) {
        await this.indexMemoryItem(item);
      }

      this.logger.log('Reindexing completed successfully');
    } catch (error) {
      this.logger.error('Reindexing failed:', error);
      throw error;
    }
  }

  private async indexText(entry: IndexEntry): Promise<void> {
    const tokens = this.tokenize(entry.content);
    
    for (const token of tokens) {
      const normalizedToken = token.toLowerCase();
      if (!this.textIndex.has(normalizedToken)) {
        this.textIndex.set(normalizedToken, new Set());
      }
      this.textIndex.get(normalizedToken)!.add(entry.id);
    }
  }

  private async indexMetadata(entry: IndexEntry): Promise<void> {
    for (const [key, value] of Object.entries(entry.metadata)) {
      if (typeof value === 'string' || typeof value === 'number') {
        const indexKey = `${key}:${value}`;
        if (!this.metadataIndex.has(indexKey)) {
          this.metadataIndex.set(indexKey, new Set());
        }
        this.metadataIndex.get(indexKey)!.add(entry.id);
      } else if (typeof value === 'object' && value !== null) {
        // Handle nested objects
        const flattenedKeys = this.flattenObject(value, key);
        for (const flatKey of flattenedKeys) {
          if (!this.metadataIndex.has(flatKey)) {
            this.metadataIndex.set(flatKey, new Set());
          }
          this.metadataIndex.get(flatKey)!.add(entry.id);
        }
      }
    }
  }

  private async indexTags(entry: IndexEntry): Promise<void> {
    for (const tag of entry.tags) {
      const normalizedTag = tag.toLowerCase();
      if (!this.tagIndex.has(normalizedTag)) {
        this.tagIndex.set(normalizedTag, new Set());
      }
      this.tagIndex.get(normalizedTag)!.add(entry.id);
    }
  }

  private async searchText(text: string): Promise<Set<string>> {
    const tokens = this.tokenize(text);
    const candidateSets: Set<string>[] = [];

    for (const token of tokens) {
      const normalizedToken = token.toLowerCase();
      const itemIds = this.textIndex.get(normalizedToken);
      if (itemIds) {
        candidateSets.push(itemIds);
      }
    }

    return candidateSets.length > 0 ? this.intersectMultipleSets(candidateSets) : new Set();
  }

  private async searchTags(tags: string[]): Promise<Set<string>> {
    const candidateSets: Set<string>[] = [];

    for (const tag of tags) {
      const normalizedTag = tag.toLowerCase();
      const itemIds = this.tagIndex.get(normalizedTag);
      if (itemIds) {
        candidateSets.push(itemIds);
      }
    }

    return candidateSets.length > 0 ? this.intersectMultipleSets(candidateSets) : new Set();
  }

  private async searchMetadata(filters: Record<string, unknown>): Promise<Set<string>> {
    const candidateSets: Set<string>[] = [];

    for (const [key, value] of Object.entries(filters)) {
      const indexKey = `${key}:${value}`;
      const itemIds = this.metadataIndex.get(indexKey);
      if (itemIds) {
        candidateSets.push(itemIds);
      }
    }

    return candidateSets.length > 0 ? this.intersectMultipleSets(candidateSets) : new Set();
  }

  private async searchByCluster(clusterId: string): Promise<Set<string>> {
    const indexKey = `clusterId:${clusterId}`;
    return this.metadataIndex.get(indexKey) || new Set();
  }

  private async searchByDateRange(start: number, end: number): Promise<Set<string>> {
    const candidates = new Set<string>();

    for (const [itemId, timestamp] of this.timestampIndex.entries()) {
      const ts = parseInt(timestamp, 10);
      if (ts >= start && ts <= end) {
        candidates.add(itemId);
      }
    }

    return candidates;
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 2);
  }

  private flattenObject(obj: any, prefix: string): string[] {
    const flattened: string[] = [];
    
    for (const [key, value] of Object.entries(obj)) {
      const newKey = `${prefix}.${key}`;
      
      if (typeof value === 'string' || typeof value === 'number') {
        flattened.push(`${newKey}:${value}`);
      } else if (typeof value === 'object' && value !== null) {
        flattened.push(...this.flattenObject(value, newKey));
      }
    }
    
    return flattened;
  }

  private intersectSets(set1: Set<string>, set2: Set<string>): Set<string> {
    const intersection = new Set<string>();
    
    for (const item of set1) {
      if (set2.has(item)) {
        intersection.add(item);
      }
    }
    
    return intersection;
  }

  private intersectMultipleSets(sets: Set<string>[]): Set<string> {
    if (sets.length === 0) return new Set();
    if (sets.length === 1) return sets[0];
    
    return sets.reduce((acc, set) => this.intersectSets(acc, set));
  }

  getIndexStats(): {
    textTerms: number;
    metadataKeys: number;
    tags: number;
    totalItems: number;
  } {
    return {
      textTerms: this.textIndex.size,
      metadataKeys: this.metadataIndex.size,
      tags: this.tagIndex.size,
      totalItems: this.timestampIndex.size,
    };
  }
}