import { createHash } from 'crypto';
import * as fs from 'fs/promises';
import OpenAI from 'openai';
import * as path from 'path';
import { disconnect as dbDisconnect, query } from './db/connection.js';

interface CodeEntity {
  filePath: string;
  entityType: 'file' | 'function' | 'class' | 'method' | 'interface' | 'type' | 'constant';
  entityName: string;
  content: string;
  startLine?: number;
  endLine?: number;
  language: string;
  metadata?: Record<string, any>;
}

interface Relationship {
  fromEntityId: bigint;
  toEntityId: bigint;
  relationshipType: 'imports' | 'calls' | 'extends' | 'implements' | 'uses';
  metadata?: Record<string, any>;
}

export class CodebaseVectorizer {
  private openai: OpenAI;
  private embeddingModel = 'text-embedding-3-small';
  private batchSize = 100;
  /** Root of the most recent scan; extractRelationships rebuilds the graph against it. */
  private lastScanRoot: string | null = null;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Main entry point: Vectorize entire codebase
   */
  async vectorizeCodebase(rootPath: string): Promise<void> {
    console.log('🚀 Starting codebase vectorization...');

    // 1. Scan codebase and extract entities
    this.lastScanRoot = rootPath;
    const entities = await this.scanCodebase(rootPath);
    console.log(`📊 Found ${entities.length} code entities`);

    // 2. Store entities in database
    const storedEntities = await this.storeEntities(entities);
    console.log(`💾 Stored ${storedEntities.length} entities`);

    // 3. Generate embeddings
    await this.generateEmbeddings(storedEntities);
    console.log(`🧠 Generated embeddings for all entities`);

    // 4. Extract and store relationships
    await this.extractRelationships(storedEntities);
    console.log(`🔗 Extracted relationships`);

    // 5. Create snapshot
    await this.createSnapshot(storedEntities.length);
    console.log('✅ Codebase vectorization complete!');
  }

  /**
   * Scan the codebase and extract code entities.
   *
   * Entity discovery is delegated to @the-new-fuse/code-graph, which parses
   * real tree-sitter ASTs. Until 2026-09-07 this method used regular
   * expressions and said so in a comment ("production would use TypeScript AST
   * or tree-sitter"); it could only see `export`-prefixed declarations and
   * silently missed everything else.
   *
   * Content slices are still read here, because the graph records where a
   * symbol is defined but not its text, and the text is what gets embedded.
   */
  private async scanCodebase(rootPath: string): Promise<CodeEntity[]> {
    const { collectFiles, extractFile } = await import('@the-new-fuse/code-graph');
    const entities: CodeEntity[] = [];
    const files = await collectFiles(rootPath);

    for (const filePath of files) {
      const relativePath = path.relative(rootPath, filePath).split(path.sep).join('/');
      let content: string;
      try {
        content = await fs.readFile(filePath, 'utf-8');
      } catch {
        continue;
      }
      const lines = content.split('\n');

      entities.push({
        filePath: relativePath,
        entityType: 'file',
        entityName: path.basename(filePath),
        content: content.substring(0, 10000),
        language: path.extname(filePath).substring(1),
        metadata: { size: content.length, lines: lines.length },
      });

      let extraction;
      try {
        extraction = await extractFile(filePath, rootPath);
      } catch {
        // A file the parser cannot handle yields its file-level entity only,
        // rather than failing the whole vectorization run.
        continue;
      }
      if (!extraction) continue;

      for (const node of extraction.nodes) {
        if (node.kind === 'file' || node.kind === 'external') continue;
        const startLine = node.sourceLocation
          ? Number(node.sourceLocation.replace(/^L/, ''))
          : undefined;
        entities.push({
          filePath: relativePath,
          entityType: node.kind as CodeEntity['entityType'],
          entityName: node.label,
          content: startLine ? this.extractBlock(lines, startLine - 1) : '',
          ...(startLine ? { startLine } : {}),
          language: node.language ?? path.extname(filePath).substring(1),
          metadata: { ...(node.meta ?? {}), astDerived: true },
        });
      }
    }

    return entities;
  }

  private extractBlock(lines: string[], startLine: number, maxLines = 100): string {
    const block = lines.slice(startLine, startLine + maxLines);
    return block.join('\n').substring(0, 5000); // Limit size
  }

  /**
   * Store entities in database
   */
  private async storeEntities(entities: CodeEntity[]): Promise<any[]> {
    const stored = [];

    for (const entity of entities) {
      const contentHash = createHash('sha256').update(entity.content).digest('hex');

      // Check if already exists
      const existing = await query(`SELECT id FROM code_entities WHERE content_hash = $1`, [
        contentHash,
      ]);

      if (existing.rows.length > 0) {
        stored.push(existing.rows[0]);
        continue;
      }

      // Insert new entity
      const result = await query(
        `INSERT INTO code_entities 
        (file_path, entity_type, entity_name, content, start_line, end_line, language, metadata, content_hash)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id`,
        [
          entity.filePath,
          entity.entityType,
          entity.entityName,
          entity.content,
          entity.startLine || null,
          entity.endLine || null,
          entity.language,
          JSON.stringify(entity.metadata || {}),
          contentHash,
        ]
      );

      if (result.rows.length > 0) {
        stored.push(result.rows[0]);
      }
    }

    return stored;
  }

  /**
   * Generate embeddings for entities
   */
  private async generateEmbeddings(entities: any[]): Promise<void> {
    console.log(`🧠 Generating embeddings for ${entities.length} entities...`);

    // Process in batches to avoid API limits
    for (let i = 0; i < entities.length; i += this.batchSize) {
      const batch = entities.slice(i, i + this.batchSize);
      console.log(
        `Processing batch ${i / this.batchSize + 1}/${Math.ceil(entities.length / this.batchSize)}`
      );

      // Get entity contents
      const entityData = await query(
        `SELECT id, entity_name, content FROM code_entities WHERE id = ANY($1::bigint[])`,
        [batch.map((e: any) => e.id)]
      );

      if (entityData.rows.length === 0) continue;

      // Prepare texts for embedding
      const texts = entityData.rows.map(
        (e: any) => `${e.entity_name}\n\n${e.content.substring(0, 8000)}`
      );

      try {
        // Generate embeddings using OpenAI
        const response = await this.openai.embeddings.create({
          model: this.embeddingModel,
          input: texts,
        });

        // Store embeddings
        for (let j = 0; j < entityData.rows.length; j++) {
          const entity = entityData.rows[j];
          const embedding = response.data[j].embedding;

          await query(
            `INSERT INTO code_embeddings (entity_id, embedding, model)
            VALUES ($1, $2, $3)
            ON CONFLICT (entity_id) DO UPDATE SET embedding = $2, model = $3`,
            [entity.id, JSON.stringify(embedding), this.embeddingModel]
          );
        }

        // Rate limiting - wait between batches
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error generating embeddings for batch ${i}:`, error);
      }
    }
  }

  /**
   * Extract relationships between code entities
   */
  private async extractRelationships(_entities: any[]): Promise<void> {
    console.log('🔗 Extracting code relationships...');

    // Previously: /(\w+)\(/g over raw text, matched against every same-named
    // entity in the corpus. That matches `if (`, `for (` and `while (`, and then
    // invents an edge to an unrelated function. Relationships now come from the
    // AST graph, and each carries the provenance defined in
    // docs/protocols/TNF_CODE_GRAPH_PROTOCOL.md.
    const rootPath = this.lastScanRoot;
    if (!rootPath) {
      console.warn('  no scan root recorded; run vectorizeCodebase() first');
      return;
    }

    const { buildGraph } = await import('@the-new-fuse/code-graph');
    const { graph } = await buildGraph(rootPath, { root: rootPath });

    const stored = await query(
      `SELECT id, file_path, entity_name, entity_type FROM code_entities`
    );
    if (stored.rows.length === 0) return;

    // Graph node ids are `<relPath>#<symbol>`; DB rows are keyed by
    // (file_path, entity_name). Match on that pair, never on name alone.
    const idByKey = new Map<string, bigint>();
    for (const row of stored.rows) {
      idByKey.set(`${row.file_path}#${row.entity_name}`, row.id);
      if (row.entity_type === 'file') idByKey.set(row.file_path, row.id);
    }

    const supported = new Set(['imports', 'calls', 'extends', 'implements', 'uses']);
    const relationships: Relationship[] = [];
    let unmapped = 0;

    for (const edge of graph.edges) {
      if (!supported.has(edge.relation)) continue; // `defines`/`contains` are containment, not dependency
      const from = idByKey.get(edge.source);
      const to = idByKey.get(edge.target);
      if (from === undefined || to === undefined || from === to) {
        unmapped += 1;
        continue;
      }
      relationships.push({
        fromEntityId: from,
        toEntityId: to,
        relationshipType: edge.relation as Relationship['relationshipType'],
        metadata: { confidence: edge.confidence, evidence: edge.evidence },
      });
    }

    for (const rel of relationships) {
      await query(
        `INSERT INTO code_relationships (from_entity_id, to_entity_id, relationship_type, metadata)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT DO NOTHING`,
        [rel.fromEntityId, rel.toEntityId, rel.relationshipType, JSON.stringify(rel.metadata || {})]
      );
    }

    // Report what did not map rather than letting the count imply full coverage.
    console.log(
      `Stored ${relationships.length} relationships` +
        (unmapped ? ` (${unmapped} graph edge(s) had no stored entity on one end)` : '')
    );
  }

  /**
   * Create snapshot of current state
   */
  private async createSnapshot(totalEntities: number): Promise<void> {
    // Try to get git commit hash
    let gitHash = null;
    try {
      const { execSync } = require('child_process');
      gitHash = execSync('git rev-parse HEAD').toString().trim();
    } catch (error) {
      console.log('Could not get git hash');
    }

    const filesCount = await query(`SELECT COUNT(DISTINCT file_path) as count FROM code_entities`);

    const count = filesCount.rows[0]?.count || 0;

    await query(
      `INSERT INTO codebase_snapshots (git_commit_hash, total_entities, total_files, metadata)
      VALUES ($1, $2, $3, $4)`,
      [gitHash, totalEntities, count, JSON.stringify({ timestamp: new Date().toISOString() })]
    );
  }

  /**
   * Cleanup
   */
  async disconnect(): Promise<void> {
    await dbDisconnect();
  }
}
