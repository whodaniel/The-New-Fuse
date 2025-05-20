import { AnalyticsManager } from '../analytics/AnalyticsManager.js';
export declare class RecommendationEngine {
    private analyticsManager;
    private userPreferences;
    private itemSimilarities;
    private lastUpdate;
    constructor(analyticsManager: AnalyticsManager);
    generateRecommendations(): Promise<void>;
}
