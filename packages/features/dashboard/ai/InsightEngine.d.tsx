import { AnalyticsManager } from '../analytics/AnalyticsManager.js';
export declare class InsightEngine {
    private analyticsManager;
    private apiEndpoint;
    constructor(analyticsManager: AnalyticsManager);
    generateInsights(): Promise<void>;
}
