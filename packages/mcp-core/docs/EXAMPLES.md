# MCP Core Examples

This document provides comprehensive examples of how to use the MCP Core package for various use cases and scenarios.

## Table of Contents

- [Basic Examples](#basic-examples)
- [Resource Management](#resource-management)
- [Tool Development](#tool-development)
- [Advanced Server Patterns](#advanced-server-patterns)
- [Client Integration](#client-integration)
- [Real-World Applications](#real-world-applications)
- [Testing Examples](#testing-examples)
- [Performance Optimization](#performance-optimization)

## Basic Examples

### Simple Echo Server

A basic MCP server that echoes requests back to clients.

```typescript
import { MCPSystemFactory, ResourceHandler, ToolHandler } from '@the-new-fuse/mcp-core';

// Create server
const server = MCPSystemFactory.createServer({
  name: 'echo-server',
  version: '1.0.0',
  port: 8080
});

// Echo tool handler
class EchoToolHandler extends ToolHandler {
  name = 'echo';
  
  async execute(params: { message: string }): Promise<any> {
    return {
      echo: params.message,
      timestamp: new Date().toISOString(),
      length: params.message.length
    };
  }
  
  async validate(params: any): Promise<boolean> {
    return typeof params === 'object' && typeof params.message === 'string';
  }
}

// Register the echo tool
await server.registerTool({
  name: 'echo',
  description: 'Echoes back the provided message',
  inputSchema: {
    type: 'object',
    properties: {
      message: { type: 'string', maxLength: 1000 }
    },
    required: ['message']
  }
}, new EchoToolHandler());

// Start server
await server.start();
console.log('Echo server running on port 8080');
```

### Simple Client

```typescript
import { MCPSystemFactory } from '@the-new-fuse/mcp-core';

async function runClient() {
  const client = MCPSystemFactory.createClient({
    serverUrl: 'ws://localhost:8080',
    connectionTimeout: 5000
  });

  try {
    // Connect to server
    await client.connect();
    console.log('Connected to server');

    // Call the echo tool
    const response = await client.sendRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'echo',
        arguments: { message: 'Hello, MCP!' }
      }
    });

    console.log('Echo response:', response.result);

  } finally {
    await client.disconnect();
  }
}

runClient().catch(console.error);
```

## Resource Management

### File System Resource Manager

A comprehensive file system resource handler with full CRUD operations.

```typescript
import { ResourceHandler } from '@the-new-fuse/mcp-core';
import { promises as fs } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { watch, FSWatcher } from 'fs';

export class FileSystemResourceHandler extends ResourceHandler {
  private basePath: string;
  private watchers: Map<string, FSWatcher> = new Map();
  private subscriptions: Map<string, Set<(data: any) => void>> = new Map();

  constructor(basePath: string) {
    super();
    this.basePath = basePath;
  }

  async read(uri: string): Promise<any> {
    const filePath = this.uriToPath(uri);
    
    try {
      await this.ensurePathExists(dirname(filePath));
      const stats = await fs.stat(filePath);
      
      if (stats.isDirectory()) {
        return this.readDirectory(filePath);
      } else {
        return this.readFile(filePath, stats);
      }
    } catch (error) {
      throw new Error(`Failed to read resource ${uri}: ${error.message}`);
    }
  }

  async list(pattern?: string): Promise<Array<{ uri: string; name: string; mimeType?: string }>> {
    const files = await this.scanDirectory(this.basePath);
    
    return files
      .filter(file => !pattern || this.matchesPattern(file, pattern))
      .map(file => ({
        uri: this.pathToUri(file),
        name: basename(file),
        mimeType: this.getMimeType(file)
      }));
  }

  async write(uri: string, data: any): Promise<void> {
    const filePath = this.uriToPath(uri);
    
    try {
      await this.ensurePathExists(dirname(filePath));
      
      let content: string;
      if (typeof data === 'string') {
        content = data;
      } else if (typeof data === 'object') {
        content = JSON.stringify(data, null, 2);
      } else {
        content = String(data);
      }
      
      await fs.writeFile(filePath, content, 'utf-8');
      
      // Notify subscribers of the change
      this.notifySubscribers(uri, {
        action: 'write',
        uri,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      throw new Error(`Failed to write resource ${uri}: ${error.message}`);
    }
  }

  async delete(uri: string): Promise<void> {
    const filePath = this.uriToPath(uri);
    
    try {
      const stats = await fs.stat(filePath);
      
      if (stats.isDirectory()) {
        await fs.rmdir(filePath, { recursive: true });
      } else {
        await fs.unlink(filePath);
      }
      
      // Clean up any watchers
      this.stopWatching(uri);
      
      // Notify subscribers of deletion
      this.notifySubscribers(uri, {
        action: 'delete',
        uri,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      throw new Error(`Failed to delete resource ${uri}: ${error.message}`);
    }
  }

  async subscribe(uri: string, callback: (data: any) => void): Promise<() => void> {
    const filePath = this.uriToPath(uri);
    
    // Add callback to subscriptions
    if (!this.subscriptions.has(uri)) {
      this.subscriptions.set(uri, new Set());
    }
    this.subscriptions.get(uri)!.add(callback);
    
    // Start watching if not already watching
    if (!this.watchers.has(uri)) {
      try {
        const watcher = watch(filePath, { persistent: false }, (eventType, filename) => {
          this.handleFileChange(uri, eventType, filename);
        });
        
        this.watchers.set(uri, watcher);
      } catch (error) {
        console.warn(`Failed to watch ${uri}: ${error.message}`);
      }
    }
    
    // Return unsubscribe function
    return () => {
      const subscribers = this.subscriptions.get(uri);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.subscriptions.delete(uri);
          this.stopWatching(uri);
        }
      }
    };
  }

  async getMetadata(uri: string): Promise<any> {
    const filePath = this.uriToPath(uri);
    
    try {
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        mimeType: this.getMimeType(filePath),
        lastModified: stats.mtime.toISOString(),
        created: stats.birthtime.toISOString(),
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
        permissions: stats.mode.toString(8),
        checksum: await this.calculateChecksum(filePath)
      };
    } catch (error) {
      throw new Error(`Failed to get metadata for ${uri}: ${error.message}`);
    }
  }

  // Private methods

  private async readFile(filePath: string, stats: any): Promise<any> {
    const content = await fs.readFile(filePath, 'utf-8');
    return {
      content,
      mimeType: this.getMimeType(filePath),
      size: stats.size,
      lastModified: stats.mtime.toISOString(),
      encoding: 'utf-8'
    };
  }

  private async readDirectory(dirPath: string): Promise<any> {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const items = [];
    
    for (const entry of entries) {
      const itemPath = join(dirPath, entry.name);
      const stats = await fs.stat(itemPath);
      
      items.push({
        name: entry.name,
        uri: this.pathToUri(itemPath),
        type: entry.isDirectory() ? 'directory' : 'file',
        size: entry.isFile() ? stats.size : undefined,
        lastModified: stats.mtime.toISOString(),
        mimeType: entry.isFile() ? this.getMimeType(itemPath) : undefined
      });
    }
    
    return {
      type: 'directory',
      items,
      count: items.length
    };
  }

  private async scanDirectory(dir: string, maxDepth = 10, currentDepth = 0): Promise<string[]> {
    if (currentDepth >= maxDepth) return [];
    
    const files: string[] = [];
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        
        if (entry.isDirectory()) {
          files.push(...await this.scanDirectory(fullPath, maxDepth, currentDepth + 1));
        } else {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`Failed to scan directory ${dir}: ${error.message}`);
    }
    
    return files;
  }

  private async ensurePathExists(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      // Ignore if directory already exists
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  private handleFileChange(uri: string, eventType: string, filename?: string): void {
    this.notifySubscribers(uri, {
      action: 'change',
      eventType,
      filename,
      uri,
      timestamp: new Date().toISOString()
    });
  }

  private notifySubscribers(uri: string, data: any): void {
    const subscribers = this.subscriptions.get(uri);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in subscription callback for ${uri}:`, error);
        }
      });
    }
  }

  private stopWatching(uri: string): void {
    const watcher = this.watchers.get(uri);
    if (watcher) {
      watcher.close();
      this.watchers.delete(uri);
    }
  }

  private uriToPath(uri: string): string {
    const url = new URL(uri);
    return join(this.basePath, decodeURIComponent(url.pathname));
  }

  private pathToUri(path: string): string {
    const relativePath = path.replace(this.basePath, '').replace(/\\/g, '/');
    return `file://${relativePath}`;
  }

  private getMimeType(filePath: string): string {
    const ext = extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.txt': 'text/plain',
      '.json': 'application/json',
      '.js': 'application/javascript',
      '.ts': 'application/typescript',
      '.html': 'text/html',
      '.css': 'text/css',
      '.xml': 'application/xml',
      '.csv': 'text/csv',
      '.md': 'text/markdown',
      '.pdf': 'application/pdf',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }

  private matchesPattern(path: string, pattern: string): boolean {
    // Simple glob pattern matching
    const regex = new RegExp(
      pattern.replace(/\*\*/g, '.*')
              .replace(/\*/g, '[^/]*')
              .replace(/\?/g, '[^/]')
    );
    return regex.test(path);
  }

  private async calculateChecksum(filePath: string): Promise<string> {
    const crypto = require('crypto');
    const content = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  }
}

// Usage example
async function setupFileServer() {
  const server = MCPSystemFactory.createServer({
    name: 'file-server',
    version: '1.0.0',
    port: 8080
  });

  const fileHandler = new FileSystemResourceHandler('./data');

  // Register file resources
  await server.registerResource({
    uri: 'file:///',
    name: 'File System',
    description: 'Local file system access',
    permissions: {
      read: true,
      write: true,
      subscribe: true
    }
  }, fileHandler);

  await server.start();
  console.log('File server running on port 8080');
}
```

### Database Resource Handler

```typescript
import { ResourceHandler } from '@the-new-fuse/mcp-core';
import { Pool } from 'pg'; // PostgreSQL example

export class PostgreSQLResourceHandler extends ResourceHandler {
  private pool: Pool;
  private subscriptions: Map<string, Set<(data: any) => void>> = new Map();

  constructor(connectionConfig: any) {
    super();
    this.pool = new Pool(connectionConfig);
  }

  async read(uri: string): Promise<any> {
    const { table, id, query } = this.parseUri(uri);
    
    try {
      if (query) {
        // Execute custom query
        const result = await this.pool.query(query);
        return {
          query,
          rows: result.rows,
          rowCount: result.rowCount,
          fields: result.fields?.map(f => ({ name: f.name, type: f.dataTypeID }))
        };
      } else if (id) {
        // Get specific record
        const result = await this.pool.query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
        if (result.rows.length === 0) {
          throw new Error(`Record not found: ${uri}`);
        }
        return {
          table,
          id,
          data: result.rows[0],
          mimeType: 'application/json'
        };
      } else {
        // List all records (with pagination)
        const result = await this.pool.query(`SELECT * FROM ${table} LIMIT 100`);
        return {
          table,
          rows: result.rows,
          count: result.rowCount,
          hasMore: result.rowCount === 100
        };
      }
    } catch (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }
  }

  async list(pattern?: string): Promise<Array<{ uri: string; name: string }>> {
    try {
      // Get all tables
      const tablesResult = await this.pool.query(`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        ${pattern ? `AND tablename ILIKE $1` : ''}
      `, pattern ? [`%${pattern}%`] : []);
      
      const resources = [];
      
      for (const row of tablesResult.rows) {
        const tableName = row.tablename;
        
        // Add table resource
        resources.push({
          uri: `db://${tableName}`,
          name: `Table: ${tableName}`,
          mimeType: 'application/json'
        });
        
        // Add sample records (first 10)
        try {
          const recordsResult = await this.pool.query(
            `SELECT * FROM ${tableName} LIMIT 10`
          );
          
          for (const record of recordsResult.rows) {
            if (record.id) {
              resources.push({
                uri: `db://${tableName}/${record.id}`,
                name: `${tableName} Record ${record.id}`,
                mimeType: 'application/json'
              });
            }
          }
        } catch (error) {
          console.warn(`Failed to list records for table ${tableName}: ${error.message}`);
        }
      }
      
      return resources;
    } catch (error) {
      throw new Error(`Failed to list database resources: ${error.message}`);
    }
  }

  async write(uri: string, data: any): Promise<void> {
    const { table, id } = this.parseUri(uri);
    
    try {
      if (id) {
        // Update existing record
        const fields = Object.keys(data);
        const values = Object.values(data);
        const placeholders = fields.map((_, i) => `$${i + 2}`).join(', ');
        const setClause = fields.map((field, i) => `${field} = $${i + 2}`).join(', ');
        
        const result = await this.pool.query(
          `UPDATE ${table} SET ${setClause} WHERE id = $1`,
          [id, ...values]
        );
        
        if (result.rowCount === 0) {
          throw new Error(`Record not found: ${uri}`);
        }
      } else {
        // Insert new record
        const fields = Object.keys(data);
        const values = Object.values(data);
        const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
        const fieldsList = fields.join(', ');
        
        await this.pool.query(
          `INSERT INTO ${table} (${fieldsList}) VALUES (${placeholders})`,
          values
        );
      }
      
      // Notify subscribers
      this.notifySubscribers(uri, {
        action: id ? 'update' : 'insert',
        table,
        id,
        data,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      throw new Error(`Database write failed: ${error.message}`);
    }
  }

  async delete(uri: string): Promise<void> {
    const { table, id } = this.parseUri(uri);
    
    if (!id) {
      throw new Error('Cannot delete entire table without specific ID');
    }
    
    try {
      const result = await this.pool.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
      
      if (result.rowCount === 0) {
        throw new Error(`Record not found: ${uri}`);
      }
      
      // Notify subscribers
      this.notifySubscribers(uri, {
        action: 'delete',
        table,
        id,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      throw new Error(`Database delete failed: ${error.message}`);
    }
  }

  async subscribe(uri: string, callback: (data: any) => void): Promise<() => void> {
    // Add to subscriptions
    if (!this.subscriptions.has(uri)) {
      this.subscriptions.set(uri, new Set());
    }
    this.subscriptions.get(uri)!.add(callback);
    
    // For PostgreSQL, you could implement LISTEN/NOTIFY
    // This is a simplified example
    
    return () => {
      const subscribers = this.subscriptions.get(uri);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.subscriptions.delete(uri);
        }
      }
    };
  }

  async getMetadata(uri: string): Promise<any> {
    const { table, id } = this.parseUri(uri);
    
    try {
      if (id) {
        // Get record metadata
        const result = await this.pool.query(
          `SELECT *, pg_size_pretty(pg_column_size(*)) as size FROM ${table} WHERE id = $1`,
          [id]
        );
        
        if (result.rows.length === 0) {
          throw new Error(`Record not found: ${uri}`);
        }
        
        return {
          table,
          id,
          size: result.rows[0].size,
          lastModified: result.rows[0].updated_at || result.rows[0].created_at,
          fields: Object.keys(result.rows[0])
        };
      } else {
        // Get table metadata
        const result = await this.pool.query(`
          SELECT 
            schemaname,
            tablename,
            tableowner,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
            pg_stat_get_tuples_returned(c.oid) as rows_read,
            pg_stat_get_tuples_inserted(c.oid) as rows_inserted,
            pg_stat_get_tuples_updated(c.oid) as rows_updated,
            pg_stat_get_tuples_deleted(c.oid) as rows_deleted
          FROM pg_tables t
          JOIN pg_class c ON c.relname = t.tablename
          WHERE schemaname = 'public' AND tablename = $1
        `, [table]);
        
        return result.rows[0];
      }
    } catch (error) {
      throw new Error(`Failed to get metadata: ${error.message}`);
    }
  }

  private parseUri(uri: string): { table: string; id?: string; query?: string } {
    const url = new URL(uri);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    if (url.search) {
      // Custom query
      const params = new URLSearchParams(url.search);
      return {
        table: pathParts[0],
        query: params.get('q') || undefined
      };
    } else if (pathParts.length === 2) {
      // Specific record
      return {
        table: pathParts[0],
        id: pathParts[1]
      };
    } else if (pathParts.length === 1) {
      // Table
      return {
        table: pathParts[0]
      };
    } else {
      throw new Error(`Invalid database URI: ${uri}`);
    }
  }

  private notifySubscribers(uri: string, data: any): void {
    const subscribers = this.subscriptions.get(uri);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in subscription callback for ${uri}:`, error);
        }
      });
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
```

## Tool Development

### Data Processing Tool Suite

```typescript
import { ToolHandler } from '@the-new-fuse/mcp-core';
import Ajv from 'ajv';

// CSV Processing Tool
export class CSVProcessorToolHandler extends ToolHandler {
  name = 'csv-processor';
  private ajv = new Ajv();

  async execute(params: {
    data: string;
    operation: 'parse' | 'filter' | 'transform' | 'aggregate';
    options?: any;
  }): Promise<any> {
    const { data, operation, options = {} } = params;
    
    try {
      const rows = this.parseCSV(data);
      
      switch (operation) {
        case 'parse':
          return this.parseOperation(rows, options);
        case 'filter':
          return this.filterOperation(rows, options);
        case 'transform':
          return this.transformOperation(rows, options);
        case 'aggregate':
          return this.aggregateOperation(rows, options);
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
    } catch (error) {
      throw new Error(`CSV processing failed: ${error.message}`);
    }
  }

  async validate(params: any): Promise<boolean> {
    const schema = {
      type: 'object',
      properties: {
        data: { type: 'string', minLength: 1 },
        operation: { type: 'string', enum: ['parse', 'filter', 'transform', 'aggregate'] },
        options: { type: 'object' }
      },
      required: ['data', 'operation']
    };
    
    return this.ajv.validate(schema, params);
  }

  private parseCSV(data: string): Array<Record<string, string>> {
    const lines = data.trim().split('\n');
    if (lines.length === 0) return [];
    
    const headers = this.parseCSVLine(lines[0]);
    const rows: Array<Record<string, string>> = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      const row: Record<string, string> = {};
      
      headers.forEach((header, index) => {
        row[header.trim()] = values[index]?.trim() || '';
      });
      
      rows.push(row);
    }
    
    return rows;
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  }

  private parseOperation(rows: Array<Record<string, string>>, options: any): any {
    const { includeTypes = false, sampleSize = 10 } = options;
    
    const result = {
      headers: rows.length > 0 ? Object.keys(rows[0]) : [],
      rowCount: rows.length,
      sample: rows.slice(0, sampleSize)
    };
    
    if (includeTypes) {
      result.types = this.inferTypes(rows);
    }
    
    return result;
  }

  private filterOperation(rows: Array<Record<string, string>>, options: any): any {
    const { conditions = [], limit } = options;
    
    let filtered = rows;
    
    for (const condition of conditions) {
      const { field, operator, value } = condition;
      
      filtered = filtered.filter(row => {
        const rowValue = row[field];
        
        switch (operator) {
          case 'equals':
            return rowValue === value;
          case 'contains':
            return rowValue.includes(value);
          case 'startsWith':
            return rowValue.startsWith(value);
          case 'endsWith':
            return rowValue.endsWith(value);
          case 'gt':
            return parseFloat(rowValue) > parseFloat(value);
          case 'lt':
            return parseFloat(rowValue) < parseFloat(value);
          case 'regex':
            return new RegExp(value).test(rowValue);
          default:
            return true;
        }
      });
    }
    
    if (limit) {
      filtered = filtered.slice(0, limit);
    }
    
    return {
      originalCount: rows.length,
      filteredCount: filtered.length,
      data: filtered
    };
  }

  private transformOperation(rows: Array<Record<string, string>>, options: any): any {
    const { transformations = [] } = options;
    
    const transformed = rows.map(row => {
      const newRow = { ...row };
      
      for (const transform of transformations) {
        const { field, operation, target, value } = transform;
        
        switch (operation) {
          case 'rename':
            if (newRow[field] !== undefined) {
              newRow[target] = newRow[field];
              delete newRow[field];
            }
            break;
          case 'uppercase':
            if (newRow[field]) newRow[target || field] = newRow[field].toUpperCase();
            break;
          case 'lowercase':
            if (newRow[field]) newRow[target || field] = newRow[field].toLowerCase();
            break;
          case 'trim':
            if (newRow[field]) newRow[target || field] = newRow[field].trim();
            break;
          case 'replace':
            if (newRow[field]) newRow[target || field] = newRow[field].replace(value.search, value.replace);
            break;
          case 'format':
            if (newRow[field]) newRow[target || field] = this.formatValue(newRow[field], value);
            break;
        }
      }
      
      return newRow;
    });
    
    return {
      originalCount: rows.length,
      transformedCount: transformed.length,
      data: transformed
    };
  }

  private aggregateOperation(rows: Array<Record<string, string>>, options: any): any {
    const { groupBy, aggregations = [] } = options;
    
    if (groupBy) {
      return this.groupAndAggregate(rows, groupBy, aggregations);
    } else {
      return this.simpleAggregate(rows, aggregations);
    }
  }

  private groupAndAggregate(rows: Array<Record<string, string>>, groupBy: string, aggregations: any[]): any {
    const groups = new Map<string, Array<Record<string, string>>>();
    
    // Group rows
    for (const row of rows) {
      const key = row[groupBy] || 'null';
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(row);
    }
    
    // Aggregate each group
    const results = [];
    for (const [groupValue, groupRows] of groups) {
      const result = { [groupBy]: groupValue };
      
      for (const agg of aggregations) {
        const { field, operation, alias } = agg;
        const values = groupRows.map(row => parseFloat(row[field])).filter(v => !isNaN(v));
        const resultField = alias || `${operation}_${field}`;
        
        switch (operation) {
          case 'count':
            result[resultField] = groupRows.length;
            break;
          case 'sum':
            result[resultField] = values.reduce((sum, val) => sum + val, 0);
            break;
          case 'avg':
            result[resultField] = values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
            break;
          case 'min':
            result[resultField] = values.length > 0 ? Math.min(...values) : null;
            break;
          case 'max':
            result[resultField] = values.length > 0 ? Math.max(...values) : null;
            break;
        }
      }
      
      results.push(result);
    }
    
    return {
      groupBy,
      groupCount: groups.size,
      data: results
    };
  }

  private simpleAggregate(rows: Array<Record<string, string>>, aggregations: any[]): any {
    const result = { totalRows: rows.length };
    
    for (const agg of aggregations) {
      const { field, operation, alias } = agg;
      const values = rows.map(row => parseFloat(row[field])).filter(v => !isNaN(v));
      const resultField = alias || `${operation}_${field}`;
      
      switch (operation) {
        case 'count':
          result[resultField] = rows.length;
          break;
        case 'count_distinct':
          result[resultField] = new Set(rows.map(row => row[field])).size;
          break;
        case 'sum':
          result[resultField] = values.reduce((sum, val) => sum + val, 0);
          break;
        case 'avg':
          result[resultField] = values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
          break;
        case 'min':
          result[resultField] = values.length > 0 ? Math.min(...values) : null;
          break;
        case 'max':
          result[resultField] = values.length > 0 ? Math.max(...values) : null;
          break;
      }
    }
    
    return result;
  }

  private inferTypes(rows: Array<Record<string, string>>): Record<string, string> {
    if (rows.length === 0) return {};
    
    const types: Record<string, string> = {};
    const headers = Object.keys(rows[0]);
    
    for (const header of headers) {
      const values = rows.slice(0, 100).map(row => row[header]).filter(v => v && v.trim());
      
      if (values.length === 0) {
        types[header] = 'string';
        continue;
      }
      
      const allNumbers = values.every(v => !isNaN(parseFloat(v)));
      const allIntegers = allNumbers && values.every(v => Number.isInteger(parseFloat(v)));
      const allDates = values.every(v => !isNaN(Date.parse(v)));
      const allBooleans = values.every(v => ['true', 'false', '1', '0', 'yes', 'no'].includes(v.toLowerCase()));
      
      if (allBooleans) {
        types[header] = 'boolean';
      } else if (allIntegers) {
        types[header] = 'integer';
      } else if (allNumbers) {
        types[header] = 'number';
      } else if (allDates) {
        types[header] = 'date';
      } else {
        types[header] = 'string';
      }
    }
    
    return types;
  }

  private formatValue(value: string, format: any): string {
    switch (format.type) {
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'number':
        return parseFloat(value).toFixed(format.decimals || 2);
      case 'currency':
        return new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: format.currency || 'USD' 
        }).format(parseFloat(value));
      default:
        return value;
    }
  }
}

// HTTP Client Tool
export class HTTPClientToolHandler extends ToolHandler {
  name = 'http-client';
  private ajv = new Ajv();

  async execute(params: {
    url: string;
    method?: string;
    headers?: Record<string, string>;
    body?: any;
    timeout?: number;
    followRedirects?: boolean;
    validateCertificate?: boolean;
  }): Promise<any> {
    const {
      url,
      method = 'GET',
      headers = {},
      body,
      timeout = 30000,
      followRedirects = true,
      validateCertificate = true
    } = params;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const fetchOptions: RequestInit = {
        method: method.toUpperCase(),
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
        redirect: followRedirects ? 'follow' : 'manual'
      };

      const startTime = Date.now();
      const response = await fetch(url, fetchOptions);
      const endTime = Date.now();

      clearTimeout(timeoutId);

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      let responseBody: any;
      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        responseBody = await response.json();
      } else if (contentType.includes('text/')) {
        responseBody = await response.text();
      } else {
        responseBody = await response.arrayBuffer();
      }

      return {
        url,
        method: method.toUpperCase(),
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body: responseBody,
        timing: {
          duration: endTime - startTime,
          timestamp: new Date().toISOString()
        },
        ok: response.ok
      };

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      throw new Error(`HTTP request failed: ${error.message}`);
    }
  }

  async validate(params: any): Promise<boolean> {
    const schema = {
      type: 'object',
      properties: {
        url: { type: 'string', format: 'uri' },
        method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'] },
        headers: { type: 'object', additionalProperties: { type: 'string' } },
        body: {},
        timeout: { type: 'number', minimum: 100, maximum: 300000 },
        followRedirects: { type: 'boolean' },
        validateCertificate: { type: 'boolean' }
      },
      required: ['url']
    };

    return this.ajv.validate(schema, params);
  }
}

// Image Processing Tool
export class ImageProcessorToolHandler extends ToolHandler {
  name = 'image-processor';
  private ajv = new Ajv();

  async execute(params: {
    imageData: string; // base64 encoded
    operation: 'resize' | 'crop' | 'rotate' | 'filter' | 'analyze';
    options: any;
  }): Promise<any> {
    const { imageData, operation, options } = params;

    try {
      // This is a simplified example - in practice you'd use a library like Sharp
      const buffer = Buffer.from(imageData, 'base64');
      
      switch (operation) {
        case 'resize':
          return this.resizeImage(buffer, options);
        case 'crop':
          return this.cropImage(buffer, options);
        case 'rotate':
          return this.rotateImage(buffer, options);
        case 'filter':
          return this.filterImage(buffer, options);
        case 'analyze':
          return this.analyzeImage(buffer, options);
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
    } catch (error) {
      throw new Error(`Image processing failed: ${error.message}`);
    }
  }

  async validate(params: any): Promise<boolean> {
    const schema = {
      type: 'object',
      properties: {
        imageData: { type: 'string', minLength: 1 },
        operation: { type: 'string', enum: ['resize', 'crop', 'rotate', 'filter', 'analyze'] },
        options: { type: 'object' }
      },
      required: ['imageData', 'operation', 'options']
    };

    return this.ajv.validate(schema, params);
  }

  private async resizeImage(buffer: Buffer, options: any): Promise<any> {
    const { width, height, maintainAspectRatio = true } = options;
    
    // Mock implementation - use Sharp or similar library in practice
    return {
      operation: 'resize',
      originalSize: { width: 'unknown', height: 'unknown' },
      newSize: { width, height },
      maintainAspectRatio,
      outputFormat: 'jpeg',
      processedImage: buffer.toString('base64') // In practice, return processed image
    };
  }

  private async cropImage(buffer: Buffer, options: any): Promise<any> {
    const { x, y, width, height } = options;
    
    return {
      operation: 'crop',
      cropArea: { x, y, width, height },
      outputFormat: 'jpeg',
      processedImage: buffer.toString('base64')
    };
  }

  private async rotateImage(buffer: Buffer, options: any): Promise<any> {
    const { degrees } = options;
    
    return {
      operation: 'rotate',
      degrees,
      outputFormat: 'jpeg',
      processedImage: buffer.toString('base64')
    };
  }

  private async filterImage(buffer: Buffer, options: any): Promise<any> {
    const { filter, intensity = 1.0 } = options;
    
    return {
      operation: 'filter',
      filter,
      intensity,
      outputFormat: 'jpeg',
      processedImage: buffer.toString('base64')
    };
  }

  private async analyzeImage(buffer: Buffer, options: any): Promise<any> {
    // Mock image analysis
    return {
      operation: 'analyze',
      format: 'JPEG',
      dimensions: { width: 800, height: 600 },
      fileSize: buffer.length,
      colorProfile: 'sRGB',
      dominantColors: ['#ff5733', '#33ff57', '#3357ff'],
      brightness: 128,
      contrast: 1.2,
      sharpness: 0.8,
      metadata: {
        created: new Date().toISOString(),
        camera: 'Unknown',
        settings: {}
      }
    };
  }
}

// Usage: Register all tools
async function setupToolServer() {
  const server = MCPSystemFactory.createServer({
    name: 'tool-server',
    version: '1.0.0',
    port: 8080
  });

  // Register CSV processor
  await server.registerTool({
    name: 'csv-processor',
    description: 'Process CSV data with various operations',
    inputSchema: {
      type: 'object',
      properties: {
        data: { type: 'string' },
        operation: { type: 'string', enum: ['parse', 'filter', 'transform', 'aggregate'] },
        options: { type: 'object' }
      },
      required: ['data', 'operation']
    }
  }, new CSVProcessorToolHandler());

  // Register HTTP client
  await server.registerTool({
    name: 'http-client',
    description: 'Make HTTP requests to external APIs',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', format: 'uri' },
        method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'] },
        headers: { type: 'object' },
        body: {},
        timeout: { type: 'number', minimum: 100, maximum: 300000 }
      },
      required: ['url']
    }
  }, new HTTPClientToolHandler());

  // Register image processor
  await server.registerTool({
    name: 'image-processor',
    description: 'Process and analyze images',
    inputSchema: {
      type: 'object',
      properties: {
        imageData: { type: 'string' },
        operation: { type: 'string', enum: ['resize', 'crop', 'rotate', 'filter', 'analyze'] },
        options: { type: 'object' }
      },
      required: ['imageData', 'operation', 'options']
    }
  }, new ImageProcessorToolHandler());

  await server.start();
  console.log('Tool server running on port 8080 with CSV, HTTP, and Image processing tools');
}
```

This comprehensive examples document provides practical implementations for real-world MCP usage scenarios. Each example includes proper error handling, validation, and follows MCP protocol best practices.