import { z } from 'zod';
export const IntegrationPermissionSchema = z.object({
    integrationId: z.string(),
    name: z.string(),
    type: z.enum(['company_wide', 'team', 'individual']),
    scope: z.array(z.string()),
    connectedBy: z.string(),
    companyId: z.string(),
    teamId: z.string().optional(),
    createdAt: z.number(),
});
export class IntegrationPermissionService {
    constructor() {
        this.integrations = new Map();
    }
    connectIntegration(params) {
        const integration = {
            ...params,
            createdAt: Date.now(),
        };
        this.integrations.set(integration.integrationId, integration);
        return integration;
    }
    canAccess(userId, companyId, teamId, integrationId) {
        const integration = this.integrations.get(integrationId);
        if (!integration)
            return false;
        if (integration.companyId !== companyId)
            return false;
        if (integration.type === 'company_wide')
            return true;
        if (integration.type === 'team') {
            return integration.teamId === teamId;
        }
        return integration.connectedBy === userId;
    }
    getCompanyIntegrations(companyId) {
        return Array.from(this.integrations.values())
            .filter(i => i.companyId === companyId);
    }
    getTeamIntegrations(teamId) {
        return Array.from(this.integrations.values())
            .filter(i => i.teamId === teamId);
    }
    disconnectIntegration(integrationId) {
        return this.integrations.delete(integrationId);
    }
}
//# sourceMappingURL=integrationPermissions.js.map