/**
 * Capability Matcher Service
 *
 * Advanced capability matching with semantic search, fuzzy matching,
 * and capability composition for agent discovery.
 */
export class CapabilityMatcher {
    /**
     * Find best capability matches using semantic search
     */
    findCapabilityMatches(agents, searchQuery, options = {}) {
        const matches = [];
        for (const agent of agents) {
            for (const capability of agent.registration.capabilities) {
                const score = this.calculateSemanticScore(capability, searchQuery);
                const matchReasons = this.getMatchReasons(capability, searchQuery);
                if (score >= (options.minScore || 0.3)) {
                    matches.push({
                        agent,
                        capability,
                        score,
                        matchReasons,
                    });
                }
            }
        }
        // Sort by score, with load as tiebreaker if preferred
        matches.sort((a, b) => {
            const scoreDiff = b.score - a.score;
            if (scoreDiff !== 0)
                return scoreDiff;
            if (options.preferLowLoad) {
                return a.agent.load - b.agent.load;
            }
            return 0;
        });
        return options.maxResults ? matches.slice(0, options.maxResults) : matches;
    }
    /**
     * Calculate semantic similarity score
     */
    calculateSemanticScore(capability, query) {
        const queryLower = query.toLowerCase();
        const nameLower = capability.name.toLowerCase();
        const descLower = capability.description.toLowerCase();
        let score = 0;
        // Exact name match - highest score
        if (nameLower === queryLower) {
            score = 1.0;
        }
        // Name contains query
        else if (nameLower.includes(queryLower)) {
            score = 0.8;
        }
        // Query contains name
        else if (queryLower.includes(nameLower)) {
            score = 0.7;
        }
        // Description match
        else if (descLower.includes(queryLower)) {
            score = 0.6;
        }
        // Token overlap
        else {
            score = this.calculateTokenOverlap(queryLower, nameLower, descLower);
        }
        // Apply confidence boost
        score *= capability.confidence;
        // Boost based on language/framework matches if present in query
        const tokens = queryLower.split(/\s+/);
        const langMatch = capability.languages?.some((lang) => tokens.some((token) => lang.toLowerCase().includes(token)));
        const frameworkMatch = capability.frameworks?.some((fw) => tokens.some((token) => fw.toLowerCase().includes(token)));
        if (langMatch)
            score *= 1.2;
        if (frameworkMatch)
            score *= 1.2;
        return Math.min(score, 1.0);
    }
    /**
     * Calculate token overlap score
     */
    calculateTokenOverlap(query, name, description) {
        const queryTokens = new Set(query.split(/\s+/).filter((t) => t.length > 2));
        const nameTokens = new Set(name.split(/[-_\s]+/).filter((t) => t.length > 2));
        const descTokens = new Set(description.split(/\s+/).filter((t) => t.length > 2));
        const allTokens = new Set([...nameTokens, ...descTokens]);
        let overlapCount = 0;
        for (const token of queryTokens) {
            for (const target of allTokens) {
                if (target.includes(token) || token.includes(target)) {
                    overlapCount++;
                    break;
                }
            }
        }
        return queryTokens.size > 0 ? (overlapCount / queryTokens.size) * 0.5 : 0;
    }
    /**
     * Get human-readable match reasons
     */
    getMatchReasons(capability, query) {
        const reasons = [];
        const queryLower = query.toLowerCase();
        const nameLower = capability.name.toLowerCase();
        const descLower = capability.description.toLowerCase();
        if (nameLower === queryLower) {
            reasons.push('Exact capability name match');
        }
        else if (nameLower.includes(queryLower)) {
            reasons.push('Capability name contains search term');
        }
        else if (descLower.includes(queryLower)) {
            reasons.push('Description matches search term');
        }
        if (capability.confidence > 0.9) {
            reasons.push('Very high confidence');
        }
        else if (capability.confidence > 0.7) {
            reasons.push('High confidence');
        }
        const tokens = queryLower.split(/\s+/);
        if (capability.languages) {
            const matchedLangs = capability.languages.filter((lang) => tokens.some((token) => lang.toLowerCase().includes(token)));
            if (matchedLangs.length > 0) {
                reasons.push(`Supports ${matchedLangs.join(', ')}`);
            }
        }
        if (capability.frameworks) {
            const matchedFrameworks = capability.frameworks.filter((fw) => tokens.some((token) => fw.toLowerCase().includes(token)));
            if (matchedFrameworks.length > 0) {
                reasons.push(`Supports ${matchedFrameworks.join(', ')}`);
            }
        }
        return reasons;
    }
    /**
     * Check if capability dependencies are satisfied
     */
    checkDependencies(capability, availableCapabilities) {
        if (!capability.dependencies || capability.dependencies.length === 0) {
            return { satisfied: true, missing: [] };
        }
        const missing = [];
        for (const dep of capability.dependencies) {
            const available = availableCapabilities.get(dep.capability);
            if (!available) {
                if (!dep.optional) {
                    missing.push(dep);
                }
                continue;
            }
            // Check version if specified
            if (dep.minVersion && !this.isVersionSatisfied(available.version, dep.minVersion)) {
                if (!dep.optional) {
                    missing.push(dep);
                }
            }
        }
        return {
            satisfied: missing.length === 0,
            missing,
        };
    }
    /**
     * Check if version satisfies minimum requirement
     */
    isVersionSatisfied(current, required) {
        const currentParts = current.split('.').map(Number);
        const requiredParts = required.split('.').map(Number);
        for (let i = 0; i < Math.max(currentParts.length, requiredParts.length); i++) {
            const curr = currentParts[i] || 0;
            const req = requiredParts[i] || 0;
            if (curr > req)
                return true;
            if (curr < req)
                return false;
        }
        return true;
    }
    /**
     * Compose capabilities by chaining multiple agents
     */
    composeCapabilities(requiredCapabilities, agents, options = {}) {
        const maxChainLength = options.maxChainLength || 5;
        const compositions = [];
        // Build capability map
        const capabilityMap = new Map();
        for (const agent of agents) {
            for (const capability of agent.registration.capabilities) {
                if (!capabilityMap.has(capability.name)) {
                    capabilityMap.set(capability.name, []);
                }
                capabilityMap.get(capability.name).push(agent);
            }
        }
        // Find composition chains
        const chains = this.findCompositionChains(requiredCapabilities, capabilityMap, maxChainLength);
        for (const chain of chains) {
            const composition = this.buildComposition(chain, requiredCapabilities);
            // Filter by max cost if specified
            if (options.maxCost && composition.totalCost && composition.totalCost > options.maxCost) {
                continue;
            }
            const score = this.scoreComposition(chain, options.preferReliable);
            const reliability = this.calculateReliability(chain);
            compositions.push({
                composition,
                score,
                reliability,
            });
        }
        // Sort by score
        compositions.sort((a, b) => b.score - a.score);
        return compositions;
    }
    /**
     * Find possible composition chains
     */
    findCompositionChains(requiredCapabilities, capabilityMap, maxChainLength) {
        const chains = [];
        const findChain = (remaining, currentChain, usedAgents) => {
            if (remaining.length === 0) {
                chains.push([...currentChain]);
                return;
            }
            if (currentChain.length >= maxChainLength) {
                return;
            }
            const nextCapability = remaining[0];
            const candidates = capabilityMap.get(nextCapability) || [];
            for (const candidate of candidates) {
                // Avoid using the same agent twice
                if (usedAgents.has(candidate.registration.agentId)) {
                    continue;
                }
                currentChain.push(candidate);
                usedAgents.add(candidate.registration.agentId);
                findChain(remaining.slice(1), currentChain, usedAgents);
                currentChain.pop();
                usedAgents.delete(candidate.registration.agentId);
            }
        };
        findChain(requiredCapabilities, [], new Set());
        return chains;
    }
    /**
     * Build composition from chain
     */
    buildComposition(chain, capabilities) {
        let totalCost = 0;
        let estimatedTime = 0;
        for (let i = 0; i < chain.length; i++) {
            const agent = chain[i];
            const capabilityName = capabilities[i];
            const capability = agent.registration.capabilities.find((cap) => cap.name === capabilityName);
            if (capability?.pricing?.perInvocation) {
                totalCost += capability.pricing.perInvocation;
            }
            estimatedTime += agent.metrics.avgResponseTime;
        }
        return {
            name: `Composed: ${capabilities.join(' → ')}`,
            agentChain: chain.map((agent) => agent.registration.agentId),
            capabilities,
            totalCost: totalCost > 0 ? totalCost : undefined,
            estimatedTime,
        };
    }
    /**
     * Score a composition based on agent quality
     */
    scoreComposition(chain, preferReliable = false) {
        let score = 1.0;
        for (const agent of chain) {
            // Factor in success rate
            const reliabilityScore = agent.metrics.successRate;
            // Factor in load (prefer less loaded agents)
            const loadScore = 1 - agent.load;
            // Factor in health
            const healthScore = agent.metrics.isHealthy ? 1.0 : 0.5;
            const agentScore = preferReliable
                ? reliabilityScore * 0.6 + loadScore * 0.2 + healthScore * 0.2
                : reliabilityScore * 0.4 + loadScore * 0.4 + healthScore * 0.2;
            score *= agentScore;
        }
        // Penalize longer chains slightly
        score *= Math.pow(0.95, chain.length - 1);
        return score;
    }
    /**
     * Calculate overall reliability of the chain
     */
    calculateReliability(chain) {
        let reliability = 1.0;
        for (const agent of chain) {
            reliability *= agent.metrics.successRate;
        }
        return reliability;
    }
    /**
     * Find similar capabilities using fuzzy matching
     */
    findSimilarCapabilities(targetCapability, availableCapabilities, threshold = 0.6) {
        const results = [];
        for (const capability of availableCapabilities) {
            const similarity = this.calculateStringSimilarity(targetCapability.toLowerCase(), capability.name.toLowerCase());
            if (similarity >= threshold) {
                results.push({ capability, similarity });
            }
        }
        return results.sort((a, b) => b.similarity - a.similarity);
    }
    /**
     * Calculate string similarity using Levenshtein distance
     */
    calculateStringSimilarity(str1, str2) {
        const maxLength = Math.max(str1.length, str2.length);
        if (maxLength === 0)
            return 1.0;
        const distance = this.levenshteinDistance(str1, str2);
        return 1 - distance / maxLength;
    }
    /**
     * Calculate Levenshtein distance between two strings
     */
    levenshteinDistance(str1, str2) {
        const m = str1.length;
        const n = str2.length;
        const dp = Array(m + 1)
            .fill(null)
            .map(() => Array(n + 1).fill(0));
        for (let i = 0; i <= m; i++)
            dp[i][0] = i;
        for (let j = 0; j <= n; j++)
            dp[0][j] = j;
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (str1[i - 1] === str2[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1];
                }
                else {
                    dp[i][j] = Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1;
                }
            }
        }
        return dp[m][n];
    }
    /**
     * Estimate cost for a capability request
     */
    estimateCost(capability, estimatedTokens, estimatedDuration) {
        let cost = 0;
        if (capability.pricing) {
            if (capability.pricing.perInvocation) {
                cost += capability.pricing.perInvocation;
            }
            if (capability.pricing.perToken && estimatedTokens) {
                cost += capability.pricing.perToken * estimatedTokens;
            }
            if (capability.pricing.perMinute && estimatedDuration) {
                const minutes = estimatedDuration / 60000;
                cost += capability.pricing.perMinute * minutes;
            }
        }
        return cost;
    }
}
//# sourceMappingURL=capability-matcher.service.js.map