"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecommendationEngine = void 0;
class RecommendationEngine {
    constructor(analyticsManager) {
        this.analyticsManager = analyticsManager;
        this.userPreferences = new Map();
        this.itemSimilarities = new Map();
        this.lastUpdate = new Date();
    }
}
exports.RecommendationEngine = RecommendationEngine;
() => ;
(userId, dashboardState) => {
    // Update similarity matrix if needed
    await this.updateSimilarityMatrix();
    const userPrefs = this.userPreferences.get(userId) || [];
    // Generate different types of recommendations
    const recommendations = [
        ...await this.recommendWidgets(userId, userPrefs, dashboardState),
        ...await this.recommendLayouts(userId, userPrefs, dashboardState),
        ...await this.recommendTemplates(userId, userPrefs, dashboardState),
        ...await this.recommendFeatures(userId, userPrefs, dashboardState),
    ];
    return this.rankRecommendations(recommendations);
};
async;
recordPreference();
Promise();
Promise(preference, UserPreference);
Promise < void  > {
    const: userPrefs = this.userPreferences.get(preference.userId) || [],
    userPrefs, : .push(preference),
    this: .userPreferences.set(preference.userId, userPrefs),
    // Mark similarity matrix for update
    this: .lastUpdate = new Date()
};
async;
updateSimilarityMatrix();
Promise();
Promise();
Promise < void  > {
    const: now = new Date(),
    if(now) { }, : .getTime() - this.lastUpdate.getTime() < 3600000
};
{
    return; // Update at most once per hour
}
// Build item-item similarity matrix
const allPreferences = Array.from(this.userPreferences.values()).flat();
const uniqueItems = new Set(allPreferences.map(p => p.itemId));
for (const itemId of uniqueItems) {
    const similarities = [];
    for (const otherId of uniqueItems) {
        if (itemId !== otherId) {
            const similarity = this.calculateItemSimilarity(itemId, otherId, allPreferences);
            similarities.push({
                itemId: otherId,
                score: similarity,
            });
        }
    }
    // Sort by similarity score
    similarities.sort((a, b) => b.score - a.score);
    // Keep top K similar items
    this.itemSimilarities.set(itemId, similarities.slice(0, 10));
}
calculateItemSimilarity(item1, string, item2, string, preferences, UserPreference[]);
number;
{
    const users1 = preferences
        .filter(p => p.itemId === item1)
        .map(p => ({ userId: p.userId, rating: p.rating }));
    const users2 = preferences
        .filter(p => p.itemId === item2)
        .map(p => ({ userId: p.userId, rating: p.rating }));
    // Calculate cosine similarity
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    for (const u1 of users1) {
        const u2 = users2.find(u => u.userId === u1.userId);
        if (u2) {
            dotProduct += u1.rating * u2.rating;
        }
        norm1 += u1.rating * u1.rating;
    }
    for (const u2 of users2) {
        norm2 += u2.rating * u2.rating;
    }
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}
async;
recommendWidgets();
Promise();
Promise(userId, string, userPrefs, UserPreference[], dashboardState, types_1.DashboardState);
Promise < Recommendation[] > {
    const: recommendations, Recommendation, []:  = [],
    // Get user's widget preferences
    const: widgetPrefs = userPrefs.filter(p => p.itemId.startsWith('widget:')),
    // Find similar widgets
    for(, pref, of, widgetPrefs) {
        const similarities = this.itemSimilarities.get(pref.itemId) || [];
        for (const similar of similarities) {
            if (!dashboardState.widgets?.includes(similar.itemId)) {
                recommendations.push({
                    id: crypto.randomUUID(),
                    type: 'widget',
                    title: 'Add similar widget',
                    description: `Based on your usage of ${pref.itemId}`,
                    confidence: similar.score,
                    reasoning: 'Similar widgets are often used together',
                    preview: {
                        type: 'widget',
                        data: { widgetId: similar.itemId },
                    },
                    metadata: {
                        sourceWidget: pref.itemId,
                        similarityScore: similar.score,
                    },
                });
            }
        }
    },
    return: recommendations
};
async;
recommendLayouts();
Promise();
Promise(userId, string, userPrefs, UserPreference[], dashboardState, types_1.DashboardState);
Promise < Recommendation[] > {
    const: recommendations, Recommendation, []:  = [],
    // Find similar users
    const: similarUsers = await this.findSimilarUsers(userId),
    // Get popular layouts among similar users
    const: popularLayouts = await this.getPopularLayouts(similarUsers),
    for(, layout, of, popularLayouts) {
        recommendations.push({
            id: crypto.randomUUID(),
            type: 'layout',
            title: 'Try this layout',
            description: 'Popular among users with similar preferences',
            confidence: layout.popularity,
            reasoning: 'This layout arrangement has proven effective',
            preview: {
                type: 'layout',
                data: layout.configuration,
            },
            metadata: {
                popularity: layout.popularity,
                userCount: layout.userCount,
            },
        });
    },
    return: recommendations
};
async;
recommendTemplates();
Promise();
Promise(userId, string, userPrefs, UserPreference[], dashboardState, types_1.DashboardState);
Promise < Recommendation[] > {
    const: recommendations, Recommendation, []:  = [],
    // Find templates similar to current dashboard
    const: similarTemplates = await this.findSimilarTemplates(dashboardState),
    for(, template, of, similarTemplates) {
        recommendations.push({
            id: crypto.randomUUID(),
            type: 'template',
            title: 'Similar template',
            description: 'This template matches your dashboard style',
            confidence: template.similarity,
            reasoning: 'Based on dashboard structure and content',
            preview: {
                type: 'template',
                data: template.preview,
            },
            metadata: {
                templateId: template.id,
                similarity: template.similarity,
            },
        });
    },
    return: recommendations
};
async;
recommendFeatures();
Promise();
Promise(userId, string, userPrefs, UserPreference[], dashboardState, types_1.DashboardState);
Promise < Recommendation[] > {
    const: recommendations, Recommendation, []:  = [],
    // Find valuable features not currently used
    const: unusedFeatures = await this.findValuableUnusedFeatures(userId, dashboardState),
    for(, feature, of, unusedFeatures) {
        recommendations.push({
            id: crypto.randomUUID(),
            type: 'feature',
            title: `Try ${feature.name}`,
            description: feature.description,
            confidence: feature.relevance,
            reasoning: 'Popular among similar users',
            preview: {
                type: 'feature',
                data: feature.preview,
            },
            metadata: {
                featureId: feature.id,
                relevance: feature.relevance,
            },
        });
    },
    return: recommendations
};
rankRecommendations(recommendations, Recommendation[]);
Recommendation[];
{
    return recommendations.sort((a, b) => {
        // Prioritize high-confidence recommendations
        const confidenceDiff = b.confidence - a.confidence;
        if (Math.abs(confidenceDiff) > 0.1) {
            return confidenceDiff;
        }
        // Then by type priority
        const typePriority = {
            widget: 4,
            layout: 3,
            template: 2,
            feature: 1,
        };
        return typePriority[b.type] - typePriority[a.type];
    });
}
async;
findSimilarUsers();
Promise();
Promise(userId, string);
Promise < Array < { id: string, similarity: number } >> {
    // Implement user similarity calculation
    return: []
};
async;
getPopularLayouts();
Promise();
Promise(users, (Array));
Promise < Array < { configuration: unknown, popularity: number, userCount: number } >> {
    // Implement popular layout analysis
    return: []
};
async;
findSimilarTemplates();
Promise();
Promise(dashboardState, types_1.DashboardState);
Promise < Array < { id: string, similarity: number, preview: unknown } >> {
    // Implement template similarity analysis
    return: []
};
async;
findValuableUnusedFeatures();
Promise();
Promise(userId, string, dashboardState, types_1.DashboardState);
Promise < Array < {
    id: string,
    name: string,
    description: string,
    relevance: number,
    preview: unknown
} >> {
    // Implement unused feature discovery
    return: []
};
//# sourceMappingURL=RecommendationEngine.js.map