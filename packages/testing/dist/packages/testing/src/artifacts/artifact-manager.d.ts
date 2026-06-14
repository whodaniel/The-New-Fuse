/**
 * Test Artifact Generation Utilities for The New Fuse
 *
 * This module provides utilities for generating and managing test artifacts
 * such as snapshots, logs, and other outputs from tests.
 */
/**
 * Interface for artifact metadata
 */
export interface ArtifactMetadata {
    timestamp: string;
    testName?: string;
    testFile?: string;
    category?: string;
    tags?: string[];
    [key: string]: any;
}
/**
 * Options for creating an artifact
 */
export interface CreateArtifactOptions {
    name: string;
    content: any;
    extension?: string;
    metadata?: Partial<ArtifactMetadata>;
    stringify?: boolean;
    pretty?: boolean;
}
/**
 * Class for managing test artifacts
 */
export declare class ArtifactManager {
    private baseDir;
    private runId;
    /**
     * Create a new ArtifactManager
     * @param options Options for the artifact manager
     */
    constructor(options?: {
        baseDir?: string;
        runId?: string;
    });
    /**
     * Get the directory for the current test run
     */
    getRunDirectory(): string;
    /**
     * Create a new artifact
     * @param options Options for creating the artifact
     * @returns Path to the created artifact
     */
    createArtifact(options: CreateArtifactOptions): string;
    /**
     * Create a snapshot artifact
     * @param name Name of the snapshot
     * @param data Data to snapshot
     * @param metadata Additional metadata
     * @returns Path to the created snapshot
     */
    createSnapshot(name: string, data: any, metadata?: Partial<ArtifactMetadata>): string;
    /**
     * Create a log artifact
     * @param name Name of the log
     * @param entries Log entries
     * @param metadata Additional metadata
     * @returns Path to the created log
     */
    createLog(name: string, entries: any[], metadata?: Partial<ArtifactMetadata>): string;
    /**
     * Create a report artifact
     * @param name Name of the report
     * @param data Report data
     * @param metadata Additional metadata
     * @returns Path to the created report
     */
    createReport(name: string, data: any, metadata?: Partial<ArtifactMetadata>): string;
    /**
     * List all artifacts for the current run
     * @returns Array of artifact paths
     */
    listArtifacts(): string[];
    /**
     * Get an artifact by name
     * @param name Name of the artifact
     * @returns Artifact content or null if not found
     */
    getArtifact(name: string): any | null;
}
/**
 * Create a Jest matcher for artifact generation
 * @param artifactManager Artifact manager instance
 * @returns Jest matcher
 */
export declare function createArtifactMatcher(artifactManager: ArtifactManager): any;
export declare const artifactManager: ArtifactManager;
export declare const artifactMatchers: any;
export default artifactManager;
//# sourceMappingURL=artifact-manager.d.ts.map