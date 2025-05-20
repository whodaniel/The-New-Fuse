import { AnalyticsManager } from '../analytics/AnalyticsManager.js';
export declare class LayoutEngine {
    private analyticsManager;
    constructor(analyticsManager: AnalyticsManager);
    analyzeDashboard(): Promise<void>;
}
