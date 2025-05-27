export enum TaskType {
    CodeGeneration = 'codeGeneration',
    CodeReview = 'codeReview',
    Testing = 'testing',
    Documentation = 'documentation'
}

export enum Priority {
    Low = 'low',
    Medium = 'medium',
    High = 'high',
    Critical = 'critical'
}

export interface Task {
    type: TaskType;
    priority: Priority;
    data: any;
}