import { createHash } from 'crypto';
import * as fs from 'fs/promises';
import OpenAI from 'openai';
import * as path from 'path';
import { disconnect as dbDisconnect, query } from './db/connection';

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
   * Scan codebase and extract code entities
   */
  private async scanCodebase(rootPath: string): Promise<CodeEntity[]> {
    const entities: CodeEntity[] = [];
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rs'];

    const scan = async (dir: string): Promise<void> => {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        // Skip node_modules, .git, dist, build
        if (
          entry.name === 'node_modules' ||
          entry.name === '.git' ||
          entry.name === 'dist' ||
          entry.name === 'build' ||
          entry.name === '.next'
        ) {
          continue;
        }

        if (entry.isDirectory()) {
          await scan(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (extensions.includes(ext)) {
            const content = await fs.readFile(fullPath, 'utf-8');
            const relativePath = path.relative(rootPath, fullPath);

            // Add file-level entity
            entities.push({
              filePath: relativePath,
              entityType: 'file',
              entityName: entry.name,
              content: content.substring(0, 10000), // Limit content size
              language: ext.substring(1),
              metadata: {
                size: content.length,
                lines: content.split('\n').length,
              },
            });

            // Extract functions/classes (simplified - would use AST parser in production)
            const codeEntities = await this.extractCodeEntities(content, relativePath, ext);
            entities.push(...codeEntities);
          }
        }
      }
    };

    await scan(rootPath);
    return entities;
  }

  /**
   * Extract functions, classes, etc. from code
   * (Simplified version - production would use TypeScript AST or tree-sitter)
   */
  private async extractCodeEntities(
    content: string,
    filePath: string,
    extension: string
  ): Promise<CodeEntity[]> {
    const entities: CodeEntity[] = [];
    const lines = content.split('\n');

    // TypeScript/JavaScript patterns
    if (['.ts', '.tsx', '.js', '.jsx'].includes(extension)) {
      // Find class declarations
      const classRegex = /^export\s+(?:class|interface)\s+(\w+)/gm;
      let match;
      while ((match = classRegex.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        entities.push({
          filePath,
          entityType: content[match.index + 7] === 'c' ? 'class' : 'interface',
          entityName: match[1],
          content: this.extractBlock(lines, lineNumber - 1),
          startLine: lineNumber,
          language: extension.substring(1),
          metadata: { exported: true },
        });
      }

      // Find function declarations
      const funcRegex = /^export\s+(?:async\s+)?function\s+(\w+)/gm;
      while ((match = funcRegex.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        entities.push({
          filePath,
          entityType: 'function',
          entityName: match[1],
          content: this.extractBlock(lines, lineNumber - 1),
          startLine: lineNumber,
          language: extension.substring(1),
          metadata: { exported: true },
        });
      }

      // Find arrow functions assigned to const/let
      const arrowRegex = /^export\s+const\s+(\w+)\s*=\s*(?:async\s+)?\(/gm;
      while ((match = arrowRegex.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        entities.push({
          filePath,
          entityType: 'function',
          entityName: match[1],
          content: this.extractBlock(lines, lineNumber - 1),
          startLine: lineNumber,
          language: extension.substring(1),
          metadata: { exported: true, arrowFunction: true },
        });
      }
    }

    return entities;
  }

  /**
   * Extract code block (simplified - would use AST for proper bracket matching)
   */
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

    // Get all entities with their content
    const allEntitiesResult = await query(
      `SELECT id, file_path, entity_name, entity_type, content FROM code_entities`
    );

    if (allEntitiesResult.rows.length === 0) return;

    const allEntities = allEntitiesResult.rows;
    const relationships: Relationship[] = [];

    for (const entity of allEntities) {
      // Extract import statements
      const importRegex = /import\s+.*\s+from\s+['"](.+)['"]/g;
      let match;

      while ((match = importRegex.exec(entity.content)) !== null) {
        const importPath = match[1];

        // Find matching entity
        const importedEntity = allEntities.find((e: any) => e.file_path.includes(importPath));

        if (importedEntity) {
          relationships.push({
            fromEntityId: entity.id,
            toEntityId: importedEntity.id,
            relationshipType: 'imports',
          });
        }
      }

      // Extract function calls (simplified)
      const callRegex = /(\w+)\(/g;
      while ((match = callRegex.exec(entity.content)) !== null) {
        const calledFunction = match[1];

        const calledEntity = allEntities.find(
          (e: any) =>
            e.entity_name === calledFunction &&
            (e.entity_type === 'function' || e.entity_type === 'method')
        );

        if (calledEntity && calledEntity.id !== entity.id) {
          relationships.push({
            fromEntityId: entity.id,
            toEntityId: calledEntity.id,
            relationshipType: 'calls',
          });
        }
      }
    }

    // Store relationships
    for (const rel of relationships) {
      await query(
        `INSERT INTO code_relationships (from_entity_id, to_entity_id, relationship_type, metadata)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT DO NOTHING`,
        [rel.fromEntityId, rel.toEntityId, rel.relationshipType, JSON.stringify(rel.metadata || {})]
      );
    }

    console.log(`Stored ${relationships.length} relationships`);
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
