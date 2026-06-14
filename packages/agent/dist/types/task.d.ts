export interface Task {
    id: string;
    type: string;
    data: any;
    status: 'pending' | 'running' | 'completed' | 'failed';
    basePriority?: number;
    retryCount?: number;
}
//# sourceMappingURL=task.d.ts.map