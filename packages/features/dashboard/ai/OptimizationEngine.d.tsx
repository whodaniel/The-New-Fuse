import { AnalyticsManager } from '../analytics/AnalyticsManager.js';
export declare class OptimizationEngine {
    private analyticsManager;
    constructor(analyticsManager: AnalyticsManager);
    analyzeDashboard(): Promise<void>;
}
