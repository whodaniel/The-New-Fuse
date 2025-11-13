"use strict";
/**
 * Content Safety Service
 *
 * Content moderation and safety filtering for generative media
 *
 * @module ContentSafetyService
 * @since 2025-10-06
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentSafetyService = void 0;
const GenerativeMediaProviderRegistry_1 = require("./GenerativeMediaProviderRegistry");
class ContentSafetyService {
    policies = [];
    safetyChecks = [];
    moderationProviders = [];
    constructor() {
        this.setupDefaultPolicies();
        this.setupModerationProviders();
    }
    /**
     * Check content safety before generation
     */
    async checkPromptSafety(request, userId) {
        const policy = this.getApplicablePolicy(request.mediaType, userId);
        if (!policy.enabled) {
            return {
                safe: true,
                confidence: 1.0,
                categories: []
            };
        }
        // Check custom rules first
        const customRuleResult = this.checkCustomRules(request.prompt, policy);
        if (!customRuleResult.safe) {
            return customRuleResult;
        }
        // Check with moderation providers
        const moderationResults = await Promise.all(this.moderationProviders.map(provider => provider.moderateText(request.prompt, policy.strictness)));
        // Combine results
        const combinedResult = this.combineResults(moderationResults);
        // Record safety check
        await this.recordSafetyCheck({
            content: request.prompt,
            contentType: 'prompt',
            mediaType: request.mediaType,
            result: combinedResult,
            provider: 'combined',
            userId
        });
        return combinedResult;
    }
    /**
     * Check generated content safety
     */
    async checkOutputSafety(outputUrl, mediaType, providerId, userId) {
        const policy = this.getApplicablePolicy(mediaType, userId);
        if (!policy.enabled) {
            return {
                safe: true,
                confidence: 1.0,
                categories: []
            };
        }
        try {
            let result;
            switch (mediaType) {
                case GenerativeMediaProviderRegistry_1.MediaType.IMAGE:
                    result = await this.moderateImage(outputUrl, policy);
                    break;
                case GenerativeMediaProviderRegistry_1.MediaType.VIDEO:
                    result = await this.moderateVideo(outputUrl, policy);
                    break;
                case GenerativeMediaProviderRegistry_1.MediaType.AUDIO:
                case GenerativeMediaProviderRegistry_1.MediaType.MUSIC:
                case GenerativeMediaProviderRegistry_1.MediaType.VOICE:
                    result = await this.moderateAudio(outputUrl, policy);
                    break;
                default:
                    result = { safe: true, confidence: 1.0, categories: [] };
            }
            // Record safety check
            await this.recordSafetyCheck({
                content: outputUrl,
                contentType: 'output',
                mediaType,
                result,
                provider: providerId,
                userId
            });
            return result;
        }
        catch (error) {
            console.error('Content safety check failed:', error);
            // Fail safe - allow content but log the error
            return {
                safe: true,
                confidence: 0.0,
                categories: [],
                warnings: ['Safety check failed - content allowed by default']
            };
        }
    }
    /**
     * Create or update safety policy
     */
    async updatePolicy(policy) {
        const existingIndex = this.policies.findIndex(p => p.id === policy.id);
        if (existingIndex >= 0) {
            this.policies[existingIndex] = { ...this.policies[existingIndex], ...policy };
            return this.policies[existingIndex];
        }
        else {
            const newPolicy = {
                name: 'Custom Policy',
                enabled: true,
                strictness: 'moderate',
                categories: {
                    adult_content: true,
                    violence: true,
                    hate_speech: true,
                    harassment: true,
                    illegal_activities: true,
                    self_harm: true,
                    dangerous_content: true,
                    deceptive_content: false,
                    spam: false,
                    copyright_violation: false
                },
                customRules: [],
                exemptions: {},
                ...policy
            };
            this.policies.push(newPolicy);
            return newPolicy;
        }
    }
    /**
     * Get safety statistics
     */
    getSafetyStats(period = 'today') {
        const checks = this.getChecksForPeriod(period);
        const totalChecks = checks.length;
        const blockedContent = checks.filter(c => !c.result.safe).length;
        const warningContent = checks.filter(c => c.result.warnings && c.result.warnings.length > 0).length;
        const safeContent = checks.filter(c => c.result.safe && (!c.result.warnings || c.result.warnings.length === 0)).length;
        const blockRate = totalChecks > 0 ? (blockedContent / totalChecks) * 100 : 0;
        // Top categories
        const categoryCount = {};
        checks.forEach(check => {
            check.result.categories.forEach(cat => {
                categoryCount[cat.category] = (categoryCount[cat.category] || 0) + 1;
            });
        });
        const topCategories = Object.entries(categoryCount)
            .map(([category, count]) => ({ category, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        // By media type
        const byMediaType = {};
        checks.forEach(check => {
            const mediaType = check.mediaType.toString();
            if (!byMediaType[mediaType]) {
                byMediaType[mediaType] = { total: 0, blocked: 0 };
            }
            byMediaType[mediaType].total += 1;
            if (!check.result.safe) {
                byMediaType[mediaType].blocked += 1;
            }
        });
        return {
            totalChecks,
            blockedContent,
            warningContent,
            safeContent,
            blockRate,
            topCategories,
            byMediaType
        };
    }
    /**
     * Add custom safety rule
     */
    addCustomRule(policyId, rule) {
        const policy = this.policies.find(p => p.id === policyId);
        if (!policy) {
            throw new Error(`Policy ${policyId} not found`);
        }
        const newRule = {
            ...rule,
            id: this.generateId()
        };
        policy.customRules.push(newRule);
        return newRule;
    }
    /**
     * Get flagged content for review
     */
    getFlaggedContent(limit = 50) {
        return this.safetyChecks
            .filter(check => !check.result.safe || (check.result.warnings && check.result.warnings.length > 0))
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }
    // Private methods
    getApplicablePolicy(mediaType, userId) {
        // Find most specific policy that applies
        const applicablePolicies = this.policies.filter(policy => {
            if (!policy.enabled)
                return false;
            if (policy.exemptions.userIds && userId && policy.exemptions.userIds.includes(userId))
                return false;
            if (policy.exemptions.mediaTypes && policy.exemptions.mediaTypes.includes(mediaType))
                return false;
            return true;
        });
        // Return the strictest policy, or default if none found
        return applicablePolicies.sort((a, b) => {
            const strictnessOrder = { 'permissive': 0, 'moderate': 1, 'strict': 2 };
            return strictnessOrder[b.strictness] - strictnessOrder[a.strictness];
        })[0] || this.policies[0];
    }
    checkCustomRules(content, policy) {
        const violations = [];
        const blockedReasons = [];
        for (const rule of policy.customRules) {
            let matches = false;
            if (typeof rule.pattern === 'string') {
                matches = content.toLowerCase().includes(rule.pattern.toLowerCase());
            }
            else {
                matches = rule.pattern.test(content);
            }
            if (matches) {
                violations.push({
                    category: rule.name,
                    severity: rule.severity,
                    confidence: 0.9,
                    description: rule.description
                });
                if (rule.action === 'block') {
                    blockedReasons.push(rule.description);
                }
            }
        }
        return {
            safe: blockedReasons.length === 0,
            confidence: violations.length > 0 ? 0.9 : 1.0,
            categories: violations,
            blockedReasons: blockedReasons.length > 0 ? blockedReasons : undefined
        };
    }
    async moderateImage(imageUrl, policy) {
        // Placeholder for image moderation
        // Would integrate with services like Google Vision API, AWS Rekognition, etc.
        return {
            safe: true,
            confidence: 0.8,
            categories: []
        };
    }
    async moderateVideo(videoUrl, policy) {
        // Placeholder for video moderation
        // Would extract frames and analyze with image moderation + audio analysis
        return {
            safe: true,
            confidence: 0.8,
            categories: []
        };
    }
    async moderateAudio(audioUrl, policy) {
        // Placeholder for audio moderation
        // Would use speech-to-text + text moderation for voice content
        return {
            safe: true,
            confidence: 0.8,
            categories: []
        };
    }
    combineResults(results) {
        if (results.length === 0) {
            return { safe: true, confidence: 1.0, categories: [] };
        }
        const safe = results.every(r => r.safe);
        const confidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
        const categories = results.flatMap(r => r.categories);
        const blockedReasons = results.flatMap(r => r.blockedReasons || []);
        const warnings = results.flatMap(r => r.warnings || []);
        return {
            safe,
            confidence,
            categories,
            blockedReasons: blockedReasons.length > 0 ? blockedReasons : undefined,
            warnings: warnings.length > 0 ? warnings : undefined
        };
    }
    async recordSafetyCheck(check) {
        const safetyCheck = {
            ...check,
            id: this.generateId(),
            timestamp: new Date()
        };
        this.safetyChecks.push(safetyCheck);
        // Keep only recent checks to prevent memory issues
        if (this.safetyChecks.length > 10000) {
            this.safetyChecks = this.safetyChecks.slice(-5000);
        }
        return safetyCheck;
    }
    getChecksForPeriod(period) {
        const now = new Date();
        let startDate;
        switch (period) {
            case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            default:
                startDate = new Date(0);
        }
        return this.safetyChecks.filter(check => check.timestamp >= startDate);
    }
    setupDefaultPolicies() {
        this.policies = [
            {
                id: 'default',
                name: 'Default Safety Policy',
                enabled: true,
                strictness: 'moderate',
                categories: {
                    adult_content: true,
                    violence: true,
                    hate_speech: true,
                    harassment: true,
                    illegal_activities: true,
                    self_harm: true,
                    dangerous_content: true,
                    deceptive_content: false,
                    spam: false,
                    copyright_violation: false
                },
                customRules: [
                    {
                        id: 'explicit-content',
                        name: 'Explicit Content',
                        pattern: /\b(nude|naked|sex|porn|explicit)\b/i,
                        action: 'block',
                        severity: 'high',
                        description: 'Contains explicit content keywords'
                    },
                    {
                        id: 'violence',
                        name: 'Violence',
                        pattern: /\b(kill|murder|violence|blood|gore)\b/i,
                        action: 'warn',
                        severity: 'medium',
                        description: 'Contains violence-related keywords'
                    }
                ],
                exemptions: {}
            }
        ];
    }
    setupModerationProviders() {
        // Setup moderation providers (OpenAI, Perspective API, etc.)
        this.moderationProviders = [
            new OpenAIModerationProvider(),
            new PerspectiveModerationProvider()
        ];
    }
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
}
exports.ContentSafetyService = ContentSafetyService;
// Mock implementations
class OpenAIModerationProvider {
    async moderateText(text, strictness) {
        // Mock implementation - would call OpenAI Moderation API
        return {
            safe: true,
            confidence: 0.9,
            categories: []
        };
    }
}
class PerspectiveModerationProvider {
    async moderateText(text, strictness) {
        // Mock implementation - would call Google Perspective API
        return {
            safe: true,
            confidence: 0.85,
            categories: []
        };
    }
}
//# sourceMappingURL=ContentSafetyService.js.map