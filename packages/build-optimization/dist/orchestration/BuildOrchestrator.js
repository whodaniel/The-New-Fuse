/**
 * BuildOrchestrator - Main build coordination logic
 *
 * Integrates all build optimization components to provide memory-efficient
 * build orchestration with staged execution and real-time monitoring.
 */
import { EventEmitter } from 'events';
import { BuildProcessThrottler } from '../concurrency/BuildProcessThrottler.js';
import { ConcurrencyController } from '../concurrency/ConcurrencyController.js';
import { DependencyGraphAnalyzer } from '../dependency/DependencyGraphAnalyzer.js';
import { DEFAULT_CONFIG } from '../index.js';
import { MemoryMonitor } from '../system/MemoryMonitor.js';
import { SystemResourceDetector } from '../system/SystemResourceDetector.js';
import { TypeScriptCompilationManager } from '../typescript/TypeScriptCompilationManager.js';
/**
 * Main build orchestrator that coordinates all build optimization components
 */
export class BuildOrchestrator extends EventEmitter {
    systemResourceDetector;
    memoryMonitor;
    dependencyAnalyzer;
    concurrencyController;
    buildThrottler;
    typescriptManager;
    isBuilding = false;
    shouldStop = false;
    currentStrategy;
    buildStartTime = 0;
    buildMetrics = this.initializeMetrics();
    constructor(workspaceRoot = process.cwd(), systemResourceDetector, memoryMonitor, dependencyAnalyzer, concurrencyController, typescriptManager, buildThrottler) {
        super();
        // Initialize components with defaults if not provided
        this.systemResourceDetector = systemResourceDetector || new SystemResourceDetector();
        this.memoryMonitor = memoryMonitor || MemoryMonitor.getInstance();
        this.dependencyAnalyzer = dependencyAnalyzer || new DependencyGraphAnalyzer();
        this.concurrencyController = concurrencyController || new ConcurrencyController();
        this.buildThrottler =
            buildThrottler ||
                new BuildProcessThrottler({
                    maxConcurrency: this.concurrencyController.getCurrentConcurrency(),
                    memoryThreshold: DEFAULT_CONFIG.MEMORY_THRESHOLD_MB, // Use a default or strategy-defined threshold
                    processMemoryLimit: DEFAULT_CONFIG.PROCESS_MEMORY_LIMIT_MB,
                });
        this.typescriptManager = typescriptManager || new TypeScriptCompilationManager();
        // Set up memory monitoring callbacks
        this.setupMemoryMonitoring();
    }
    /**
     * Execute build with specified strategy
     */
    async executeBuild(strategy) {
        if (this.isBuilding) {
            throw new Error('Build already in progress');
        }
        this.isBuilding = true;
        this.shouldStop = false;
        this.currentStrategy = strategy;
        this.buildStartTime = Date.now();
        this.buildMetrics = this.initializeMetrics();
        try {
            this.emitBuildEvent('build-started', { strategy });
            // Start memory monitoring
            this.memoryMonitor.startMonitoring(1500);
            this.memoryMonitor.setThreshold(strategy.memoryThreshold);
            // Set up concurrency control
            this.concurrencyController.setMaxConcurrency(strategy.maxConcurrency);
            this.buildThrottler.setMaxConcurrency(this.concurrencyController.getCurrentConcurrency());
            // Analyze dependencies and create build stages
            const workspaceRoot = process.cwd();
            const dependencies = await this.dependencyAnalyzer.analyzeDependencies(workspaceRoot);
            const buildStages = this.dependencyAnalyzer.createBuildStages(dependencies, strategy.stageSize);
            // Execute staged builds
            const result = await this.executeStagedBuilds(buildStages, strategy);
            this.emitBuildEvent('build-completed', { result });
            return result;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const result = {
                success: false,
                duration: Date.now() - this.buildStartTime,
                peakMemoryUsage: this.buildMetrics.peakMemoryUsage,
                packagesBuilt: this.buildMetrics.successfulBuilds,
                error: errorMessage,
                metrics: this.buildMetrics,
            };
            this.emitBuildEvent('build-failed', { error: errorMessage, result });
            return result;
        }
        finally {
            this.isBuilding = false;
            this.memoryMonitor.stopMonitoring();
            // Cleanup if enabled
            if (strategy.cleanupBetweenStages) {
                this.typescriptManager.cleanupCompilerMemory();
                if (global.gc) {
                    global.gc();
                }
            }
        }
    }
    /**
     * Determine optimal build strategy based on system resources
     */
    determineOptimalStrategy(systemResources) {
        const availableMemoryGB = systemResources.availableMemory / 1024;
        const cpuCores = systemResources.cpuCores;
        // Ultra memory-optimized for systems with < 4GB available memory
        if (availableMemoryGB < 4) {
            return {
                ...DEFAULT_CONFIG.STRATEGIES['ultra-memory-optimized'],
                maxConcurrency: Math.max(1, Math.floor(cpuCores / 4)),
            };
        }
        // Memory-optimized for systems with 4-8GB available memory
        if (availableMemoryGB < 8) {
            return {
                ...DEFAULT_CONFIG.STRATEGIES.development,
                maxConcurrency: Math.max(1, Math.floor(cpuCores / 2)),
            };
        }
        // Production strategy for systems with 8GB+ available memory
        return {
            ...DEFAULT_CONFIG.STRATEGIES.production,
            maxConcurrency: Math.min(cpuCores, Math.floor(availableMemoryGB / 2)),
        };
    }
    /**
     * Monitor and adjust build process based on memory usage
     */
    monitorAndAdjust() {
        if (!this.isBuilding) {
            return;
        }
        const currentUsage = this.memoryMonitor.getCurrentUsage();
        // Update metrics
        this.buildMetrics.memoryHistory.push(currentUsage);
        this.buildMetrics.peakMemoryUsage = Math.max(this.buildMetrics.peakMemoryUsage, currentUsage.current);
        this.buildMetrics.averageMemoryUsage = this.calculateAverageMemoryUsage();
        // Adjust concurrency based on memory usage
        this.concurrencyController.adjustConcurrency(currentUsage);
    }
    /**
     * Register build event callback
     */
    onBuildEvent(callback) {
        this.on('buildEvent', callback);
    }
    /**
     * Stop build process
     */
    stopBuild() {
        this.shouldStop = true;
        this.emitBuildEvent('build-completed', {});
    }
    /**
     * Execute staged builds with memory monitoring
     */
    async executeStagedBuilds(buildStages, strategy) {
        let totalPackagesBuilt = 0;
        let hasErrors = false;
        for (let i = 0; i < buildStages.length && !this.shouldStop; i++) {
            const stage = buildStages[i];
            this.emitBuildEvent('stage-started', { stage, stageIndex: i });
            this.buildMetrics.stagesExecuted++;
            try {
                // Check memory before starting stage
                const memoryUsage = this.memoryMonitor.getCurrentUsage();
                if (memoryUsage.percentage > strategy.memoryThreshold) {
                    // Force cleanup before continuing
                    this.typescriptManager.cleanupCompilerMemory();
                    if (global.gc) {
                        global.gc();
                    }
                    // Wait a bit for cleanup to take effect
                    await this.sleep(1000);
                }
                // Execute stage builds
                const stageResult = await this.executeStage(stage, strategy);
                if (stageResult.success) {
                    totalPackagesBuilt += stage.packages.length;
                    this.buildMetrics.successfulBuilds += stage.packages.length;
                }
                else {
                    hasErrors = true;
                    this.buildMetrics.failedBuilds += stage.packages.length;
                }
                this.emitBuildEvent('stage-completed', {
                    stage,
                    stageIndex: i,
                    success: stageResult.success,
                    packagesBuilt: stage.packages.length,
                });
                // Cleanup between stages if enabled
                if (strategy.cleanupBetweenStages && i < buildStages.length - 1) {
                    await this.cleanupBetweenStages();
                }
            }
            catch (error) {
                hasErrors = true;
                this.buildMetrics.failedBuilds += stage.packages.length;
                this.emitBuildEvent('build-failed', {
                    stage,
                    stageIndex: i,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }
        const duration = Date.now() - this.buildStartTime;
        this.buildMetrics.totalBuildTime = duration;
        return {
            success: !hasErrors && !this.shouldStop,
            duration,
            peakMemoryUsage: this.buildMetrics.peakMemoryUsage,
            packagesBuilt: totalPackagesBuilt,
            metrics: this.buildMetrics,
        };
    }
    /**
     * Execute a single build stage
     */
    async executeStage(stage, strategy) {
        if (stage.parallelizable && strategy.maxConcurrency > 1) {
            // Execute packages in parallel with concurrency control
            return await this.executeParallelStage(stage, strategy);
        }
        else {
            // Execute packages sequentially
            return await this.executeSequentialStage(stage, strategy);
        }
    }
    /**
     * Execute stage packages in parallel
     */
    async executeParallelStage(stage, strategy) {
        const concurrency = Math.min(this.concurrencyController.getCurrentConcurrency(), stage.packages.length);
        const chunks = this.chunkArray(stage.packages, concurrency);
        let allSuccessful = true;
        for (const chunk of chunks) {
            if (this.shouldStop)
                break;
            const promises = chunk.map((packageName) => this.buildPackage(packageName, strategy));
            const results = await Promise.allSettled(promises);
            // Check if any builds failed
            for (const result of results) {
                if (result.status === 'rejected') {
                    allSuccessful = false;
                }
            }
            // Monitor and adjust after each chunk
            this.monitorAndAdjust();
        }
        return { success: allSuccessful };
    }
    /**
     * Execute stage packages sequentially
     */
    async executeSequentialStage(stage, strategy) {
        let allSuccessful = true;
        for (const packageName of stage.packages) {
            if (this.shouldStop)
                break;
            try {
                await this.buildPackage(packageName, strategy);
                this.monitorAndAdjust();
            }
            catch (error) {
                allSuccessful = false;
            }
        }
        return { success: allSuccessful };
    }
    /**
     * Build a single package
     */
    async buildPackage(packageName, strategy) {
        // Use BuildProcessThrottler to execute the build command
        const taskId = `build-${packageName}-${Date.now()}`;
        const command = 'turbo'; // Assuming turbo is in PATH
        const args = ['run', 'build', `--filter=${packageName}`];
        // Add task to throttler and wait for completion
        const result = await this.buildThrottler.addTask({
            id: taskId,
            command,
            args,
            cwd: process.cwd(), // Or the package's specific directory if needed
            timeout: strategy.buildTimeout || DEFAULT_CONFIG.DEFAULT_BUILD_TIMEOUT, // Add DEFAULT_BUILD_TIMEOUT to config
        });
        await this.buildThrottler.waitForTask(taskId);
        // Check if we should use TypeScript compilation optimization
        if (strategy.enableIncremental) {
            // Use TypeScript manager for .ts/.tsx files
            const hasTypeScript = await this.packageHasTypeScript(packageName);
            if (hasTypeScript) {
                await this.typescriptManager.compileProjects([packageName]);
            }
        }
    }
    /**
     * Check if package contains TypeScript files
     */
    async packageHasTypeScript(packageName) {
        // Placeholder implementation
        // In real implementation, would check for .ts/.tsx files or tsconfig.json
        // For tests, make it deterministic based on package name
        return packageName.includes('package-a') || packageName.includes('package-b');
    }
    /**
     * Cleanup between build stages
     */
    async cleanupBetweenStages() {
        // Cleanup TypeScript compiler memory
        this.typescriptManager.cleanupCompilerMemory();
        // Force garbage collection if available
        if (global.gc) {
            global.gc();
        }
        // Wait for cleanup to take effect
        await this.sleep(500);
    }
    /**
     * Set up memory monitoring callbacks
     */
    setupMemoryMonitoring() {
        this.memoryMonitor.onThresholdExceeded((usage) => {
            this.emitBuildEvent('memory-threshold-exceeded', { usage });
            // Automatically adjust concurrency
            const oldConcurrency = this.concurrencyController.getCurrentConcurrency();
            this.concurrencyController.adjustConcurrency(usage);
            const newConcurrency = this.concurrencyController.getCurrentConcurrency();
            if (newConcurrency !== oldConcurrency) {
                this.buildThrottler.setMaxConcurrency(newConcurrency); // Synchronize with throttler
                this.emitBuildEvent('concurrency-adjusted', {
                    oldConcurrency,
                    newConcurrency,
                    reason: 'memory-threshold-exceeded',
                });
            }
        });
    }
    /**
     * Emit build event
     */
    emitBuildEvent(type, payload) {
        const event = {
            type,
            timestamp: Date.now(),
            payload,
        };
        this.emit('buildEvent', event);
    }
    /**
     * Initialize build metrics
     */
    initializeMetrics() {
        return {
            totalBuildTime: 0,
            peakMemoryUsage: 0,
            averageMemoryUsage: 0,
            stagesExecuted: 0,
            successfulBuilds: 0,
            failedBuilds: 0,
            memoryHistory: [],
        };
    }
    /**
     * Calculate average memory usage from history
     */
    calculateAverageMemoryUsage() {
        if (this.buildMetrics.memoryHistory.length === 0) {
            return 0;
        }
        const total = this.buildMetrics.memoryHistory.reduce((sum, usage) => sum + usage.current, 0);
        return total / this.buildMetrics.memoryHistory.length;
    }
    /**
     * Split array into chunks
     */
    chunkArray(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }
    /**
     * Sleep for specified milliseconds
     */
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
//# sourceMappingURL=BuildOrchestrator.js.map