import { z } from 'zod';
export declare const TnfIdentityCategorySchema: z.ZodEnum<{
    AGENT: "AGENT";
    SESSION: "SESSION";
    CHANNEL: "CHANNEL";
    WORKFLOW: "WORKFLOW";
    TASK: "TASK";
    SCHEDULE: "SCHEDULE";
    HARNESS: "HARNESS";
    MCP: "MCP";
    LLM: "LLM";
    USER: "USER";
    SYSTEM: "SYSTEM";
}>;
export type TnfIdentityCategory = z.infer<typeof TnfIdentityCategorySchema>;
export interface TnfCanonicalEntityParts {
    scope?: string | null;
    category: string;
    provider: string;
    name: string;
    instance?: string | number | null;
}
export interface TnfAgentIdentityRecord {
    canonicalEntityId?: string | null;
    operationalHandle: string;
    runtimeSessionId?: string | null;
    aliases: string[];
}
//# sourceMappingURL=identity.d.ts.map