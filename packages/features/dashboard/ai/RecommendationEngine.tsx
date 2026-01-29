import { AnalyticsManager } from '../analytics/AnalyticsManager';
import { DashboardState } from '../collaboration/types';

interface UserPreference {
  userId: string;
  itemId: string;
  rating: number;
  timestamp: Date;
}

interface SimilarityScore {
  itemId: string;
  score: number;
}

interface Recommendation {
  id: string;
  type: 'widget' | 'layout' | 'template' | 'feature';
  title: string;
  description: string;
  confidence: number;
  reasoning: string;
  preview?: {
    type: string;
    data: unknown;
  };
  metadata: Record<string, unknown>;
}

export class RecommendationEngine {
  private analyticsManager: AnalyticsManager;
  private userPreferences: Map<string, UserPreference[]>;
  private itemSimilarities: Map<string, SimilarityScore[]>;
  private lastUpdate: Date;

  constructor(analyticsManager: AnalyticsManager) {
    this.analyticsManager = analyticsManager;
    this.userPreferences = new Map();
    this.itemSimilarities = new Map();
    this.lastUpdate = new Date();
  }

  public async generateRecommendations(
    userId: string,
    dashboardState: DashboardState
  ): Promise<Recommendation[]> {
    await this.updateSimilarityMatrix();

    const userPrefs = this.userPreferences.get(userId) || [];

    const recommendations = [
      ...(await this.recommendWidgets(userId, userPrefs, dashboardState)),
      ...(await this.recommendLayouts(userId, userPrefs, dashboardState)),
      ...(await this.recommendTemplates(userId, userPrefs, dashboardState)),
      ...(await this.recommendFeatures(userId, userPrefs, dashboardState)),
    ];

    return this.rankRecommendations(recommendations);
  }

  public async recordPreference(preference: UserPreference): Promise<void> {
    const userPrefs = this.userPreferences.get(preference.userId) || [];
    userPrefs.push(preference);
    this.userPreferences.set(preference.userId, userPrefs);
    this.lastUpdate = new Date();
  }

  private async updateSimilarityMatrix(): Promise<void> {
    const now = new Date();
    if (now.getTime() - this.lastUpdate.getTime() < 3600000 && this.itemSimilarities.size > 0) {
      return;
    }

    const allPreferences = Array.from(this.userPreferences.values()).flat();
    const uniqueItems = new Set(allPreferences.map((p) => p.itemId));

    for (const itemId of uniqueItems) {
      const similarities: SimilarityScore[] = [];
      for (const otherId of uniqueItems) {
        if (itemId !== otherId) {
          const similarity = this.calculateItemSimilarity(itemId, otherId, allPreferences);
          similarities.push({ itemId: otherId, score: similarity });
        }
      }
      similarities.sort((a, b) => b.score - a.score);
      this.itemSimilarities.set(itemId, similarities.slice(0, 10));
    }
  }

  private calculateItemSimilarity(
    item1: string,
    item2: string,
    preferences: UserPreference[]
  ): number {
    const users1 = preferences.filter((p) => p.itemId === item1);
    const users2 = preferences.filter((p) => p.itemId === item2);

    if (users1.length === 0 || users2.length === 0) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    const commonUsers = new Set(users1.map((u) => u.userId));
    users2.forEach((u) => {
      if (commonUsers.has(u.userId)) {
        const u1 = users1.find((up) => up.userId === u.userId)!;
        dotProduct += u1.rating * u.rating;
      }
    });

    users1.forEach((u) => (norm1 += u.rating * u.rating));
    users2.forEach((u) => (norm2 += u.rating * u.rating));

    const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  private async recommendWidgets(
    userId: string,
    userPrefs: UserPreference[],
    dashboardState: DashboardState
  ): Promise<Recommendation[]> {
    return [];
  }

  private async recommendLayouts(
    userId: string,
    userPrefs: UserPreference[],
    dashboardState: DashboardState
  ): Promise<Recommendation[]> {
    return [];
  }

  private async recommendTemplates(
    userId: string,
    userPrefs: UserPreference[],
    dashboardState: DashboardState
  ): Promise<Recommendation[]> {
    return [];
  }

  private async recommendFeatures(
    userId: string,
    userPrefs: UserPreference[],
    dashboardState: DashboardState
  ): Promise<Recommendation[]> {
    return [];
  }

  private rankRecommendations(recommendations: Recommendation[]): Recommendation[] {
    return [...recommendations].sort((a, b) => {
      const confidenceDiff = b.confidence - a.confidence;
      if (Math.abs(confidenceDiff) > 0.1) return confidenceDiff;
      const typePriority: Record<string, number> = {
        widget: 4,
        layout: 3,
        template: 2,
        feature: 1,
      };
      return typePriority[b.type] - typePriority[a.type];
    });
  }
}
