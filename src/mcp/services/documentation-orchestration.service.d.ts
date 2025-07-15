import { MCPRAGClientService } from './mcp-rag-client.service.js';
import { RAGConfigurationService } from './rag-configuration.service.js';
export interface DocumentationUpdateResult {
    timestamp: string;
    totalSources: number;
    successful: number;
    failed: number;
    results: {
        [source: string]: {
            success: boolean;
            pagesProcessed?: number;
            error?: string;
            duration?: number;
        };
    };
}
export declare class DocumentationOrchestrationService {
    private readonly ragClient;
    private readonly ragConfig;
    private readonly logger;
    private isUpdating;
    private lastUpdateResult;
    constructor(ragClient: MCPRAGClientService, ragConfig: RAGConfigurationService);
    /**
     * Manually trigger documentation update for all sources
     */
    updateAllDocumentation(): Promise<DocumentationUpdateResult>;
    /**
     * Update specific documentation source
     */
    updateSpecificDocumentation(source: string, options?: {
        url?: string;
        max_depth?: number;
        max_pages?: number;
    }): Promise<DocumentationUpdateResult>;
    /**
     * Scheduled task to update documentation (runs daily at 2 AM)
     */
    scheduledDocumentationUpdate(): Promise<void>;
    /**
     * Core documentation update logic
     */
    private performDocumentationUpdate;
    /**
     * Get the status of the documentation update process
     */
    getUpdateStatus(): {
        isUpdating: boolean;
        lastUpdate: DocumentationUpdateResult | null;
    };
    /**
     * Get documentation health check for all sources
     */
    performDocumentationHealthCheck(): Promise<{
        overallHealth: 'healthy' | 'degraded' | 'unhealthy';
        sources: {
            [source: string]: {
                available: boolean;
                lastUpdated?: string;
                documentCount?: number;
                error?: string;
            };
        };
        ragServerStatus: any;
    }>;
    /**
     * Search across all documentation sources
     */
    searchAllDocumentation(query: string, options?: {
        maxResults?: number;
        includeCode?: boolean;
        sourceFilter?: string[];
    }): Promise<{
        query: string;
        totalResults: number;
        sources: {
            [source: string]: {
                results: any[];
                count: number;
                error?: string;
            };
        };
    }>;
    /**
     * Get recommendations for improving documentation coverage
     */
    getDocumentationRecommendations(): Promise<{
        recommendations: string[];
        missingTopics: string[];
        updateFrequency: string;
        healthScore: number;
    }>;
}
//# sourceMappingURL=documentation-orchestration.service.d.ts.map