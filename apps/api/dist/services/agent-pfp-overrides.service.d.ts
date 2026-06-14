import { DatabaseService } from '@the-new-fuse/database';
import { StorageService } from '@the-new-fuse/infrastructure';
import { PayPalService } from '../modules/billing/paypal.service';
export type PfpSource = 'generated' | 'upload' | 'cloud';
export interface AgentPfpOverrideRecord {
    imageUrl: string;
    prompt?: string;
    provider?: string;
    model?: string;
    style?: string;
    source: PfpSource;
    updatedAt: string;
}
export type AgentPfpOverrideMap = Record<string, AgentPfpOverrideRecord>;
export declare class AgentPfpOverridesService {
    private readonly db;
    private readonly payPalService;
    private readonly storageService;
    private readonly logger;
    private schemaReady;
    constructor(db: DatabaseService, payPalService: PayPalService, storageService: StorageService);
    getCloudAccess(userId: string): Promise<{
        canSave: boolean;
        tier: 'STARTER' | 'PRO' | 'ENTERPRISE';
        active: boolean;
        storageBackend: 'gcs' | 'cloudflare-images' | 'inline';
    }>;
    listOverrides(userId: string, namespace?: string): Promise<AgentPfpOverrideMap>;
    upsertOverride(userId: string, namespace: string, agentId: string, override: AgentPfpOverrideRecord, options?: {
        requirePaid?: boolean;
    }): Promise<void>;
    removeOverride(userId: string, namespace: string, agentId: string, options?: {
        requirePaid?: boolean;
    }): Promise<void>;
    private assertCloudWriteAccess;
    private ensureSchema;
    private createSchema;
    private normalizeNamespace;
    private getStorageBackend;
    private hasCloudflareImagesConfig;
    private getCloudflareAccountId;
    private getCloudflareApiToken;
    private prepareImageForStorage;
    private parseDataUrl;
    private uploadToCloudflareImages;
    private extensionForMimeType;
    private normalizeSource;
    private toIso;
    private toSqlString;
    private toSqlNullableString;
    private escapeSqlLiteral;
}
//# sourceMappingURL=agent-pfp-overrides.service.d.ts.map