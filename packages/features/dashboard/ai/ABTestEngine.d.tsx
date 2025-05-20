import { AnalyticsManager } from '../analytics/AnalyticsManager.js';
export declare class ABTestEngine {
    private analyticsManager;
    private activeExperiments;
    private results;
    private userAssignments;
    constructor(analyticsManager: AnalyticsManager);
    createExperiment(): Promise<void>;
}
