interface GoalTask {
    id: string;
    description: string;
    completed: boolean;
    createdAt: string;
    completedAt?: string;
}
interface Goal {
    id: string;
    slug: string;
    title: string;
    description: string;
    priority: 'critical' | 'high' | 'medium' | 'low' | 'trivial';
    status: 'active' | 'paused' | 'completed' | 'abandoned';
    category: string;
    progress: number;
    tasks: GoalTask[];
    tags: string[];
    hermesFeature?: string;
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
    dueDate?: string;
    notes?: string;
}
export interface GoalCreateInput {
    title: string;
    description?: string;
    priority?: Goal['priority'];
    category?: string;
    dueDate?: string;
    hermesFeature?: string;
    tags?: string[];
}
export declare class GoalsService {
    private goalsDir;
    private configPath;
    private config;
    constructor();
    private loadConfig;
    private saveConfig;
    private getGoalsFile;
    private loadGoals;
    private saveGoals;
    private generateSlug;
    private generateId;
    initializeDefaults(): Promise<Goal[]>;
    private createGoalFromInput;
    list(): Promise<Goal[]>;
    get(idOrSlug: string): Promise<Goal | undefined>;
    create(input: GoalCreateInput): Promise<Goal>;
    update(id: string, updates: Partial<Omit<Goal, 'id' | 'createdAt' | 'tasks'>>): Promise<Goal | null>;
    delete(id: string): Promise<boolean>;
    setProgress(id: string, progress: number): Promise<Goal | null>;
    setStatus(id: string, status: Goal['status']): Promise<Goal | null>;
    addTask(goalId: string, description: string): Promise<GoalTask | null>;
    completeTask(goalId: string, taskId: string): Promise<Goal | null>;
    private recalculateProgress;
    getStats(): Promise<{
        total: number;
        active: number;
        completed: number;
        byPriority: Record<string, number>;
    }>;
    search(query: string): Promise<Goal[]>;
    getByHermesFeature(feature: string): Promise<Goal | undefined>;
}
export {};
//# sourceMappingURL=GoalsService.d.ts.map