import { Task, TaskStatus, TaskPriority } from '../../generated/prisma';
import { PrismaService } from '../prisma.service';
import { Prisma } from '../../generated/prisma';
export declare class TaskRepository {
    private prisma;
    constructor(prisma: PrismaService);
    private mapDatabaseTaskToTask;
    private getTaskSelect;
    findById(id: string): Promise<Task | null>;
    findMany(filters?: Prisma.TaskWhereInput): Promise<Task[]>;
    create(data: Prisma.TaskCreateInput): Promise<Task>;
    update(id: string, data: Prisma.TaskUpdateInput): Promise<Task>;
    delete(id: string): Promise<Task>;
    findByUserId(userId: string): Promise<Task[]>;
    findByAgentId(agentId: string): Promise<Task[]>;
    findByStatus(status: TaskStatus): Promise<Task[]>;
    findByPriority(priority: TaskPriority): Promise<Task[]>;
    updateStatus(id: string, status: TaskStatus): Promise<Task>;
    assignToAgent(id: string, agentId: string): Promise<Task>;
    getTaskStats(userId?: string): Promise<{
        total: number;
        completed: number;
        overdue: number;
        completionRate: number;
        byStatus: Record<string, number>;
        byPriority: Record<string, number>;
    }>;
    getRecentTasks(userId: string, limit?: number): Promise<Task[]>;
    searchTasks(userId: string, query: string): Promise<Task[]>;
}
//# sourceMappingURL=task.repository.d.ts.map