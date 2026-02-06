import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger.js';

type OrderDirection = 'asc' | 'desc';

type WhereClause = Record<string, any> | undefined;

type FindManyOptions = {
  where?: WhereClause;
  orderBy?: Record<string, OrderDirection>;
  take?: number;
};

type UpdateOptions<T> = {
  where: Record<string, any>;
  data: Partial<T>;
};

type CreateOptions<T> = {
  data: T;
};

const now = () => new Date();

function matchesWhere<T extends Record<string, any>>(item: T, where?: WhereClause): boolean {
  if (!where) return true;
  return Object.entries(where).every(([key, value]) => item[key] === value);
}

function applyOrder<T extends Record<string, any>>(items: T[], orderBy?: Record<string, OrderDirection>): T[] {
  if (!orderBy) return items;
  const [[key, direction]] = Object.entries(orderBy);
  return items.slice().sort((a, b) => {
    if (a[key] === b[key]) return 0;
    if (direction === 'asc') return a[key] > b[key] ? 1 : -1;
    return a[key] < b[key] ? 1 : -1;
  });
}

function createModel<T extends Record<string, any>>(name: string) {
  const items = new Map<string, T>();

  const getId = (data: T) => (data.id as string) ?? uuidv4();

  return {
    data: items,
    async create(opts: CreateOptions<T>): Promise<T> {
      const id = getId(opts.data);
      const record = {
        ...opts.data,
        id,
        createdAt: (opts.data as any).createdAt ?? now(),
        updatedAt: (opts.data as any).updatedAt ?? now(),
      } as T;
      items.set(id, record);
      return record;
    },
    async findUnique(opts: { where: Record<string, any> }): Promise<T | null> {
      for (const item of items.values()) {
        if (matchesWhere(item, opts.where)) return item;
      }
      return null;
    },
    async findFirst(opts: { where: Record<string, any> }): Promise<T | null> {
      return this.findUnique(opts);
    },
    async findMany(opts: FindManyOptions = {}): Promise<T[]> {
      let results = Array.from(items.values()).filter((item) => matchesWhere(item, opts.where));
      results = applyOrder(results, opts.orderBy);
      if (opts.take !== undefined) return results.slice(0, opts.take);
      return results;
    },
    async update(opts: UpdateOptions<T>): Promise<T> {
      const existing = await this.findUnique({ where: opts.where });
      if (!existing) throw new Error(`${name} not found`);
      const updated = { ...existing, ...opts.data, updatedAt: now() } as T;
      items.set((updated as any).id, updated);
      return updated;
    },
    async delete(opts: { where: Record<string, any> }): Promise<T> {
      const existing = await this.findUnique({ where: opts.where });
      if (!existing) throw new Error(`${name} not found`);
      items.delete((existing as any).id);
      return existing;
    },
    async deleteMany(opts: { where?: WhereClause }): Promise<{ count: number }> {
      const toDelete = Array.from(items.values()).filter((item) => matchesWhere(item, opts.where));
      toDelete.forEach((item) => items.delete((item as any).id));
      return { count: toDelete.length };
    },
    async count(opts: { where?: WhereClause } = {}): Promise<number> {
      return Array.from(items.values()).filter((item) => matchesWhere(item, opts.where)).length;
    },
  };
}

export const db = {
  agent: createModel<any>('agent'),
  agentState: createModel<any>('agentState'),
  tool: createModel<any>('tool'),
  toolCall: createModel<any>('toolCall'),
  toolExecution: createModel<any>('toolExecution'),
  conversation: createModel<any>('conversation'),
  conversationAgent: createModel<any>('conversationAgent'),
  message: createModel<any>('message'),
  workflow: createModel<any>('workflow'),
  workflowExecution: createModel<any>('workflowExecution'),
  workflowStepExecution: createModel<any>('workflowStepExecution'),
};

// Handle graceful shutdown
process.on('beforeExit', async () => {
  logger.info('MCP db client shutdown complete');
});

// Helper function to safely serialize/deserialize JSON
export const safeJsonParse = <T>(json: string, fallback: T): T => {
  try {
    return JSON.parse(json) as T;
  } catch (e: any) {
    logger.error(`Error parsing JSON: ${e.message}`);
    return fallback;
  }
};

// Helper to convert Zod schemas to/from JSON
export const zodSchemaToJson = (schema: any): string => {
  return JSON.stringify(schema);
};

export const jsonToZodSchema = (json: string): any => {
  return safeJsonParse(json, {});
};

export default db;
