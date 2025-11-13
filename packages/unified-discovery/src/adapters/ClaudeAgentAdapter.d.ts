/**
 * Claude Agent Discovery Adapter
 *
 * Discovers and parses Claude agents from markdown files with
 * sophisticated prompt analysis and capability extraction.
 */
import { BunOptimizedFileSystem } from '../infrastructure/BunOptimizedFileSystem';
import { UnifiedEntity } from '../domain/UnifiedEntity';
export interface ClaudeAgentDefinition {
    name: string;
    role: string;
    description: string;
    systemPrompt: string;
    capabilities: string[];
    examples?: string[];
    constraints?: string[];
    filePath: string;
}
export interface DiscoveryCriteria {
    paths: string[];
    includePatterns: string[];
    excludePatterns: string[];
    maxDepth?: number;
}
export declare class ClaudeAgentAdapter {
    private readonly fileSystem;
    private readonly logger;
    constructor(fileSystem: BunOptimizedFileSystem);
    private readonly capabilityPatterns;
    discoverEntities(criteria: DiscoveryCriteria): Promise<UnifiedEntity[]>;
    private findClaudeAgentFiles;
    private isClaudeAgentFile;
    private parseClaudeAgent;
    private parseMarkdownContent;
    private extractNameFromPath;
    private extractFromUnstructuredContent;
    private createEntityFromDefinition;
    private determineArchetype;
}
//# sourceMappingURL=ClaudeAgentAdapter.d.ts.map