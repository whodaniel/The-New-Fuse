export declare enum TaskType {
    CodeGeneration = "codeGeneration",
    CodeReview = "codeReview",
    Testing = "testing",
    Documentation = "documentation"
}
export declare enum Priority {
    Low = "low",
    Medium = "medium",
    High = "high",
    Critical = "critical"
}
export interface Task {
    type: TaskType;
    priority: Priority;
    data: any;
}
//# sourceMappingURL=RooCodeCommunication.d.ts.map