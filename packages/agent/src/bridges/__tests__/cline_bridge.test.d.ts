import { Task } from '../types/task';
import { ImplementationPhase } from '../types/phase';
export interface PriorityFactors {
    basePriority: number;
    dependencyWeight: number;
    failureWeight: number;
    resourceWeight: number;
    retryPenalty: number;
}
export declare class PriorityManager {
    private static readonly DEFAULT_FACTORS;
    private factors;
    constructor(factors?: Partial<PriorityFactors>);
    calculateTaskPriority(task: Task, dependencies: Task[], phase: ImplementationPhase, resourceAvailability: number): number;
    private calculatePhaseFailureRate;
}
//# sourceMappingURL=cline_bridge.test.d.ts.map