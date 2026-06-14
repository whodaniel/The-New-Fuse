import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { MarketplaceCatalogItem, MarketplaceCatalogQuery, MarketplaceCatalogSubmissionInput, MarketplaceExperienceSubmissionInput, MarketplacePublicationStatus } from './marketplace.types';
type MarketplaceResearchCounts = {
    categories: number;
    sources: number;
    sourceLinks: number;
    prompts: number;
    artifacts: number;
};
type MarketplaceResearchSkillCounts = {
    categories: number;
    sources: number;
    sourceLinks: number;
    files: number;
};
type MarketplaceResearchSkillMarketplaceCounts = {
    entries: number;
};
type MarketplaceResearchMcpCounts = {
    categories: number;
    sources: number;
    links: number;
    servers: number;
};
type MarketplaceResearchPromptRow = {
    id: number;
    sourceId: number;
    title: string | null;
    promptText: string;
    url: string | null;
    license: string | null;
    tags: string | null;
    createdAt: string | null;
};
type MarketplaceResearchSkillFileRow = {
    id: number;
    sourceId: number;
    sourceName: string | null;
    categoryName: string | null;
    repoUrl: string | null;
    fileUrl: string;
    filePath: string | null;
    title: string | null;
    content: string;
    license: string | null;
    tags: string | null;
    createdAt: string | null;
};
type MarketplaceResearchSkillMarketplaceEntryRow = {
    id: number;
    source: string;
    entryUrl: string;
    title: string | null;
    brief: string | null;
    tags: string | null;
    discoveredAt: string | null;
};
type MarketplaceResearchMcpServerRow = {
    id: number;
    sourceId: number | null;
    serverName: string;
    serverUrl: string | null;
    repoUrl: string | null;
    description: string | null;
    tags: string | null;
    maintainer: string | null;
    stars: number | null;
    license: string | null;
    transport: string | null;
    createdAt: string | null;
};
type MarketplaceCrawlRunRow = {
    id: string;
    status: string;
    startedAt: string;
    finishedAt: string | null;
    stats: Record<string, unknown> | null;
    error: string | null;
};
export declare class MarketplaceService implements OnModuleInit, OnModuleDestroy {
    private initialized;
    private dbEnabled;
    private dbClient;
    private readonly activeResearchRuns;
    private readonly researchRunStartedAt;
    private readonly seedItems;
    constructor();
    onModuleInit(): Promise<void>;
    private syncSeedItems;
    onModuleDestroy(): Promise<void>;
    getCatalog(query: MarketplaceCatalogQuery): Promise<{
        items: MarketplaceCatalogItem[];
        total: number;
    }>;
    getExperiences(query: MarketplaceCatalogQuery): Promise<{
        items: MarketplaceCatalogItem[];
        total: number;
    }>;
    getResearchCounts(): Promise<{
        available: boolean;
        counts: MarketplaceResearchCounts;
        error?: string;
    }>;
    searchResearchPrompts(input: {
        q?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        items: MarketplaceResearchPromptRow[];
        total: number;
        available: boolean;
        error?: string;
    }>;
    getResearchSources(input?: {
        limitPerCategory?: number;
    }): Promise<{
        available: boolean;
        categories: Array<{
            id: number;
            name: string;
            sources: Array<{
                id: number;
                name: string;
                url: string;
                brief: string | null;
            }>;
        }>;
        error?: string;
    }>;
    getResearchSkillCounts(): Promise<{
        available: boolean;
        counts: MarketplaceResearchSkillCounts;
        error?: string;
    }>;
    getResearchSkillSources(input?: {
        limitPerCategory?: number;
    }): Promise<{
        available: boolean;
        categories: Array<{
            id: number;
            name: string;
            sources: Array<{
                id: number;
                name: string;
                url: string;
                brief: string | null;
            }>;
        }>;
        error?: string;
    }>;
    searchResearchSkillFiles(input: {
        q?: string;
        sourceId?: number;
        limit?: number;
        offset?: number;
    }): Promise<{
        items: Array<MarketplaceResearchSkillFileRow & {
            snippet: string;
        }>;
        total: number;
        available: boolean;
        error?: string;
    }>;
    getResearchSkillMarketplaceCounts(): Promise<{
        available: boolean;
        counts: MarketplaceResearchSkillMarketplaceCounts;
        error?: string;
    }>;
    listResearchSkillMarketplaceEntries(input: {
        q?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        items: MarketplaceResearchSkillMarketplaceEntryRow[];
        total: number;
        available: boolean;
        error?: string;
    }>;
    getResearchMcpCounts(): Promise<{
        available: boolean;
        counts: MarketplaceResearchMcpCounts;
        error?: string;
    }>;
    getResearchMcpSources(input?: {
        limitPerCategory?: number;
    }): Promise<{
        available: boolean;
        categories: Array<{
            id: number;
            name: string;
            sources: Array<{
                id: number;
                name: string;
                url: string;
                brief: string | null;
            }>;
        }>;
        error?: string;
    }>;
    searchResearchMcpServers(input: {
        q?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        items: MarketplaceResearchMcpServerRow[];
        total: number;
        available: boolean;
        error?: string;
    }>;
    triggerResearchCrawl(input?: {
        command?: string;
        dryRun?: boolean;
    }): Promise<{
        accepted: boolean;
        runId: string;
        status: string;
        command?: string;
        message?: string;
        error?: string;
    }>;
    getResearchCrawlRun(id: string): Promise<{
        available: boolean;
        run: MarketplaceCrawlRunRow | null;
        error?: string;
    }>;
    listResearchCrawlRuns(limit?: number): Promise<{
        available: boolean;
        items: MarketplaceCrawlRunRow[];
        total: number;
        error?: string;
    }>;
    getItemById(id: string): Promise<MarketplaceCatalogItem | null>;
    submitExperience(input: MarketplaceExperienceSubmissionInput): Promise<MarketplaceCatalogItem>;
    submitCatalogItem(input: MarketplaceCatalogSubmissionInput): Promise<MarketplaceCatalogItem>;
    transitionPublicationStatus(input: {
        id: string;
        toStatus: MarketplacePublicationStatus;
        moderatedBy?: string;
    }): Promise<MarketplaceCatalogItem | null>;
    private ensureInitialized;
    private getAllItems;
    private persistItem;
    private extractRows;
    private mapCatalogRowToItem;
    private mapCrawlRunRow;
    private upsertCrawlRun;
    private tryParseLastJsonObject;
    private validateSubmissionInput;
    private sanitizeText;
    private normalizeUrl;
    private normalizeUniqueStrings;
    private generateUniqueId;
    private generateUniqueSlug;
    private normalizeKind;
    private normalizeStatus;
    private normalizeLimit;
    private normalizeOffset;
    private isTransitionAllowed;
}
export {};
//# sourceMappingURL=marketplace.service.d.ts.map