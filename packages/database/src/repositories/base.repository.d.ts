import { PrismaClient } from '../types';
export interface IRepository<T> {
    findById(id: string): Promise<T | null>;
    findMany(filters?: any): Promise<T[]>;
    create(data: any): Promise<T>;
    update(id: string, data: any): Promise<T>;
    delete(id: string): Promise<T>;
}
export declare abstract class BaseRepository<T> implements IRepository<T> {
    protected prisma: PrismaClient;
    constructor(prisma: PrismaClient);
    abstract findById(id: string): Promise<T | null>;
    abstract findMany(filters?: any): Promise<T[]>;
    abstract create(data: any): Promise<T>;
    abstract update(id: string, data: any): Promise<T>;
    abstract delete(id: string): Promise<T>;
    /**
     * Helper method to handle pagination
     */
    protected getPaginationOptions(page?: number, limit?: number): {
        skip?: undefined;
        take?: undefined;
    } | {
        skip: number;
        take: number;
    };
    /**
     * Helper method to handle sorting
     */
    protected getSortOptions(sortBy?: string, sortOrder?: 'asc' | 'desc'): {
        orderBy?: undefined;
    } | {
        orderBy: {
            [x: string]: "asc" | "desc";
        };
    };
    /**
     * Helper method to build where clauses
     */
    protected buildWhereClause(filters?: Record<string, any>): any;
    /**
     * Helper method to count total records for pagination
     */
    protected countTotal(_where: any): Promise<number>;
}
//# sourceMappingURL=base.repository.d.ts.map