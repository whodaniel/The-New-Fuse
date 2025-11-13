/**
 * Change Analyzer
 * Analyzes infrastructure changes and creates execution plans
 */
import { InfrastructureState, InfrastructureUpdate, InfrastructureChange } from '../types/infrastructure';
export declare class ChangeAnalyzer {
    private riskAnalyzer;
    private costEstimator;
    private timelineCalculator;
    constructor();
    analyzeChanges(currentState: InfrastructureState, update: InfrastructureUpdate): Promise<InfrastructureChange[]>;
    private analyzeTemplateChanges;
    private analyzeVariableChanges;
}
//# sourceMappingURL=ChangeAnalyzer.d.ts.map