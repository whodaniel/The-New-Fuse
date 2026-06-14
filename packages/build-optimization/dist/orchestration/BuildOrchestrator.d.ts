/**
 * BuildOrchestrator - Main build coordination logic
 *
 * Integrates all build optimization components to provide memory-efficient
 * build orchestration with staged execution and real-time monitoring.
 */
import { EventEmitter } from 'events';
import { IBuildOrchestrator, IConcurrencyController, IDependencyGraphAnalyzer, IMemoryMonitor, ISystemResourceDetector, ITypeScriptCompilationManager } from '../interfaces/index.js';
import { BuildEventCallback, BuildResult, BuildStrategy, SystemResources } from '../types/index.js';
/**
 * Main build orchestrator that coordinates all build optimization components
 */
export declare class BuildOrchestrator extends EventEmitter implements IBuildOrchestrator {
    private systemResourceDetector;
    private memoryMonitor;
    private dependencyAnalyzer;
    private concurrencyController;
    private typescriptManager;
    private isBuilding;
    private shouldStop;
    private currentStrategy?;
    private buildStartTime;
    private buildMetrics;
    constructor(workspaceRoot?: string, systemResourceDetector?: ISystemResourceDetector, memoryMonitor?: IMemoryMonitor, dependencyAnalyzer?: IDependencyGraphAnalyzer, concurrencyController?: IConcurrencyController, typescriptManager?: ITypeScriptCompilationManager);
    /**
     * Execute build with specified strategy
     */
    executeBuild(strategy: BuildStrategy): Promise<BuildResult>;
    /**
     * Determine optimal build strategy based on system resources
     */
    determineOptimalStrategy(systemResources: SystemResources): BuildStrategy;
    /**
     * Monitor and adjust build process based on memory usage
     */
    monitorAndAdjust(): void;
    /**
     * Register build event callback
     */
    onBuildEvent(callback: BuildEventCallback): void;
    /**
     * Stop build process
     */
    stopBuild(): void;
    /**
     * Execute staged builds with memory monitoring
     */
    private executeStagedBuilds;
    /**
     * Execute a single build stage
     */
    private executeStage;
    /**
     * Execute stage packages in parallel
     */
    private executeParallelStage;
    /**
     * Execute stage packages sequentially
     */
    private executeSequentialStage;
    /**
     * Build a single package
     */
    private buildPackage;
    /**
     * Check if package contains TypeScript files
     */
    private packageHasTypeScript;
    /**
     * Cleanup between build stages
     */
    private cleanupBetweenStages;
    /**
     * Set up memory monitoring callbacks
     */
    private setupMemoryMonitoring;
    /**
     * Emit build event
     */
    private emitBuildEvent;
    /**
     * Initialize build metrics
     */
    private initializeMetrics;
    /**
     * Calculate average memory usage from history
     */
    private calculateAverageMemoryUsage;
    /**
     * Split array into chunks
     */
    private chunkArray;
    /**
     * Sleep for specified milliseconds
     */
    private sleep;
}
//# sourceMappingURL=BuildOrchestrator.d.ts.map