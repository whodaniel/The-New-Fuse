/**
 * System resource detection for build optimization
 */
import { ISystemResourceDetector } from '../interfaces/index.js';
import { MemoryUsage, SystemResources } from '../types/index.js';
/**
 * Detects system resources including memory, CPU, and platform information
 */
export declare class SystemResourceDetector implements ISystemResourceDetector {
    private static instance;
    /**
     * Get singleton instance
     */
    static getInstance(): SystemResourceDetector;
    /**
     * Get current system resources
     */
    getSystemResources(): Promise<SystemResources>;
    /**
     * Get current memory usage using Node.js process.memoryUsage()
     */
    getCurrentMemoryUsage(): MemoryUsage;
    /**
     * Check if system has sufficient resources for build
     */
    hasSufficientResources(requiredMemory: number): boolean;
    /**
     * Get total system memory in MB
     */
    private getTotalMemoryMB;
    /**
     * Get available system memory in MB
     */
    private getAvailableMemoryMB;
    /**
     * Get detailed memory information for debugging
     */
    getDetailedMemoryInfo(): {
        system: {
            total: number;
            free: number;
            used: number;
        };
        process: NodeJS.MemoryUsage;
        platform: string;
    };
    /**
     * Get CPU information
     */
    getCPUInfo(): {
        cores: number;
        model: string;
        speed: number;
        architecture: string;
    };
    /**
     * Get platform-specific memory limits
     */
    getPlatformMemoryLimits(): {
        maxHeapSize: number;
        recommendedMaxConcurrency: number;
    };
    /**
     * Check if running in CI environment
     */
    isRunningInCI(): boolean;
    /**
     * Get environment-specific resource recommendations
     */
    getEnvironmentRecommendations(): {
        maxConcurrency: number;
        memoryThreshold: number;
        enableIncrementalBuilds: boolean;
        stageSize: number;
    };
}
//# sourceMappingURL=SystemResourceDetector.d.ts.map