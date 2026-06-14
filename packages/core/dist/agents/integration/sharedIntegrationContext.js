import { z } from 'zod';
export const SharedIntegrationContextSchema = z.object({
    contextId: z.string(),
    integrationId: z.string(),
    teamId: z.string(),
    sharedBy: z.string(),
    contextType: z.enum(['meta_ads', 'analytics', 'crm', 'communication', 'custom']),
    credentials: z.record(z.string(), z.unknown()).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    accessControl: z.object({
        read: z.array(z.string()).default([]),
        write: z.array(z.string()).default([]),
        admin: z.array(z.string()).default([]),
    }),
    createdAt: z.number(),
    updatedAt: z.number(),
});
export class SharedIntegrationContextService {
    constructor() {
        this.contexts = new Map();
    }
    createSharedContext(params) {
        const now = Date.now();
        const context = {
            ...params,
            createdAt: now,
            updatedAt: now,
        };
        this.contexts.set(context.contextId, context);
        return context;
    }
    grantAccess(contextId, userId, level) {
        const context = this.contexts.get(contextId);
        if (!context)
            return false;
        for (const lvl of ['read', 'write', 'admin']) {
            context.accessControl[lvl] = context.accessControl[lvl].filter(id => id !== userId);
        }
        context.accessControl[level].push(userId);
        context.updatedAt = Date.now();
        return true;
    }
    revokeAccess(contextId, userId) {
        const context = this.contexts.get(contextId);
        if (!context)
            return false;
        for (const lvl of ['read', 'write', 'admin']) {
            context.accessControl[lvl] = context.accessControl[lvl].filter(id => id !== userId);
        }
        context.updatedAt = Date.now();
        return true;
    }
    canAccess(contextId, userId, requiredLevel = 'read') {
        const context = this.contexts.get(contextId);
        if (!context)
            return false;
        const levelHierarchy = { read: 0, write: 1, admin: 2 };
        const required = levelHierarchy[requiredLevel];
        for (const lvl of ['read', 'write', 'admin']) {
            if (context.accessControl[lvl].includes(userId) && levelHierarchy[lvl] >= required) {
                return true;
            }
        }
        return false;
    }
    getTeamContexts(teamId) {
        return Array.from(this.contexts.values()).filter(c => c.teamId === teamId);
    }
}
//# sourceMappingURL=sharedIntegrationContext.js.map