import type { Request } from 'express';
import { MarketplaceService } from './marketplace.service';
import { MarketplaceCatalogQuery, MarketplaceCatalogSubmissionInput, MarketplaceExperienceSubmissionInput, MarketplacePublicationStatus } from './marketplace.types';
type MarketplacePrincipal = {
    id?: string;
    email?: string;
    role?: string;
    roles?: string[];
};
export declare class MarketplaceController {
    private readonly marketplaceService;
    constructor(marketplaceService: MarketplaceService);
    getCatalog(query: MarketplaceCatalogQuery): Promise<{
        items: import("./marketplace.types").MarketplaceCatalogItem[];
        total: number;
    }>;
    getExperiences(query: MarketplaceCatalogQuery): Promise<{
        items: import("./marketplace.types").MarketplaceCatalogItem[];
        total: number;
    }>;
    getCatalogItem(id: string): Promise<import("./marketplace.types").MarketplaceCatalogItem>;
    getResearchCounts(): Promise<{
        available: boolean;
        counts: {
            categories: number;
            sources: number;
            sourceLinks: number;
            prompts: number;
            artifacts: number;
        };
        error?: string;
    }>;
    searchResearchPrompts(q?: string, limit?: string, offset?: string): Promise<{
        items: {
            id: number;
            sourceId: number;
            title: string | null;
            promptText: string;
            url: string | null;
            license: string | null;
            tags: string | null;
            createdAt: string | null;
        }[];
        total: number;
        available: boolean;
        error?: string;
    }>;
    getResearchSources(limitPerCategory?: string): Promise<{
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
        counts: {
            categories: number;
            sources: number;
            sourceLinks: number;
            files: number;
        };
        error?: string;
    }>;
    getResearchSkillSources(limitPerCategory?: string): Promise<{
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
    searchResearchSkillFiles(q?: string, sourceId?: string, limit?: string, offset?: string): Promise<{
        items: Array<{
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
        } & {
            snippet: string;
        }>;
        total: number;
        available: boolean;
        error?: string;
    }>;
    getResearchSkillMarketplaceCounts(): Promise<{
        available: boolean;
        counts: {
            entries: number;
        };
        error?: string;
    }>;
    listResearchSkillMarketplaceEntries(q?: string, limit?: string, offset?: string): Promise<{
        items: {
            id: number;
            source: string;
            entryUrl: string;
            title: string | null;
            brief: string | null;
            tags: string | null;
            discoveredAt: string | null;
        }[];
        total: number;
        available: boolean;
        error?: string;
    }>;
    getResearchMcpCounts(): Promise<{
        available: boolean;
        counts: {
            categories: number;
            sources: number;
            links: number;
            servers: number;
        };
        error?: string;
    }>;
    getResearchMcpSources(limitPerCategory?: string): Promise<{
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
    searchResearchMcpServers(q?: string, limit?: string, offset?: string): Promise<{
        items: {
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
        }[];
        total: number;
        available: boolean;
        error?: string;
    }>;
    triggerResearchCrawl(body: {
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
    listResearchCrawlRuns(limit?: string): Promise<{
        available: boolean;
        items: {
            id: string;
            status: string;
            startedAt: string;
            finishedAt: string | null;
            stats: Record<string, unknown> | null;
            error: string | null;
        }[];
        total: number;
        error?: string;
    }>;
    getResearchCrawlRun(id: string): Promise<{
        available: boolean;
        run: {
            id: string;
            status: string;
            startedAt: string;
            finishedAt: string | null;
            stats: Record<string, unknown> | null;
            error: string | null;
        } | null;
        error?: string;
    }>;
    submitExperience(body: MarketplaceExperienceSubmissionInput, req: Request & {
        user?: MarketplacePrincipal;
    }): Promise<import("./marketplace.types").MarketplaceCatalogItem>;
    submitCatalogItem(body: MarketplaceCatalogSubmissionInput, req: Request & {
        user?: MarketplacePrincipal;
    }): Promise<import("./marketplace.types").MarketplaceCatalogItem>;
    transitionPublicationStatus(id: string, body: {
        toStatus: MarketplacePublicationStatus;
        moderatedBy?: string;
    }): Promise<import("./marketplace.types").MarketplaceCatalogItem>;
    private submitForMemberOrAdmin;
}
export {};
//# sourceMappingURL=marketplace.controller.d.ts.map