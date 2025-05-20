import { createClient, RedisClientType } from '@redis/client';
import { Client, SearchCommandsProvider, SchemaFieldTypes, SearchReply } from '@redis/search';
import * as fs from 'fs/promises';
import * as path from 'path';

// Augment client with search commands
type RedisSearchClient = Client & SearchCommandsProvider;

export class CodeIndexer {
  private client!: RedisSearchClient;
  private readonly indexName = 'code_index';
  private readonly prefix = 'code:';

  constructor(private redisUrl: string) {}

  // Connect and create index if needed
  async initialize(): Promise<void> {
    const base: RedisClientType = createClient({ url: this.redisUrl });
    base.on('error', err => console.error('[CodeIndexer] Redis error', err));
    await base.connect();
    this.client = base as RedisSearchClient;

    const schema = {
      content: { type: SchemaFieldTypes.TEXT },
      filePath: { type: SchemaFieldTypes.TAG }
    };
    try {
      await this.client.ft(this.indexName).create(schema, {
        ON: 'HASH',
        PREFIX: this.prefix
      });
      console.log(`[CodeIndexer] Created index '${this.indexName}'`);
    } catch (err: any) {
      if (err.message.includes('Index already exists')) {
        console.log(`[CodeIndexer] Index '${this.indexName}' already exists`);
      } else {
        throw err;
      }
    }
  }

  // Index a single file
  async indexFile(filePath: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const key = `${this.prefix}${filePath}`;
      await this.client.hSet(key, { content, filePath });
      console.log(`[CodeIndexer] Indexed file: ${filePath}`);
    } catch (err) {
      console.error(`[CodeIndexer] Failed to index ${filePath}:`, err);
    }
  }

  // Recursive scan and index all .ts/.js files under rootDir
  async indexWorkspace(rootDir: string): Promise<number> {
    const walk = async (dir: string): Promise<string[]> => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const files: string[] = [];
      for (const ent of entries) {
        const full = path.join(dir, ent.name);
        if (ent.isDirectory()) {
          if (ent.name === 'node_modules') continue;
          files.push(...await walk(full));
        } else if (/\.(ts|js|tsx|jsx)$/.test(ent.name)) {
          files.push(full);
        }
      }
      return files;
    };

    const allFiles = await walk(rootDir);
    for (const f of allFiles) await this.indexFile(f);
    return allFiles.length;
  }

  // Simple text search
  async search(term: string): Promise<Array<{ id: string; filePath: string }>> {
    try {
      const reply: SearchReply = await this.client.ft(this.indexName).search(term, {
        QUERY: { RETURN: ['filePath'], DIALECT: 2 }
      });
      return reply.documents?.map(doc => ({ id: doc.id, filePath: doc.value.filePath })) || [];
    } catch (err) {
      console.error('[CodeIndexer] Search error:', err);
      return [];
    }
  }
}
