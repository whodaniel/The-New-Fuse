export interface Task {
    id: string;
    title: string;
    status: string;
    assignedTo: string;
    progress: number;
    createdAt: string;
}
export interface TaskMetrics {
    id: string;
    taskId: string;
    completionTime: number;
    accuracy: number;
    resourceUsage: {
        cpu: number;
        memory: number;
    };
}
export interface TaskAssignment {
    id: string;
    taskId: string;
    agentId: string;
    assignedAt: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
}
export interface TaskDependency {
    id: string;
    sourceTaskId: string;
    targetTaskId: string;
    type: 'blocks' | 'requires' | 'enhances';
}
export interface TaskPriority {
    id: string;
    taskId: string;
    level: number;
    lastUpdated: string;
}
