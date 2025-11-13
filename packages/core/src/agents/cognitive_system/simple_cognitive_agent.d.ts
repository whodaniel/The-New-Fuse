import { LoggingService } from '../../services/LoggingService';
export interface CognitiveTask {
    id: string;
    type: 'problem_solving' | 'decision_making' | 'planning' | 'analysis';
    description: string;
    context: Record<string, any>;
    priority: 'low' | 'medium' | 'high' | 'critical';
}
export interface CognitiveResult {
    task_id: string;
    solution: string;
    confidence: number;
    execution_time: number;
}
export declare class SimpleCognitiveAgent {
    private readonly logger;
    private active_tasks;
    private completed_tasks;
    constructor(logger: LoggingService);
    /**
     * Process a cognitive task with basic reasoning
     */
    processCognitiveTask(task: CognitiveTask): Promise<CognitiveResult>;
    default: solution;
    response: any;
}
export default SimpleCognitiveAgent;
//# sourceMappingURL=simple_cognitive_agent.d.ts.map