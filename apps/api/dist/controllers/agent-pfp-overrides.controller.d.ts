import { DatabaseService, User } from '@the-new-fuse/database';
import { AgentPfpOverrideRecord, AgentPfpOverridesService } from '../services/agent-pfp-overrides.service';
interface UpsertOverrideBody {
    namespace?: string;
    agentId: string;
    override: AgentPfpOverrideRecord;
}
interface BatchUpsertOverrideBody {
    namespace?: string;
    updates: Array<{
        agentId: string;
        override: AgentPfpOverrideRecord;
    }>;
}
interface GenerateImageBody {
    providerId: 'imfinit' | 'pollinations' | 'openai' | 'stability' | 'custom';
    modelId?: string;
    prompt: string;
    apiKey?: string;
    customEndpoint?: string;
}
export declare class AgentPfpOverridesController {
    private readonly overridesService;
    private readonly db;
    constructor(overridesService: AgentPfpOverridesService, db: DatabaseService);
    access(user: User): Promise<{
        canSave: boolean;
        tier: "STARTER" | "PRO" | "ENTERPRISE";
        active: boolean;
        storageBackend: "gcs" | "cloudflare-images" | "inline";
    }>;
    list(user: User, namespace?: string): Promise<{
        namespace: string;
        overrides: import("../services/agent-pfp-overrides.service").AgentPfpOverrideMap;
    }>;
    upsert(user: User, body: UpsertOverrideBody): Promise<{
        success: boolean;
    }>;
    upsertBatch(user: User, body: BatchUpsertOverrideBody): Promise<{
        success: boolean;
        updated: number;
    }>;
    remove(user: User, agentId: string, namespace?: string): Promise<{
        success: boolean;
    }>;
    generate(user: User, body: GenerateImageBody): Promise<{
        providerId: "openai" | "custom" | "imfinit" | "pollinations" | "stability";
        modelId: string;
        mimeType: string;
        imageDataUrl: string;
    }>;
    private generateImage;
    private resolveApiKey;
    private readImageResponse;
    private defaultModel;
    private normalizeNamespace;
}
export {};
//# sourceMappingURL=agent-pfp-overrides.controller.d.ts.map