import { z } from 'zod';
export declare const IntegrationPermissionSchema: z.ZodObject<{
    integrationId: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<{
        company_wide: "company_wide";
        team: "team";
        individual: "individual";
    }>;
    scope: z.ZodArray<z.ZodString>;
    connectedBy: z.ZodString;
    companyId: z.ZodString;
    teamId: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodNumber;
}, z.core.$strip>;
export type IntegrationPermission = z.infer<typeof IntegrationPermissionSchema>;
export declare class IntegrationPermissionService {
    private integrations;
    connectIntegration(params: Omit<IntegrationPermission, 'createdAt'>): IntegrationPermission;
    canAccess(userId: string, companyId: string, teamId: string | undefined, integrationId: string): boolean;
    getCompanyIntegrations(companyId: string): IntegrationPermission[];
    getTeamIntegrations(teamId: string): IntegrationPermission[];
    disconnectIntegration(integrationId: string): boolean;
}
//# sourceMappingURL=integrationPermissions.d.ts.map