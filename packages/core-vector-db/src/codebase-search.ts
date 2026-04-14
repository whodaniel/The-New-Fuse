import OpenAI from 'openai';
import { disconnect as dbDisconnect, query } from './db/connection.js';

interface SearchResult {
  id: bigint;
  filePath: string;
  entityType: string;
  entityName: string;
  content: string;
  similarity: number;
  metadata?: Record<string, any>;
  startLine?: number;
}

interface RelatedCode {
  entity: SearchResult;
  relationship: string;
  depth: number;
}

export class CodebaseSearch {
  private openai: OpenAI;
  private embeddingModel = 'text-embedding-3-small';

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Semantic search: Find code similar to a natural language query
   * Example: "authentication logic", "database connection handling"
   */
  async semanticSearch(searchQuery: string, limit = 10): Promise<SearchResult[]> {
    const startTime = Date.now();

    // 1. Generate embedding for query
    const queryEmbedding = await this.generateQueryEmbedding(searchQuery);

    // 2. Search using pgvector cosine similarity
    const result = await query<SearchResult>(
      `SELECT 
        ce.id,
        ce.file_path as "filePath",
        ce.entity_type as "entityType",
        ce.entity_name as "entityName", 
        ce.content,
        ce.start_line as "startLine",
        ce.metadata,
        1 - (cem.embedding <=> $1::vector) as similarity
      FROM code_entities ce
      JOIN code_embeddings cem ON ce.id = cem.entity_id
      ORDER BY cem.embedding <=> $1::vector
      LIMIT $2`,
      [JSON.stringify(queryEmbedding), limit]
    );

    // 3. Log analytics
    await this.logSearch(searchQuery, 'semantic', result.rows.length, Date.now() - startTime);

    return result.rows;
  }

  /**
   * Find similar code blocks (for duplicate detection)
   */
  async findSimilarCode(
    filePath: string,
    entityName: string,
    threshold = 0.9
  ): Promise<SearchResult[]> {
    // Get the entity's embedding
    const entityResult = await query(
      `SELECT ce.id, cem.embedding
      FROM code_entities ce
      JOIN code_embeddings cem ON ce.id = cem.entity_id
      WHERE ce.file_path = $1 AND ce.entity_name = $2
      LIMIT 1`,
      [filePath, entityName]
    );

    if (entityResult.rows.length === 0) {
      return [];
    }

    const sourceEmbedding = entityResult.rows[0].embedding;
    const sourceId = entityResult.rows[0].id;

    // Find similar embeddings
    const results = await query<SearchResult>(
      `SELECT 
        ce.id,
        ce.file_path as "filePath",
        ce.entity_type as "entityType",
        ce.entity_name as "entityName",
        ce.content,
        ce.start_line as "startLine",
        1 - (cem.embedding <=> $1::vector) as similarity
      FROM code_entities ce
      JOIN code_embeddings cem ON ce.id = cem.entity_id
      WHERE ce.id != $2
        AND 1 - (cem.embedding <=> $1::vector) > $3
      ORDER BY cem.embedding <=> $1::vector
      LIMIT 20`,
      [sourceEmbedding, sourceId, threshold]
    );

    return results.rows;
  }

  /**
   * Find code that imports/uses a specific entity (knowledge graph traversal)
   */
  async findUsages(filePath: string, entityName: string): Promise<RelatedCode[]> {
    const entityResult = await query(
      `SELECT id FROM code_entities 
      WHERE file_path = $1 AND entity_name = $2
      LIMIT 1`,
      [filePath, entityName]
    );

    if (entityResult.rows.length === 0) {
      return [];
    }

    const entityId = entityResult.rows[0].id;

    const usages = await query<SearchResult & { relationship: string }>(
      `SELECT 
        ce.id,
        ce.file_path as "filePath",
        ce.entity_type as "entityType",
        ce.entity_name as "entityName",
        ce.content,
        ce.start_line as "startLine",
        ce.metadata,
        cr.relationship_type as relationship
      FROM code_relationships cr
      JOIN code_entities ce ON cr.from_entity_id = ce.id
      WHERE cr.to_entity_id = $1`,
      [entityId]
    );

    return usages.rows.map((u) => ({
      entity: u,
      relationship: u.relationship,
      depth: 1,
    }));
  }

  /**
   * Find what a specific entity imports/uses (reverse dependencies)
   */
  async findDependencies(filePath: string, entityName: string): Promise<RelatedCode[]> {
    const entityResult = await query(
      `SELECT id FROM code_entities 
      WHERE file_path = $1 AND entity_name = $2
      LIMIT 1`,
      [filePath, entityName]
    );

    if (entityResult.rows.length === 0) {
      return [];
    }

    const entityId = entityResult.rows[0].id;

    const dependencies = await query<SearchResult & { relationship: string }>(
      `SELECT 
        ce.id,
        ce.file_path as "filePath",
        ce.entity_type as "entityType",
        ce.entity_name as "entityName",
        ce.content,
        ce.start_line as "startLine",
        ce.metadata,
        cr.relationship_type as relationship
      FROM code_relationships cr
      JOIN code_entities ce ON cr.to_entity_id = ce.id
      WHERE cr.from_entity_id = $1`,
      [entityId]
    );

    return dependencies.rows.map((d) => ({
      entity: d,
      relationship: d.relationship,
      depth: 1,
    }));
  }

  /**
   * Hybrid search: Combine semantic search with filters
   */
  async hybridSearch(
    searchQuery: string,
    filters: {
      entityType?: string[];
      language?: string[];
      filePath?: string;
    } = {},
    limit = 10
  ): Promise<SearchResult[]> {
    const queryEmbedding = await this.generateQueryEmbedding(searchQuery);

    // Build WHERE clause dynamically
    const conditions: string[] = [];
    const params: any[] = [JSON.stringify(queryEmbedding)];
    let paramIndex = 2;

    if (filters.entityType && filters.entityType.length > 0) {
      conditions.push(`ce.entity_type = ANY($${paramIndex}::text[])`);
      params.push(filters.entityType);
      paramIndex++;
    }

    if (filters.language && filters.language.length > 0) {
      conditions.push(`ce.language = ANY($${paramIndex}::text[])`);
      params.push(filters.language);
      paramIndex++;
    }

    if (filters.filePath) {
      conditions.push(`ce.file_path LIKE $${paramIndex}`);
      params.push(`%${filters.filePath}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    params.push(limit);

    const results = await query<SearchResult>(
      `SELECT 
        ce.id,
        ce.file_path as "filePath",
        ce.entity_type as "entityType",
        ce.entity_name as "entityName",
        ce.content,
        ce.start_line as "startLine",
        ce.metadata,
        1 - (cem.embedding <=> $1::vector) as similarity
      FROM code_entities ce
      JOIN code_embeddings cem ON ce.id = cem.entity_id
      ${whereClause}
      ORDER BY cem.embedding <=> $1::vector
      LIMIT $${paramIndex}`,
      params
    );

    return results.rows;
  }

  /**
   * Get codebase statistics
   */
  async getStatistics(): Promise<{
    totalEntities: number;
    totalFiles: number;
    totalRelationships: number;
    byType: Record<string, number>;
    byLanguage: Record<string, number>;
  }> {
    const stats = await query(
      `SELECT 
        COUNT(*) as total_entities,
        COUNT(DISTINCT file_path) as total_files,
        json_object_agg(entity_type, type_count) as by_type,
        json_object_agg(language, lang_count) as by_language
      FROM (
        SELECT 
          entity_type,
          language,
          COUNT(*) OVER (PARTITION BY entity_type) as type_count,
          COUNT(*) OVER (PARTITION BY language) as lang_count
        FROM code_entities
      ) t`
    );

    const relationshipCount = await query(`SELECT COUNT(*) as count FROM code_relationships`);

    const stat = stats.rows[0] || {};
    const relCount = relationshipCount.rows[0]?.count || 0;

    return {
      totalEntities: Number(stat.total_entities || 0),
      totalFiles: Number(stat.total_files || 0),
      totalRelationships: Number(relCount),
      byType: stat.by_type || {},
      byLanguage: stat.by_language || {},
    };
  }

  /**
   * Find code clusters (groups of similar code)
   */
  async findCodeClusters(minSimilarity = 0.85): Promise<Array<SearchResult[]>> {
    // Get all embeddings
    const allEmbeddings = await query(
      `SELECT 
        ce.id,
        ce.file_path as "filePath",
        ce.entity_type as "entityType",
        ce.entity_name as "entityName",
        ce.content,
        cem.embedding
      FROM code_entities ce
      JOIN code_embeddings cem ON ce.id = cem.entity_id
      WHERE ce.entity_type IN ('function', 'class', 'method')`
    );

    if (allEmbeddings.rows.length === 0) {
      return [];
    }

    // Simple clustering: find groups where similarity > threshold
    const clusters: Array<SearchResult[]> = [];
    const processed = new Set<string>();

    for (const entity of allEmbeddings.rows) {
      const entityId = String(entity.id);
      if (processed.has(entityId)) continue;

      // Find similar entities
      const similar = await query<SearchResult>(
        `SELECT 
          ce.id,
          ce.file_path as "filePath",
          ce.entity_type as "entityType",
          ce.entity_name as "entityName",
          ce.content,
          1 - (cem.embedding <=> $1::vector) as similarity
        FROM code_entities ce
        JOIN code_embeddings cem ON ce.id = cem.entity_id
        WHERE ce.id != $2
          AND 1 - (cem.embedding <=> $1::vector) > $3
        ORDER BY cem.embedding <=> $1::vector`,
        [entity.embedding, entity.id, minSimilarity]
      );

      if (similar.rows.length > 0) {
        clusters.push([entity as SearchResult, ...similar.rows]);
        processed.add(entityId);
        similar.rows.forEach((s) => processed.add(String(s.id)));
      }
    }

    return clusters;
  }

  /**
   * Generate embedding for a query string
   */
  private async generateQueryEmbedding(query: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: this.embeddingModel,
      input: query,
    });

    return response.data[0].embedding;
  }

  /**
   * Log search for analytics
   */
  private async logSearch(
    searchQuery: string,
    queryType: string,
    resultCount: number,
    queryTimeMs: number
  ): Promise<void> {
    try {
      await query(
        `INSERT INTO search_analytics (query_text, query_type, results_count, query_time_ms)
        VALUES ($1, $2, $3, $4)`,
        [searchQuery, queryType, resultCount, queryTimeMs]
      );
    } catch (error) {
      console.error('Failed to log search:', error);
    }
  }

  async disconnect(): Promise<void> {
    await dbDisconnect();
  }
}
