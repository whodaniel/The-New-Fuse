import { ConfigService } from '@nestjs/config';
import type { ResourceSearchMeta, ResourceSearchRequest } from '@the-new-fuse/types';
export type SearchableResource = {
    id: string;
    name: string;
    description: string;
    type: string;
    category: string;
    tags?: string[];
    featured?: boolean;
    downloads?: number;
    rating?: number;
    updatedAt: string;
    [key: string]: unknown;
};
type SearchPolicyResult<T extends SearchableResource> = {
    items: T[];
    meta: ResourceSearchMeta;
};
export declare class ResourceSearchPolicyService {
    private readonly configService;
    private readonly logger;
    private readonly traitPlanCache;
    private readonly traitEndpointCircuit;
    private readonly traitPlanCacheTtlMs;
    private readonly traitCircuitFailureThreshold;
    private readonly traitCircuitCooldownMs;
    constructor(configService: ConfigService);
    applySearchPolicy<T extends SearchableResource>(resources: T[], filter: ResourceSearchRequest): Promise<SearchPolicyResult<T>>;
    private parseSortBy;
    private normalizeTerm;
    private toUniqueTerms;
    private isTraitScreenEnabled;
    private getTraitScreenUrls;
    private readPositiveInt;
    private buildTraitPlanCacheKey;
    private getCachedTraitPlan;
    private setCachedTraitPlan;
    private isTraitEndpointCircuitOpen;
    private registerTraitEndpointSuccess;
    private registerTraitEndpointFailure;
    private fetchTraitScreenPlan;
    private extractResourceTraitTerms;
    private scoreByTraitPlan;
    private emitTraitSearchTelemetry;
}
export {};
//# sourceMappingURL=resource-search-policy.service.d.ts.map