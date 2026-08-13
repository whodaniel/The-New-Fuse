// @ts-nocheck
import { z } from 'zod';
export declare const TnfIdentityCategory: z.ZodEnum<{
    USER: "USER";
    SYSTEM: "SYSTEM";
    LLM: "LLM";
    WORKFLOW: "WORKFLOW";
    TASK: "TASK";
    AGENT: "AGENT";
    SESSION: "SESSION";
    CHANNEL: "CHANNEL";
    SCHEDULE: "SCHEDULE";
    HARNESS: "HARNESS";
    MCP: "MCP";
}>;
export type TnfIdentityCategory = z.infer<typeof TnfIdentityCategory>;
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
export declare function buildCanonicalEntityId(parts: TnfCanonicalEntityParts): string;
export declare function normalizeCanonicalEntityId(input: string): string;
export declare function isCanonicalEntityId(input: unknown): input is string;
export declare function normalizeOperationalHandle(input: string): string;
export declare function buildIdentityAliases(input: {
    canonicalEntityId?: string | null;
    operationalHandle: string;
    runtimeSessionId?: string | null;
    aliases?: Array<string | null | undefined>;
}): string[];
export declare function createAgentIdentityRecord(input: {
    canonicalEntityId?: string | null;
    operationalHandle: string;
    runtimeSessionId?: string | null;
    aliases?: Array<string | null | undefined>;
}): TnfAgentIdentityRecord;
export declare function buildIdentityAliasMap(records: TnfAgentIdentityRecord[]): Map<string, TnfAgentIdentityRecord>;
export declare function resolveIdentityAlias(alias: string, recordsOrMap: TnfAgentIdentityRecord[] | Map<string, TnfAgentIdentityRecord>): TnfAgentIdentityRecord | null;
//# sourceMappingURL=identity.d.ts.map