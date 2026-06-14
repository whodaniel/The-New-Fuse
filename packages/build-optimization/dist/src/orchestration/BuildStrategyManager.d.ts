/**
 * BuildStrategyManager - Configuration system for build strategies
 *
 * Manages different build strategies (development, production, memory-optimized)
 * with automatic strategy selection based on system resources and environment detection.
 */
import { BuildConfiguration, BuildEnvironment, BuildStrategy, EnhancedBuildConfiguration, SystemResources } from '../types/index.js';
/**
 * Configuration validation error
 */
export declare class ConfigurationValidationError extends Error {
    field?: string | undefined;
    constructor(message: string, field?: string | undefined);
}
/**
 * Build strategy configuration manager
 */
export declare class BuildStrategyManager {
    private strategies;
    private defaultStrategy;
    constructor();
    /**
     * Get build strategy by name
     */
    getStrategy(name: string): BuildStrategy;
    /**
     * Register a custom build strategy
     */
    registerStrategy(name: string, strategy: BuildStrategy): void;
    /**
     * Get all available strategy names
     */
    getAvailableStrategies(): string[];
    /**
     * Automatically select optimal strategy based on system resources
     */
    selectOptimalStrategy(systemResources: SystemResources, environment?: BuildEnvironment): BuildStrategy;
    /**
     * Create configuration from environment variables and defaults
     */
    createConfigurationFromEnvironment(): EnhancedBuildConfiguration;
    /**
     * Validate build configuration
     */
    validateConfiguration(config: BuildConfiguration): void;
    /**
     * Validate build strategy
     */
    validateStrategy(strategy: BuildStrategy): void;
    /**
     * Get configuration presets for different system types
     */
    getConfigurationPresets(): Record<string, EnhancedBuildConfiguration>;
    /**
     * Merge configuration with defaults
     */
    mergeWithDefaults(config: Partial<EnhancedBuildConfiguration>): EnhancedBuildConfiguration;
    /**
     * Initialize default strategies
     */
    private initializeDefaultStrategies;
    /**
     * Get ultra memory optimized strategy for low-memory systems
     */
    private getUltraMemoryOptimizedStrategy;
    /**
     * Get development strategy for medium-memory systems
     */
    private getDevelopmentStrategy;
    /**
     * Get production strategy for high-memory systems
     */
    private getProductionStrategy;
    /**
     * Get CI-optimized strategy
     */
    private getCIOptimizedStrategy;
    /**
     * Detect current environment
     */
    private detectEnvironment;
    /**
     * Get default strategy for environment
     */
    private getDefaultStrategyForEnvironment;
    /**
     * Parse environment variable as number with default
     */
    private parseEnvNumber;
    /**
     * Parse environment variable as boolean with default
     */
    private parseEnvBoolean;
}
//# sourceMappingURL=BuildStrategyManager.d.ts.map