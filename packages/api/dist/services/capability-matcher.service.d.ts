/**
 * Capability Matcher Service
 *
 * Advanced capability matching with semantic search, fuzzy matching,
 * and capability composition for agent discovery.
 */
import { AgentCapability, DiscoveredAgent, CapabilityComposition, CapabilityDependency } from '../types/agent-discovery.types.js';
export interface MatchScore {
    agent: DiscoveredAgent;
    capability: AgentCapability;
    score: number;
    matchReasons: string[];
}
export interface CompositionCandidate {
    composition: CapabilityComposition;
    score: number;
    reliability: number;
}
export declare class CapabilityMatcher {
    /**
     * Find best capability matches using semantic search
     */
    findCapabilityMatches(agents: DiscoveredAgent[], searchQuery: string, options?: {
        minScore?: number;
        maxResults?: number;
        preferLowLoad?: boolean;
    }): MatchScore[];
    /**
     * Calculate semantic similarity score
     */
    private calculateSemanticScore;
    /**
     * Calculate token overlap score
     */
    private calculateTokenOverlap;
    /**
     * Get human-readable match reasons
     */
    private getMatchReasons;
    /**
     * Check if capability dependencies are satisfied
     */
    checkDependencies(capability: AgentCapability, availableCapabilities: Map<string, AgentCapability>): {
        satisfied: boolean;
        missing: CapabilityDependency[];
    };
    /**
     * Check if version satisfies minimum requirement
     */
    private isVersionSatisfied;
    /**
     * Compose capabilities by chaining multiple agents
     */
    composeCapabilities(requiredCapabilities: string[], agents: DiscoveredAgent[], options?: {
        maxChainLength?: number;
        preferReliable?: boolean;
        maxCost?: number;
    }): CompositionCandidate[];
    /**
     * Find possible composition chains
     */
    private findCompositionChains;
    /**
     * Build composition from chain
     */
    private buildComposition;
    /**
     * Score a composition based on agent quality
     */
    private scoreComposition;
    /**
     * Calculate overall reliability of the chain
     */
    private calculateReliability;
    /**
     * Find similar capabilities using fuzzy matching
     */
    findSimilarCapabilities(targetCapability: string, availableCapabilities: AgentCapability[], threshold?: number): Array<{
        capability: AgentCapability;
        similarity: number;
    }>;
    /**
     * Calculate string similarity using Levenshtein distance
     */
    private calculateStringSimilarity;
    /**
     * Calculate Levenshtein distance between two strings
     */
    private levenshteinDistance;
    /**
     * Estimate cost for a capability request
     */
    estimateCost(capability: AgentCapability, estimatedTokens?: number, estimatedDuration?: number): number;
}
//# sourceMappingURL=capability-matcher.service.d.ts.map