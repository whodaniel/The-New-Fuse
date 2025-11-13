"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PgVectorDriver_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PgVectorDriver = void 0;
const common_1 = require("@nestjs/common");
const pg_1 = require("pg");
let PgVectorDriver = PgVectorDriver_1 = class PgVectorDriver {
    config;
    logger = new common_1.Logger(PgVectorDriver_1.name);
    pool;
    constructor(config) {
        this.config = config;
        this.pool = new pg_1.Pool({
            connectionString: config.connectionString,
            host: config.host,
            port: config.port,
            database: config.database,
            ssl: config.ssl,
            max: config.poolSize || 10,
            idleTimeoutMillis: config.timeout || 30000,
        });
        this.initializeExtensions();
    }
    async initializeExtensions() {
        try {
            const client = await this.pool.connect();
            await client.query('CREATE EXTENSION IF NOT EXISTS vector');
            client.release();
            this.logger.log('pgvector extension initialized');
        }
        catch (error) {
            this.logger.error('Failed to initialize pgvector extension', error);
            throw error;
        }
    }
    async createCollection(config) {
        const client = await this.pool.connect();
        try {
            const createTableQuery = `
        CREATE TABLE IF NOT EXISTS "${config.name}" (
          id TEXT PRIMARY KEY,
          content TEXT NOT NULL,
          metadata JSONB DEFAULT '{}',`;
            embedding;
            vector($, { config, : .dimension } `),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      ;

      await client.query(createTableQuery);

      // Create vector index for similarity search
      const createIndexQuery = 
        CREATE INDEX IF NOT EXISTS "${config.name}`, _embedding_idx, " , ON, "${config.name}" `
        USING ivfflat (embedding vector_${config.metric}_ops)`, WITH(lists = 100));
            await client.query(createIndexQuery);
            // Create metadata index for filtering
            const createMetadataIndexQuery = `
        CREATE INDEX IF NOT EXISTS "${config.name}_metadata_idx" 
        ON "${config.name}" `;
            USING;
            gin(metadata) `
      `;
            await client.query(createMetadataIndexQuery);
            this.logger.log(Collection, "${config.name}", created, successfully);
        }
        catch (error) {
            `
      this.logger.error(Failed to create collection "${config.name}` `", error);
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteCollection(name: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(DROP TABLE IF EXISTS "${name}");`;
            this.logger.log(Collection, "${name}`", deleted, successfully);
        }
        try { }
        catch (error) {
            this.logger.error(`Failed to delete collection "${name}", error);
      throw error;
    } finally {
      client.release();
    }
  }

  async listCollections(): Promise<string[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = tables.table_name 
          AND column_name = 'embedding'
          AND data_type = 'USER-DEFINED'
        )` `);

      return result.rows.map(row => row.table_name);
    } catch (error) {
      this.logger.error('Failed to list collections', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async collectionExists(name: string): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = $1 
          AND table_schema = 'public'
        )
      , [name]);

      return result.rows[0].exists;
    } catch (error) {
      this.logger.error(`, Failed, to, check);
            if (collection)
                "${name}";
            exists, error;
            ;
            throw error;
        }
        finally {
            client.release();
        }
    }
    async addDocuments(collection, documents) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            for (const doc of documents) {
                `
        const query = `;
                INSERT;
                INTO;
                "${collection}`"(id, content, metadata, embedding);
                VALUES($1, $2, $3, $4);
                ON;
                CONFLICT(id);
                DO;
                UPDATE;
                SET;
                content = EXCLUDED.content,
                    metadata = EXCLUDED.metadata,
                    embedding = EXCLUDED.embedding,
                    updated_at = NOW();
                await client.query(query, [
                    doc.id,
                    doc.content,
                    JSON.stringify(doc.metadata || {}),
                    doc.embedding ? [$, { doc, : .embedding.join(',') }] : null,
                ]);
            }
            await client.query('COMMIT');
            `
      this.logger.log(Added ${documents.length}`;
            documents;
            to;
            collection;
            "${collection}";
            ;
            `
    } catch (error) {`;
            await client.query('ROLLBACK');
            this.logger.error(Failed, to, add, documents, to, collection, "${collection}", error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    async updateDocument(collection, id, document) {
        const client = await this.pool.connect();
        try {
            const setParts = [];
            const values = [];
            let paramIndex = 1;
            `
      if (document.content !== undefined) {`;
            setParts.push(`content = $${paramIndex++});
        values.push(document.content);
      }
`);
            if (document.metadata !== undefined) {
                `
        setParts.push(metadata = $${paramIndex++}`;
                ;
                values.push(JSON.stringify(document.metadata));
            }
            if (document.embedding !== undefined) {
                setParts.push(embedding = $$, { paramIndex }++);
            }
            ;
            values.push(document.embedding ? [$, { document, : .embedding.join(',') }] : null);
        }
        finally {
        }
        if (setParts.length === 0) {
            return; // Nothing to update
        }
        setParts.push(updated_at = NOW());
        values.push(id);
        `
      const query = `;
        UPDATE;
        "${collection}`";
        SET;
        $;
        {
            setParts.join(', ');
        }
        WHERE;
        id = $$;
        {
            paramIndex;
        }
        ;
        const result = await client.query(query, values);
        `
      if (result.rowCount === 0) {`;
        throw new Error(`Document with id "${id}" not found in collection "${collection}");
      }` `
      this.logger.log(Updated document "${id}`, " in collection ", $, { collection }, "););
    }
    catch(error) {
        `
      this.logger.error(Failed to update document "${id}`;
        " in collection ";
        $;
        {
            collection;
        }
        "`, error);;
        throw error;
    }
};
exports.PgVectorDriver = PgVectorDriver;
exports.PgVectorDriver = PgVectorDriver = PgVectorDriver_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Object])
], PgVectorDriver);
try { }
finally {
    client.release();
}
async;
deleteDocument(collection, string, id, string);
Promise < void  > {
    const: client = await this.pool.connect(),
    try: {
        const: result = await client.query(DELETE, FROM, "${collection}", WHERE, id = $1, [id]),
        if(result) { }, : .rowCount === 0
    }
};
{
    `
        throw new Error(Document with id "${id}` `" not found in collection "${collection}");
      }
`;
    this.logger.log(`Deleted document "${id}`, " from collection ", $, { collection }, "););
}
try { }
catch (error) {
    `
      this.logger.error(Failed to delete document "${id}` `" from collection "${collection}", error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getDocument(collection: string, id: string): Promise<VectorDocument | null> {
    const client = await this.pool.connect();
    try {`;
    const result = await client.query(`
        SELECT id, content, metadata, embedding 
        FROM "${collection}`, " , WHERE, id = $1, [id]);
    if (result.rows.length === 0) {
        return null;
    }
    const row = result.rows[0];
    return {
        id: row.id,
        content: row.content,
        metadata: row.metadata,
        embedding: row.embedding ? JSON.parse(row.embedding) : undefined,
    };
}
try { }
catch (error) {
    this.logger.error(Failed, to, get, document, "${id}", from, collection, "${collection}", error);
    throw error;
}
finally {
    client.release();
}
async;
similaritySearch(collection, string, query, vector_database_interface_1.VectorQuery);
Promise < vector_database_interface_1.VectorSearchResult[] > {
    const: client = await this.pool.connect(),
    try: {
        let, whereClause = '',
        const: values, any, []:  = [],
        let, paramIndex = 1,
        if(query) { }, : .embedding
    }
};
{
    `
        values.push([${query.embedding.join(',')}`;
    ;
}
{
    throw new Error('Embedding is required for similarity search');
}
if (query.metadata_filter) {
    const filterConditions = [];
    for (const [key, value] of Object.entries(query.metadata_filter)) {
        filterConditions.push(metadata -  >> '${key}', $$, {}++, paramIndex);
    }
    `);
          values.push(value);
        }
        if (filterConditions.length > 0) {
          whereClause = WHERE ${filterConditions.join(' AND ')};
        }
      }

      const sqlQuery = 
        SELECT 
          id, 
          content, 
          metadata,
          embedding <=> $1 as distance,`;
    1 - (embedding <=  > $1);
    `
        FROM "${collection}`;
    ";
    $;
    {
        whereClause;
    }
    ORDER;
    BY;
    embedding <=  > $1;
    LIMIT;
    $$;
    {
        ++paramIndex;
    }
    ;
    values.push(query.limit);
    const result = await client.query(sqlQuery, values);
    return result.rows
        .filter(row => (1 - row.distance) >= query.threshold)
        .map(row => ({
        id: row.id,
        content: row.content,
        metadata: row.metadata,
        score: row.score,
        distance: row.distance,
    }));
    `
    } catch (error) {`;
    this.logger.error(Failed, to, perform, similarity, search in collection, "${collection}`", error);
    throw error;
}
try { }
finally {
    client.release();
}
async;
hybridSearch(collection, string, query, vector_database_interface_1.VectorQuery);
Promise < vector_database_interface_1.VectorSearchResult[] > {
    // For now, hybrid search is the same as similarity search
    // In the future, this could combine vector similarity with text search
    return: this.similaritySearch(collection, query)
};
async;
batchAdd(collection, string, documents, vector_database_interface_1.VectorDocument[]);
Promise < void  > {
    return: this.addDocuments(collection, documents)
};
async;
batchDelete(collection, string, ids, string[]);
Promise < void  > {
    const: client = await this.pool.connect(),
    try: {
        await, client, : .query('BEGIN'),
        const: query = DELETE, FROM, "${collection}": WHERE, id = ANY($1),
        await, client, : .query(query, [ids])
    } `
      await client.query('COMMIT');`,
    this: .logger.log(Deleted, $, { ids, : .length } ` documents from collection "${collection}");
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error(Failed to batch delete documents from collection "${collection}", error);
      throw error;
    } finally {
      client.release();
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      return true;
    } catch (error) {
      this.logger.error('Health check failed', error);
      return false;
    }
  }

  async getStats(collection?: string): Promise<Record<string, any>> {
    const client = await this.pool.connect();
    try {
      if (collection) {
        const result = await client.query(
          SELECT `, COUNT( * ), `
            pg_total_relation_size('${collection}`, ') as size_bytes, FROM, "${collection}" `
        `),
    return: {
        collection,
        document_count: parseInt(result.rows[0].document_count),
        size_bytes: parseInt(result.rows[0].size_bytes),
    }
};
{
    const collections = await this.listCollections();
    const stats = {
        total_collections: collections.length,
        collections: {},
    };
    for (const coll of collections) {
        stats.collections[coll] = await this.getStats(coll);
    }
    return stats;
}
try { }
catch (error) {
    this.logger.error('Failed to get stats', error);
    throw error;
}
finally {
    client.release();
}
//# sourceMappingURL=pgvector.driver.js.map