import { Task, TaskStatus, TaskPriority } from '../types';
import { PrismaService } from '../prisma.service';
export declare class TaskRepository {
    private prisma;
    constructor(prisma: PrismaService);
    private mapDatabaseTaskToTask;
    private getTaskSelect;
    findById(id: string): Promise<Task | null>;
    findMany(filters?: any): Promise<Task[]>;
    create(data: any): Promise<Task>;
    update(id: string, data: any): Promise<Task>;
    delete(id: string): Promise<Task>;
    findByCreatedBy(userId: string): Promise<Task[]>;
    findByAssignedTo(agentId: string): Promise<Task[]>;
    findByStatus(status: TaskStatus): Promise<Task[]>;
    findByPriority(priority: TaskPriority): Promise<Task[]>;
    updateStatus(id: string, status: TaskStatus): Promise<Task>;
    assignToAgent(id: string, agentId: string): Promise<Task>;
    getTaskStats(createdBy?: string): Promise<any>;
    getRecentTasks(createdBy: string, limit?: number): Promise<Task[]>;
    searchTasks(createdBy: string, query: string): Promise<Task[]>;
}
//# sourceMappingURL=task.repository.d.ts.map