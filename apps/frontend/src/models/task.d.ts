export declare class TaskUtils {
    static isOverdue(task: any): boolean;
    static calculateProgress(task: any): number;
    static getPriorityLevel(task: any): number;
    static calculateTimeSpent(timeTrackings: any): any;
    static sortTasks(tasks: any, sortBy: any, order: any): any[];
    static filterTasks(tasks: any, filters: any): any;
}
