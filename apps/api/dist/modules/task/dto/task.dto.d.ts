export declare class ListTasksQueryDto {
    status?: string;
    workspaceId?: string;
    page: number;
    limit: number;
}
export declare class CreateTaskDto {
    type: string;
    title?: string;
    description?: string;
    status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    data?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    pipelineId?: string;
    assignedToId?: string;
    workspaceId?: string;
}
export declare class UpdateTaskStatusDto {
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
}
export declare class CreateTaskExecutionLogDto {
    level: 'info' | 'warn' | 'error';
    message: string;
    actor: string;
    source: string;
    stage?: string;
    metadata?: Record<string, unknown>;
}
//# sourceMappingURL=task.dto.d.ts.map