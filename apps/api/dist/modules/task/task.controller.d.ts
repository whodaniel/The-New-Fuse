import { UnifiedLedgerService } from '../unified-ledger/unified-ledger.service';
import { CreateTaskDto, CreateTaskExecutionLogDto, ListTasksQueryDto, UpdateTaskStatusDto } from './dto/task.dto';
import { TaskService } from './task.service';
type AuthUser = {
    id?: string;
    sub?: string;
    tenantId?: string;
};
export declare class TaskController {
    private readonly taskService;
    private readonly unifiedLedgerService;
    constructor(taskService: TaskService, unifiedLedgerService: UnifiedLedgerService);
    private requireUserId;
    private resolveTenantId;
    private scopeArgs;
    listTasks(user: AuthUser, query: ListTasksQueryDto): Promise<{
        tasks: {
            description: string | null;
            error: string | null;
            type: string;
            status: "COMPLETED" | "FAILED" | "PENDING" | "CANCELLED" | "IN_PROGRESS";
            id: string;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            data: unknown;
            title: string | null;
            metadata: unknown;
            result: unknown;
            priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
            tenantId: string | null;
            workspaceId: string | null;
            startTime: Date | null;
            endTime: Date | null;
            pipelineId: string | null;
            assignedToId: string | null;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    createTask(user: AuthUser, dto: CreateTaskDto): Promise<{
        description: string | null;
        error: string | null;
        type: string;
        status: "COMPLETED" | "FAILED" | "PENDING" | "CANCELLED" | "IN_PROGRESS";
        id: string;
        userId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        data: unknown;
        title: string | null;
        metadata: unknown;
        result: unknown;
        priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
        tenantId: string | null;
        workspaceId: string | null;
        startTime: Date | null;
        endTime: Date | null;
        pipelineId: string | null;
        assignedToId: string | null;
    }>;
    getTask(user: AuthUser, taskId: string): Promise<{
        description: string | null;
        error: string | null;
        type: string;
        status: "COMPLETED" | "FAILED" | "PENDING" | "CANCELLED" | "IN_PROGRESS";
        id: string;
        userId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        data: unknown;
        title: string | null;
        metadata: unknown;
        result: unknown;
        priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
        tenantId: string | null;
        workspaceId: string | null;
        startTime: Date | null;
        endTime: Date | null;
        pipelineId: string | null;
        assignedToId: string | null;
    }>;
    updateTaskStatus(user: AuthUser, taskId: string, dto: UpdateTaskStatusDto): Promise<{
        description: string | null;
        error: string | null;
        type: string;
        status: "COMPLETED" | "FAILED" | "PENDING" | "CANCELLED" | "IN_PROGRESS";
        id: string;
        userId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        data: unknown;
        title: string | null;
        metadata: unknown;
        result: unknown;
        priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
        tenantId: string | null;
        workspaceId: string | null;
        startTime: Date | null;
        endTime: Date | null;
        pipelineId: string | null;
        assignedToId: string | null;
    }>;
    getExecutionLogs(user: AuthUser, taskId: string): Promise<{
        taskId: string;
        logs: import("./task.types").TaskExecutionLogEntry[];
        count: number;
    }>;
    createExecutionLog(user: AuthUser, taskId: string, dto: CreateTaskExecutionLogDto): Promise<{
        taskId: string;
        logs: import("./task.types").TaskExecutionLogEntry[];
        count: number;
    }>;
}
export {};
//# sourceMappingURL=task.controller.d.ts.map