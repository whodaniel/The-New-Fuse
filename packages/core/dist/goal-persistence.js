import { z } from 'zod';
export const UserGoalSchema = z.object({
    id: z.string(),
    userId: z.string(),
    goal: z.string(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
    status: z.enum(['active', 'completed', 'abandoned', 'paused']).default('active'),
    createdAt: z.string().default(() => new Date().toISOString()),
    updatedAt: z.string().default(() => new Date().toISOString()),
    metadata: z.record(z.string(), z.unknown()).optional(),
});
export const UserPreferenceSchema = z.object({
    id: z.string(),
    userId: z.string(),
    category: z.string(),
    key: z.string(),
    value: z.unknown(),
    updatedAt: z.string().default(() => new Date().toISOString()),
});
export class GoalPersistenceService {
    constructor(goalStore, preferenceStore) {
        this.goalStore = goalStore;
        this.preferenceStore = preferenceStore;
    }
    async createGoal(userId, goal, priority = 'medium') {
        const userGoal = UserGoalSchema.parse({
            id: crypto.randomUUID(),
            userId,
            goal,
            priority,
        });
        await this.goalStore.save(userGoal);
        return userGoal;
    }
    async completeGoal(goalId) {
        return this.goalStore.update(goalId, { status: 'completed', updatedAt: new Date().toISOString() });
    }
    async pauseGoal(goalId) {
        return this.goalStore.update(goalId, { status: 'paused', updatedAt: new Date().toISOString() });
    }
    async getActiveGoals(userId) {
        const goals = await this.goalStore.load(userId);
        return goals.filter((g) => g.status === 'active');
    }
    async setPreference(userId, category, key, value) {
        const pref = UserPreferenceSchema.parse({
            id: crypto.randomUUID(),
            userId,
            category,
            key,
            value,
        });
        await this.preferenceStore.save(pref);
        return pref;
    }
    async getPreferences(userId, category) {
        if (category) {
            return this.preferenceStore.loadByCategory(userId, category);
        }
        return this.preferenceStore.load(userId);
    }
}
export class InMemoryGoalStore {
    constructor() {
        this.goals = new Map();
    }
    async save(goal) {
        const existing = this.goals.get(goal.userId) || [];
        existing.push(goal);
        this.goals.set(goal.userId, existing);
    }
    async load(userId) {
        return this.goals.get(userId) || [];
    }
    async update(goalId, updates) {
        for (const [, goals] of this.goals) {
            const idx = goals.findIndex((g) => g.id === goalId);
            if (idx !== -1) {
                goals[idx] = { ...goals[idx], ...updates };
                return goals[idx];
            }
        }
        throw new Error(`Goal ${goalId} not found`);
    }
}
export class InMemoryPreferenceStore {
    constructor() {
        this.prefs = new Map();
    }
    async save(preference) {
        const existing = this.prefs.get(preference.userId) || [];
        const idx = existing.findIndex((p) => p.category === preference.category && p.key === preference.key);
        if (idx !== -1) {
            existing[idx] = preference;
        }
        else {
            existing.push(preference);
        }
        this.prefs.set(preference.userId, existing);
    }
    async load(userId) {
        return this.prefs.get(userId) || [];
    }
    async loadByCategory(userId, category) {
        return (this.prefs.get(userId) || []).filter((p) => p.category === category);
    }
}
//# sourceMappingURL=goal-persistence.js.map