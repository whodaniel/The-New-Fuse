/**
 * Discovery Orchestrator
 *
 * Orchestrates the discovery process across all adapters with
 * sophisticated parallel processing and resource management.
 */
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ClaudeAgentAdapter } from '../adapters/ClaudeAgentAdapter';
import { PydanticAgentAdapter } from '../adapters/PydanticAgentAdapter';
import { UnifiedEntity } from '../domain/UnifiedEntity';
import { AdaptiveResourceManager } from '../../../adaptive-compute/src/AdaptiveResourceManager';
export interface DiscoveryRequest {
    id: string;
    paths: string[];
    includePatterns?: string[];
    excludePatterns?: string[];
    maxDepth?: number;
    enabledAdapters?: string[];
    parallelism?: number;
    timeout?: number;
}
export interface DiscoveryResult {
    requestId: string;
    entities: UnifiedEntity[];
    statistics: DiscoveryStatistics;
    errors: DiscoveryError[];
    duration: number;
    timestamp: Date;
}
export interface DiscoveryStatistics {
    totalEntitiesFound: number;
    entitiesBySource: Record<string, number>;
    entitiesByArchetype: Record<string, number>;
    filesProcessed: number;
    filesSkipped: number;
    processingTimeMs: number;
    averageProcessingTimePerFile: number;
}
export interface DiscoveryError {
    adapter: string;
    filePath?: string;
    error: string;
    severity: 'warning' | 'error' | 'critical';
}
export interface AdapterResult {
    adapter: string;
    entities: UnifiedEntity[];
    filesProcessed: number;
    errors: DiscoveryError[];
    duration: number;
}
export declare class DiscoveryOrchestrator {
    private readonly claudeAdapter;
    private readonly pydanticAdapter;
    private readonly resourceManager;
    private readonly eventEmitter;
    private readonly logger;
    private readonly adapters;
    private activeDiscoveries;
    constructor(claudeAdapter: ClaudeAgentAdapter, pydanticAdapter: PydanticAgentAdapter, resourceManager: AdaptiveResourceManager, eventEmitter: EventEmitter2);
    private initializeAdapters;
    discoverEntities(request: DiscoveryRequest): Promise<DiscoveryResult>;
    const discoveryPromise: any;
}
//# sourceMappingURL=DiscoveryOrchestrator.d.ts.map