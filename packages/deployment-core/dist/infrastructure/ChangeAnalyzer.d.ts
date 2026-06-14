/**
 * Change Analyzer
 * Analyzes infrastructure changes and creates execution plans
 */
import { InfrastructureState, InfrastructureUpdate, InfrastructureChange, PlanResult } from '../types/infrastructure.js';
export declare class ChangeAnalyzer {
    private riskAnalyzer;
    private costEstimator;
    private timelineCalculator;
    constructor();
    analyzeChanges(currentState: InfrastructureState, update: InfrastructureUpdate): Promise<InfrastructureChange[]>;
    planChanges(changes: InfrastructureChange[]): Promise<PlanResult>;
    private analyzeTemplateChanges;
    private analyzeVariableChanges;
    private analyzeResourceChanges;
    private compareResources;
    private compareObjects;
    private requiresReplacement;
    private findResourcesUsingVariable;
    private determineChangeAction;
    private optimizeChangeOrder;
    private generatePlanId;
}
//# sourceMappingURL=ChangeAnalyzer.d.ts.map