/**
 * Configuration Utilities for Unified Orchestration
 *
 * This module provides utility functions for configuration management,
 * validation, and agent scoring algorithms.
 */
import { UnifiedAgent, AgentConfiguration, AgentSelectionCriteria, AgentRegistryConfig, MessageProcessingConfig } from '../types/UnifiedAgentTypes';
/**
 * Create default configuration for unified orchestration
 */
export declare function createDefaultConfig(): {
    agentRegistry: AgentRegistryConfig;
    messageProcessing: MessageProcessingConfig;
};
/**
 * Validate agent configuration
 */
export declare function validateAgentConfiguration(config: AgentConfiguration): {
    valid: boolean;
    errors: string[];
    warnings: string[];
};
/**
 * Calculate agent score based on selection criteria
 */
export declare function calculateAgentScore(agent: UnifiedAgent, criteria: AgentSelectionCriteria): {
    score: number;
    reasoning: string;
    breakdown: Record<string, number>;
};
/**
 * Merge multiple configurations with proper precedence
 */
export declare function mergeConfigurations<T extends Record<string, any>>(base: T, ...overrides: Partial<T>[]): T;
//# sourceMappingURL=ConfigUtils.d.ts.map