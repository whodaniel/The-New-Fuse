import { z } from 'zod';
export declare const SharedIntegrationContextSchema: z.ZodObject<{
    contextId: z.ZodString;
    integrationId: z.ZodString;
    teamId: z.ZodString;
    sharedBy: z.ZodString;
    contextType: z.ZodEnum<{
        custom: "custom";
        meta_ads: "meta_ads";
        analytics: "analytics";
        crm: "crm";
        communication: "communication";
    }>;
    credentials: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    accessControl: z.ZodObject<{
        read: z.ZodDefault<z.ZodArray<z.ZodString>>;
        write: z.ZodDefault<z.ZodArray<z.ZodString>>;
        admin: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>;
    createdAt: z.ZodNumber;
    updatedAt: z.ZodNumber;
}, z.core.$strip>;
export type SharedIntegrationContext = z.infer<typeof SharedIntegrationContextSchema>;
export declare class SharedIntegrationContextService {
    private contexts;
    createSharedContext(params: Omit<SharedIntegrationContext, 'createdAt' | 'updatedAt'>): SharedIntegrationContext;
    grantAccess(contextId: string, userId: string, level: 'read' | 'write' | 'admin'): boolean;
    revokeAccess(contextId: string, userId: string): boolean;
    canAccess(contextId: string, userId: string, requiredLevel?: 'read' | 'write' | 'admin'): boolean;
    getTeamContexts(teamId: string): SharedIntegrationContext[];
}
//# sourceMappingURL=sharedIntegrationContext.d.ts.map