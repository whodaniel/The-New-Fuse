import { PrismaClient, Prisma } from '../../generated/prisma';

export interface IRepository<T, CreateInput, UpdateInput, WhereInput> {
  findById(id: string): Promise<T | null>;
  findMany(filters?: WhereInput): Promise<T[]>;
  create(data: CreateInput): Promise<T>;
  update(id: string, data: UpdateInput): Promise<T>;
  delete(id: string): Promise<T>;
}

export abstract class BaseRepository<T, CreateInput, UpdateInput, WhereInput> implements IRepository<T, CreateInput, UpdateInput, WhereInput> {
  protected prisma: PrismaClient;
  private model: keyof PrismaClient;

  constructor(prisma: PrismaClient, model: keyof PrismaClient) {
    this.prisma = prisma;
    this.model = model;
  }

  abstract findById(id: string): Promise<T | null>;
  abstract findMany(filters?: any): Promise<T[]>;
  abstract create(data: any): Promise<T>;
  abstract update(id: string, data: any): Promise<T>;
  abstract delete(id: string): Promise<T>;

  /**
   * Helper method to handle pagination
   */
  protected getPaginationOptions(page?: number, limit?: number) {
    if (!page || !limit) return {};
    
    const skip = (page - 1) * limit;
    return {
      skip,
      take: limit
    };
  }

  /**
   * Helper method to handle sorting
   */
  protected getSortOptions(sortBy?: string, sortOrder: 'asc' | 'desc' = 'desc') {
    if (!sortBy) return {};
    
    return {
      orderBy: {
        [sortBy]: sortOrder
      }
    };
  }

  /**
   * Helper method to build where clauses
   */
  protected buildWhereClause(filters: Record<string, any> = {}) {
    const where: any = {};
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'string' && key.includes('search')) {
          // Handle search fields
          where.OR = where.OR || [];
          where.OR.push({
            [key.replace('search', '')]: {
              contains: value,
              mode: 'insensitive'
            }
          });
        } else if (Array.isArray(value)) {
          // Handle array filters (e.g., status in ['active', 'inactive'])
          where[key] = {
            in: value
          };
        } else if (typeof value === 'object' && value.from && value.to) {
          // Handle date ranges
          where[key] = {
            gte: value.from,
            lte: value.to
          };
        } else {
          // Handle exact matches
          where[key] = value;
        }
      }
    });
    
    return where;
  }

  /**
   * Helper method to count total records for pagination
   */
  protected async countTotal(where: any): Promise<number> {
    // This should be implemented by subclasses for their specific model
    return (this.prisma[this.model] as any).count({ where });
  }
}
