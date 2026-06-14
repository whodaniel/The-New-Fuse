/**
 * TypeScript Compilation Manager
 *
 * Optimizes TypeScript compilation for memory efficiency through:
 * - Incremental compilation using project references
 * - Memory-efficient compiler options
 * - Build info file management
 * - Memory cleanup between compilation stages
 */
import { ITypeScriptCompilationManager } from '../interfaces/index.js';
import { MemoryCleanupConfig } from './MemoryCleanupUtility.js';
/**
 * TypeScript project configuration
 */
export interface TypeScriptProject {
    /** Project name */
    name: string;
    /** Path to tsconfig.json */
    configPath: string;
    /** Project dependencies */
    dependencies: string[];
    /** Estimated memory usage in MB */
    estimatedMemoryUsage: number;
}
/**
 * TypeScript compilation options
 */
export interface TypeScriptCompilationOptions {
    /** Enable incremental compilation */
    incremental?: boolean;
    /** Build info file path */
    tsBuildInfoFile?: string;
    /** Preserve watch output */
    preserveWatchOutput?: boolean;
    /** Skip lib check for faster compilation */
    skipLibCheck?: boolean;
    /** Skip type checking for faster compilation */
    noCheck?: boolean;
    /** Maximum memory usage in MB */
    maxMemoryUsage?: number;
}
/**
 * Compilation metrics
 */
export interface CompilationMetrics {
    /** Total compilation time in milliseconds */
    totalTime: number;
    /** Peak memory usage in MB */
    peakMemoryUsage: number;
    /** Number of projects compiled */
    projectsCompiled: number;
    /** Number of successful compilations */
    successfulCompilations: number;
    /** Number of failed compilations */
    failedCompilations: number;
    /** Compilation errors */
    errors: string[];
}
/**
 * TypeScript Compilation Manager implementation
 */
export declare class TypeScriptCompilationManager implements ITypeScriptCompilationManager {
    private incrementalEnabled;
    private compilationOptions;
    private memoryCleanupUtility;
    private metrics;
    private activeProcesses;
    constructor(options?: TypeScriptCompilationOptions, cleanupConfig?: MemoryCleanupConfig);
    /**
     * Compile TypeScript projects with optimization
     */
    compileProjects(projects: string[], options?: TypeScriptCompilationOptions): Promise<boolean>;
    /**
     * Enable or disable incremental compilation
     */
    enableIncrementalCompilation(enabled: boolean): void;
    /**
     * Clean up TypeScript compiler memory
     */
    cleanupCompilerMemory(): Promise<void>;
    /**
     * Get compilation metrics
     */
    getCompilationMetrics(): CompilationMetrics;
    /**
     * Get memory cleanup statistics
     */
    getMemoryCleanupStatistics(): {
        totalCleanups: number;
        successfulCleanups: number;
        averageMemoryFreed: number;
        averageDuration: number;
        totalMemoryFreed: number;
    };
    /**
     * Get memory cleanup history
     */
    getMemoryCleanupHistory(): import("./MemoryCleanupUtility.js").MemoryCleanupResult[];
    /**
     * Discover TypeScript projects from given paths
     */
    private discoverTypeScriptProjects;
    /**
     * Find tsconfig.json file in project directory
     */
    private findTsConfig;
    /**
     * Analyze TypeScript project configuration
     */
    private analyzeTypeScriptProject;
    /**
     * Extract project name from config path
     */
    private extractProjectName;
    /**
     * Extract project references from TypeScript config
     */
    private extractProjectReferences;
    /**
     * Estimate memory usage for TypeScript project
     */
    private estimateMemoryUsage;
    /**
     * Sort projects by dependencies for optimal build order
     */
    private sortProjectsByDependencies;
    /**
     * Compile a single TypeScript project
     */
    private compileProject;
    /**
     * Build TypeScript compiler arguments
     */
    private buildCompilerArguments;
    /**
     * Execute TypeScript compiler as child process
     */
    private executeTypeScriptCompiler;
    /**
     * Find TypeScript compiler executable
     */
    private findTypeScriptCompiler;
    /**
     * Get current memory usage in MB
     */
    private getCurrentMemoryUsage;
    /**
     * Terminate all active TypeScript processes
     */
    private terminateActiveProcesses;
    /**
     * Reset compilation metrics
     */
    private resetMetrics;
}
//# sourceMappingURL=TypeScriptCompilationManager.d.ts.map