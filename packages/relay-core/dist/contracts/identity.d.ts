import { type TnfAgentIdentityRecord, type TnfCanonicalEntityParts, type TnfIdentityCategory as TnfIdentityCategoryType } from '@the-new-fuse/protocol-contracts';
export declare const TnfIdentityCategory: import("zod").ZodEnum<{
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
export type TnfIdentityCategory = TnfIdentityCategoryType;
export type { TnfAgentIdentityRecord, TnfCanonicalEntityParts };
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