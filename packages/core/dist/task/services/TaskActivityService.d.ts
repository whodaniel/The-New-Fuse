export interface TaskActivity {
    id: string;
    taskId: string;
    userId: string;
    action: string;
    details?: string;
    timestamp: Date;
}
export declare class TaskActivityService {
    private activities;
    logActivity(taskId: string, userId: string, action: string, details?: string): TaskActivity;
    getTaskActivities(taskId: string): TaskActivity[];
    getAllActivities(): TaskActivity[];
    getRecentActivities(limit?: number): TaskActivity[];
}
//# sourceMappingURL=TaskActivityService.d.ts.map