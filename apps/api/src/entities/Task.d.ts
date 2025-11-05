import { Pipeline } from './Pipeline';
import { TaskExecution } from './TaskExecution';
export declare class Task {
    id: string;
    type: string;
    status: string;
    priority: number;
    data: any;
    result: any;
    error: string;
    startTime: Date;
    endTime: Date;
    pipeline: Pipeline;
    pipelineId: string;
    taskExecutions: TaskExecution[];
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
}
//# sourceMappingURL=Task.d.ts.map