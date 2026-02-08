import fs from 'fs';
import path from 'path';
import { OpenAI } from 'openai';
import { Pool } from 'pg';
import crypto from 'crypto';

/**
 * Forefront Vectorization Script for TNF Living Documentation
 * Implements: Semantic Chunking, Metadata Crumbtrails, and Batch Processing
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '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'; // Using OpenRouter key as fallback
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fuse';
const MANIFEST_PATH = path.resolve(__dirname, '../../../.documentation-system/manifest.json');
const DOCS_ROOT = path.resolve(__dirname, '../../../');
const COLLECTION_NAME = 'tnf_knowledge_base_v1';

const openai = new OpenAI({ 
  apiKey: OPENAI_API_KEY,
  baseURL: OPENAI_API_KEY.startsWith('sk-or') ? 'https://openrouter.ai/api/v1' : undefined
});

const pool = new Pool({ connectionString: DATABASE_URL });

interface Chunk {
  id: string;
  content: string;
  metadata: any;
}

class Vectorizer {
  async run() {
    console.log('🧠 Initializing Vectorization Pipeline...');
    
    // 1. Ensure Table/Index exists
    await this.setupDatabase();

    // 2. Load Manifest
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    const files = manifest.files;
    console.log(`📂 Found ${files.length} files to vectorize.`);

    for (const file of files) {
      console.log(`📄 Processing: ${file.path}`);
      const fullPath = path.join(DOCS_ROOT, file.path);
      if (!fs.existsSync(fullPath)) continue;

      const content = fs.readFileSync(fullPath, 'utf8');
      
      // 3. Semantic Chunking
      const chunks = this.createSemanticChunks(content, file);
      console.log(`   - Created ${chunks.length} chunks.`);

      // 4. Batch Embedding & Storage
      await this.processBatch(chunks);
    }

    console.log('✅ Vectorization Run Complete!');
    await pool.end();
  }

  async setupDatabase() {
    const client = await pool.connect();
    try {
      await client.query('CREATE EXTENSION IF NOT EXISTS vector');
      await client.query(`
        CREATE TABLE IF NOT EXISTS "${COLLECTION_NAME}" (
          id TEXT PRIMARY KEY,
          content TEXT NOT NULL,
          metadata JSONB DEFAULT '{}',
          embedding vector(1536),
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      await client.query(`CREATE INDEX IF NOT EXISTS "${COLLECTION_NAME}_idx" ON "${COLLECTION_NAME}" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)`);
      console.log(`🏛️  Database table "${COLLECTION_NAME}" ready.`);
    } finally {
      client.release();
    }
  }

  createSemanticChunks(text: string, fileMetadata: any): Chunk[] {
    const chunks: Chunk[] = [];
    const lines = text.split('\n');
    let currentSection = 'root';
    let currentContent = '';
    let crumbtrail = [fileMetadata.name];

    for (const line of lines) {
      if (line.startsWith('#')) {
        // Push existing content before switching sections
        if (currentContent.trim().length > 100) {
          chunks.push(this.formatChunk(currentContent, crumbtrail, fileMetadata));
        }

        const level = (line.match(/#/g) || []).length;
        const title = line.replace(/#/g, '').trim();
        
        crumbtrail = crumbtrail.slice(0, level);
        crumbtrail[level] = title;
        currentContent = line + '\n';
      } else {
        currentContent += line + '\n';
        
        // Split very long sections
        if (currentContent.length > 2000) {
          chunks.push(this.formatChunk(currentContent, crumbtrail, fileMetadata));
          currentContent = ''; // Start fresh but keep the crumbtrail
        }
      }
    }

    if (currentContent.trim().length > 50) {
      chunks.push(this.formatChunk(currentContent, crumbtrail, fileMetadata));
    }

    return chunks;
  }

  formatChunk(content: string, crumbtrail: string[], meta: any): Chunk {
    const cleanTrail = crumbtrail.filter(Boolean).join(' > ');
    const enrichedContent = `File: ${meta.path}\nContext: ${cleanTrail}\n---\n${content}`;
    
    return {
      id: crypto.createHash('md5').update(enrichedContent).digest('hex'),
      content: enrichedContent,
      metadata: {
        ...meta,
        section: crumbtrail[crumbtrail.length - 1],
        crumbtrail: cleanTrail
      }
    };
  }

  async processBatch(chunks: Chunk[]) {
    if (chunks.length === 0) return;

    // OpenAI text-embedding-3-small dimensions = 1536
    const response = await openai.embeddings.create({
      model: OPENAI_API_KEY.startsWith('sk-or') ? 'openai/text-embedding-3-small' : 'text-embedding-3-small',
      input: chunks.map(c => c.content.replace(/\n/g, ' ')),
    });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = response.data[i].embedding;
        
        await client.query(`
          INSERT INTO "${COLLECTION_NAME}" (id, content, metadata, embedding)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (id) DO UPDATE SET
            content = EXCLUDED.content,
            metadata = EXCLUDED.metadata,
            embedding = EXCLUDED.embedding
        `, [
          chunk.id,
          chunk.content,
          JSON.stringify(chunk.metadata),
          `[${embedding.join(',')}]`
        ]);
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

const v = new Vectorizer();
v.run().catch(console.error);
