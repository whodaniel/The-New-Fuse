// filepath: src/repositories/base.repository.ts
export interface FindOptions {
  where?: Record<string, any>;
  order?: Record<string, "ASC" | "DESC">;
  limit?: number;
  offset?: number;
  relations?: string[];
}

export interface IRepository<T> {
  findAll(options?: FindOptions): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  findOne(options?: FindOptions): Promise<T | null>;
  create(entity: Partial<T>): Promise<T>;
  update(id: string, entity: Partial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
}

export interface ISoftDeleteRepository<T> extends IRepository<T> {
  softDelete(id: string): Promise<boolean>;
  restore(id: string): Promise<boolean>;
  findDeleted(options?: FindOptions): Promise<T[]>;
}
