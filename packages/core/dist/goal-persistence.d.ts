import { z } from 'zod';
export declare const UserGoalSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    goal: z.ZodString;
    priority: z.ZodDefault<z.ZodEnum<{
        low: "low";
        medium: "medium";
        high: "high";
        critical: "critical";
    }>>;
    status: z.ZodDefault<z.ZodEnum<{
        active: "active";
        completed: "completed";
        abandoned: "abandoned";
        paused: "paused";
    }>>;
    createdAt: z.ZodDefault<z.ZodString>;
    updatedAt: z.ZodDefault<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export declare const UserPreferenceSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    category: z.ZodString;
    key: z.ZodString;
    value: z.ZodUnknown;
    updatedAt: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
export type UserGoal = z.infer<typeof UserGoalSchema>;
export type UserPreference = z.infer<typeof UserPreferenceSchema>;
export interface GoalStore {
    save(goal: UserGoal): Promise<void>;
    load(userId: string): Promise<UserGoal[]>;
    update(goalId: string, updates: Partial<UserGoal>): Promise<UserGoal>;
}
export interface PreferenceStore {
    save(preference: UserPreference): Promise<void>;
    load(userId: string): Promise<UserPreference[]>;
    loadByCategory(userId: string, category: string): Promise<UserPreference[]>;
}
export declare class GoalPersistenceService {
    private readonly goalStore;
    private readonly preferenceStore;
    constructor(goalStore: GoalStore, preferenceStore: PreferenceStore);
    createGoal(userId: string, goal: string, priority?: UserGoal['priority']): Promise<UserGoal>;
    completeGoal(goalId: string): Promise<UserGoal>;
    pauseGoal(goalId: string): Promise<UserGoal>;
    getActiveGoals(userId: string): Promise<UserGoal[]>;
    setPreference(userId: string, category: string, key: string, value: unknown): Promise<UserPreference>;
    getPreferences(userId: string, category?: string): Promise<UserPreference[]>;
}
export declare class InMemoryGoalStore implements GoalStore {
    private goals;
    save(goal: UserGoal): Promise<void>;
    load(userId: string): Promise<UserGoal[]>;
    update(goalId: string, updates: Partial<UserGoal>): Promise<UserGoal>;
}
export declare class InMemoryPreferenceStore implements PreferenceStore {
    private prefs;
    save(preference: UserPreference): Promise<void>;
    load(userId: string): Promise<UserPreference[]>;
    loadByCategory(userId: string, category: string): Promise<UserPreference[]>;
}
//# sourceMappingURL=goal-persistence.d.ts.map